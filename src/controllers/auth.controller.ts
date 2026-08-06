import type { Response } from 'express';
import { env } from '../config/env.js';
import { REFRESH_COOKIE_MAX_AGE_MS, REFRESH_COOKIE_NAME } from '../constants/index.js';
import * as authService from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getClientInfo } from '../utils/getClientInfo.js';
import { success } from '../utils/response.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, cookieOptions);
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

function getRefreshToken(req: { cookies?: Record<string, string> }): string {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw new AppError('No refresh token provided', 401);
  return token;
}

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  success(res, 201, 'Account created. Check your email to verify your account.', user);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.query.token as string | undefined;
  const user = await authService.verifyEmail(token ?? '');
  success(res, 200, 'Email verified successfully. You can now login.', user);
});

export const login = asyncHandler(async (req, res) => {
  const client = getClientInfo(req);
  const { accessToken, refreshToken, user } = await authService.login(req.body.email, req.body.password, client);
  setRefreshCookie(res, refreshToken);
  success(res, 200, 'Login successful', { accessToken, user });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (refreshToken) await authService.logout(refreshToken);
  clearRefreshCookie(res);
  success(res, 200, 'Logged out successfully');
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user!.id);
  clearRefreshCookie(res);
  success(res, 200, 'Logged out of all devices');
});

export const refresh = asyncHandler(async (req, res) => {
  const client = getClientInfo(req);
  const { accessToken, refreshToken, user } = await authService.refresh(getRefreshToken(req), client);
  setRefreshCookie(res, refreshToken);
  success(res, 200, 'Token refreshed', { accessToken, user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  success(res, 200, 'If an account exists with that email, a password reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  success(res, 200, 'Password reset successfully. Please login with your new password.');
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword, req.sessionId);
  success(res, 200, 'Password changed successfully.');
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user!.id);
  success(res, 200, 'Profile fetched successfully', user);
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user!.id, req.body);
  success(res, 200, 'Profile updated successfully', user);
});

export const google = asyncHandler(async (req, res) => {
  const client = getClientInfo(req);
  const { accessToken, refreshToken, user, isNewUser } = await authService.googleAuth(req.body.credential, client);
  setRefreshCookie(res, refreshToken);
  success(res, isNewUser ? 201 : 200, 'Google login successful', { accessToken, user, isNewUser });
});
