import { Types } from 'mongoose';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { env } from '../../config/env.js';
import {
  RESET_PASSWORD_EXPIRES_MS,
  USER_PROVIDER,
  USER_STATUS,
  VERIFY_EMAIL_EXPIRES_MS,
} from '../../shared/constants/index.js';
import { sendPasswordResetEmail, sendVerifyEmail } from '../../shared/emails/index.js';
import User, { type SafeUser } from '../../models/user.model.js';
import Session from '../../models/session.model.js';
import { AppError } from '../../shared/utils/AppError.js';
import type { ClientInfo } from '../../shared/utils/getClientInfo.js';
import { generateEmailToken, hashToken } from '../../shared/utils/token.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/services/token.service.js';
import { getUserByEmail, getUserById, getSafeUserById } from '../../shared/services/user.service.js';

const MAX_REFRESH_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID || undefined);

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
    deletedAt: null,
  });

  if (!user) throw new AppError('Invalid or expired verification link', 400);

  if (user.emailVerified && user.status === USER_STATUS.ACTIVE) {
    return user.toSafeObject();
  }

  if (!user.verificationExpires || user.verificationExpires.getTime() < Date.now()) {
    throw new AppError('Invalid or expired verification link', 400);
  }

  user.emailVerified = true;
  user.status = USER_STATUS.ACTIVE;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();

  return user.toSafeObject();
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await getUserByEmail(email);
  if (!user) return; // Do not reveal whether the email exists.
  if (user.emailVerified) return;
  if (user.status === USER_STATUS.BLOCKED) return;

  const { raw, hashed } = generateEmailToken();
  user.verificationToken = hashed;
  user.verificationExpires = new Date(Date.now() + VERIFY_EMAIL_EXPIRES_MS);
  await user.save();

  await sendVerifyEmail(user.email, user.firstName, raw);
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

export interface SessionInfo {
  id: string;
  browser: string;
  ip: string;
  userAgent: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export async function listSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
  const sessions = await Session.find({ user: userId }).sort({ createdAt: -1 });
  return sessions.map((session) => ({
    id: session._id.toString(),
    browser: session.browser,
    ip: session.ip,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt ?? session.createdAt,
    expiresAt: session.expiresAt,
    isCurrent: session._id.toString() === currentSessionId,
  }));
}

export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  const session = await Session.findOneAndDelete({ _id: sessionId, user: userId });
  if (!session) throw new AppError('Session not found', 404);
}

export async function refresh(refreshToken: string, client: ClientInfo): Promise<AuthResult> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const session = await Session.findById(payload.sessionId);
  if (!session) throw new AppError('Session expired. Please login again.', 401);
  if (session.refreshToken !== hashToken(refreshToken)) {
    // A token that does not match the stored hash was likely stolen or
    // replayed after rotation, so the whole session is revoked.
    await session.deleteOne();
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
  if (!user) throw new AppError('User not found', 404);

  if (user.provider === USER_PROVIDER.GOOGLE) {
    throw new AppError('Google accounts sign in with Google. Set a password to use this feature.', 400);
  }

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  // Log out every device except the current one.
  const query: Record<string, unknown> = { user: userId };
  if (currentSessionId) query._id = { $ne: currentSessionId };
  await Session.deleteMany(query);
}

export async function setPassword(
  userId: string,
  newPassword: string,
  currentSessionId?: string,
): Promise<void> {
  const user = await getUserById(userId, true);
  if (!user) throw new AppError('User not found', 404);

  if (user.password) {
    throw new AppError('This account already has a password', 400);
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

export async function updateProfile(
  userId: string,
  input: { firstName?: string; lastName?: string },
): Promise<SafeUser> {
  const user = await getUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  if (input.firstName !== undefined) user.firstName = input.firstName;
  if (input.lastName !== undefined) user.lastName = input.lastName;
  await user.save();

  return user.toSafeObject();
}

interface GoogleProfile {
  sub: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
}

/**
 * Verifies a Google ID token locally (signature, issuer and expiry) using
 * google-auth-library. When GOOGLE_CLIENT_ID is configured the audience is
 * also checked, so tokens minted for other apps are rejected.
 */
async function verifyGoogleToken(credential: string): Promise<GoogleProfile> {
  let payload: TokenPayload | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID || undefined,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Invalid Google token', 401);
  }

  if (!payload || !payload.sub) throw new AppError('Invalid Google token', 401);

  // If a client ID is configured, reject tokens issued for another app.
  if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new AppError('Invalid Google token', 401);
  }

  return {
    sub: payload.sub,
    aud: payload.aud,
    email: payload.email,
    email_verified: payload.email_verified,
    name: payload.name,
    picture: payload.picture,
  };
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
    if (user.status === USER_STATUS.BLOCKED) {
      throw new AppError('Your account has been blocked. Please contact support.', 403);
    }
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
