import { Types } from 'mongoose';
import { env } from '../config/env.js';
import {
  RESET_PASSWORD_EXPIRES_MS,
  USER_PROVIDER,
  USER_STATUS,
  VERIFY_EMAIL_EXPIRES_MS,
} from '../constants/index.js';
import { sendPasswordResetEmail, sendVerifyEmail } from '../emails/index.js';
import User, { type SafeUser } from '../models/user.model.js';
import Session from '../models/session.model.js';
import { AppError } from '../utils/AppError.js';
import type { ClientInfo } from '../utils/getClientInfo.js';
import { generateEmailToken, hashToken } from '../utils/token.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './token.service.js';
import { getUserByEmail, getUserById, getSafeUserById } from './user.service.js';

const MAX_REFRESH_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

/**
 * Creates a session document for a refresh token. The session id is embedded
 * inside the token so we can look the session back up when it is presented.
 */
async function createSession(
  userId: string,
  refreshToken: string,
  client: ClientInfo,
): Promise<string> {
  const sessionId = new Types.ObjectId();
  await Session.create({
    _id: sessionId,
    user: userId,
    refreshToken: hashToken(refreshToken),
    browser: client.browser,
    ip: client.ip,
    userAgent: client.userAgent,
    expiresAt: new Date(Date.now() + MAX_REFRESH_AGE_MS),
  });
  return sessionId.toString();
}

async function issueTokens(user: SafeUser, client: ClientInfo): Promise<AuthResult> {
  const sessionId = new Types.ObjectId();
  const refreshToken = signRefreshToken({ id: user.id, sessionId: sessionId.toString() });

  await Session.create({
    _id: sessionId,
    user: user.id,
    refreshToken: hashToken(refreshToken),
    browser: client.browser,
    ip: client.ip,
    userAgent: client.userAgent,
    expiresAt: new Date(Date.now() + MAX_REFRESH_AGE_MS),
  });

  const accessToken = signAccessToken({
    id: user.id,
    role: user.role,
    sessionId: sessionId.toString(),
  });

  return { accessToken, refreshToken, user };
}

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const { firstName, lastName, email, password } = input;

  const existing = await getUserByEmail(email);
  if (existing) throw new AppError('An account with this email already exists', 409);

  const { raw, hashed } = generateEmailToken();

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    provider: USER_PROVIDER.LOCAL,
    emailVerified: false,
    status: USER_STATUS.PENDING,
    verificationToken: hashed,
    verificationExpires: new Date(Date.now() + VERIFY_EMAIL_EXPIRES_MS),
  });

  await sendVerifyEmail(user.email, user.firstName, raw);

  return user.toSafeObject();
}

export async function verifyEmail(token: string): Promise<SafeUser> {
  if (!token) throw new AppError('Verification token is required', 400);

  const user = await User.findOne({
    verificationToken: hashToken(token),
    verificationExpires: { $gt: new Date() },
    deletedAt: null,
  });

  if (!user) throw new AppError('Invalid or expired verification link', 400);

  user.emailVerified = true;
  user.status = USER_STATUS.ACTIVE;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();

  return user.toSafeObject();
}

export async function login(email: string, password: string, client: ClientInfo): Promise<AuthResult> {
  const user = await getUserByEmail(email, true);
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status === USER_STATUS.BLOCKED) {
    throw new AppError('Your account has been blocked. Please contact support.', 403);
  }
  if (!user.emailVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  return issueTokens(user.toSafeObject(), client);
}

export async function logout(refreshToken: string): Promise<void> {
  await Session.findOneAndDelete({ refreshToken: hashToken(refreshToken) });
}

export async function logoutAll(userId: string): Promise<void> {
  await Session.deleteMany({ user: userId });
}

