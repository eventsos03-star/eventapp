import type { NextFunction, Response } from 'express';
import User from '../../models/user.model.js';
import { AppError } from '../../shared/utils/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { verifyAccessToken } from '../../shared/services/token.service.js';
import { ACCESS_COOKIE_NAME } from '../../shared/constants/index.js';
import { USER_STATUS } from '../../shared/constants/index.js';

/**
 * Protects routes. Requires a valid access token from the httpOnly access
 * cookie or a Bearer Authorization header, and loads the user into req.user.
 * Rejects blocked, pending or deleted accounts.
 */
export const authenticate = asyncHandler(async (req, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies?.[ACCESS_COOKIE_NAME];
  if (!token) {
    throw new AppError('Not authenticated. Please login.', 401);
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError('Session expired. Please login again.', 401);
  }

  const user = await User.findById(payload.id).where({ deletedAt: null });
  if (!user) throw new AppError('Account no longer exists', 401);
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AppError(user.status === 'BLOCKED' ? 'Your account has been blocked' : 'Please verify your email before logging in', 403);
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };
  req.sessionId = payload.sessionId;

  next();
});