export async function refresh(refreshToken: string, client: ClientInfo): Promise<AuthResult> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const session = await Session.findById(payload.sessionId);
  if (!session || session.refreshToken !== hashToken(refreshToken)) {
    throw new AppError('Session expired. Please login again.', 401);
  }
  if (session.expiresAt.getTime() < Date.now()) {
    await session.deleteOne();
    throw new AppError('Session expired. Please login again.', 401);
  }

  const user = await getUserById(payload.id);
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    await session.deleteOne();
    throw new AppError('Account is not active. Please login again.', 401);
  }

  // Rotate the refresh token: create a new session and remove the old one.
  const safe = user.toSafeObject();
  const issued = await issueTokens(safe, client);
  await session.deleteOne();

  return { accessToken: issued.accessToken, refreshToken: issued.refreshToken, user: safe };
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await getUserByEmail(email);
  if (!user) return; // Do not reveal whether the email exists.

  const { raw, hashed } = generateEmailToken();
  user.resetPasswordToken = hashed;
  user.resetPasswordExpires = new Date(Date.now() + RESET_PASSWORD_EXPIRES_MS);
  await user.save();

  await sendPasswordResetEmail(user.email, user.firstName, raw);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (!token) throw new AppError('Reset token is required', 400);

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
    deletedAt: null,
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Resetting the password invalidates every existing session.
  await Session.deleteMany({ user: user._id });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  currentSessionId?: string,
): Promise<void> {
  const user = await getUserById(userId, true);
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  // Log out every device except the current one.
  const query: Record<string, unknown> = { user: userId };
  if (currentSessionId) query._id = { $ne: currentSessionId };
  await Session.deleteMany(query);
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  return getSafeUserById(userId);
}

interface GoogleProfile {
  sub: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  error?: string;
}

async function verifyGoogleToken(credential: string): Promise<GoogleProfile> {
  let res: globalThis.Response;
  try {
    res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
  } catch {
    throw new AppError('Could not verify Google token', 502);
  }

  if (!res.ok) throw new AppError('Invalid Google token', 401);
  const profile = (await res.json()) as GoogleProfile;
  if (profile.error || !profile.sub) throw new AppError('Invalid Google token', 401);

  // If a client ID is configured, reject tokens issued for another app.
  if (env.GOOGLE_CLIENT_ID && profile.aud !== env.GOOGLE_CLIENT_ID) {
    throw new AppError('Invalid Google token', 401);
  }

  return profile;
}

export async function googleAuth(
  credential: string,
  client: ClientInfo,
): Promise<AuthResult & { isNewUser: boolean }> {
  const profile = await verifyGoogleToken(credential);

  const email = profile.email?.toLowerCase();
  if (!email) throw new AppError('Google account has no email address', 400);

  const emailVerified = profile.email_verified === true || profile.email_verified === 'true';
  if (!emailVerified) throw new AppError('Google email is not verified', 400);

  const nameParts = profile.name?.trim().split(/\s+/).filter(Boolean) || [];
  const firstName = nameParts[0] || 'Google';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  let user = await User.findOne({ email, deletedAt: null });
  let isNewUser = false;

  if (user) {
    // Link Google to the existing account instead of creating a duplicate.
    let changed = false;
    if (!user.googleId) {
      user.googleId = profile.sub;
      changed = true;
    }
    if (!user.emailVerified) {
      user.emailVerified = true;
      changed = true;
    }
    if (user.status === USER_STATUS.PENDING) {
      user.status = USER_STATUS.ACTIVE;
      changed = true;
    }
    if (profile.picture && !user.avatar) {
      user.avatar = profile.picture;
      changed = true;
    }
    if (changed) await user.save();
  } else {
    user = await User.create({
      firstName,
      lastName,
      email,
      provider: USER_PROVIDER.GOOGLE,
      googleId: profile.sub,
      avatar: profile.picture,
      emailVerified: true,
      status: USER_STATUS.ACTIVE,
    });
    isNewUser = true;
  }

  const { accessToken, refreshToken } = await issueTokens(user.toSafeObject(), client);

  return { accessToken, refreshToken, user: user.toSafeObject(), isNewUser };
}
