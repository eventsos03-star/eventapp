import type { NextFunction, Response } from 'express';
import User from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../services/token.service.js';

/**
 * Protects routes. Requires a valid Bearer access token and loads the user
 * into req.user. Rejects blocked or deleted accounts.
 */
export const authenticate = asyncHandler(async (req, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Not authenticated. Please login.', 401);
  }

  const token = header.split(' ')[1];
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError('Session expired. Please login again.', 401);
  }

  const user = await User.findById(payload.id).where({ deletedAt: null });
  if (!user) throw new AppError('Account no longer exists', 401);
  if (user.status === 'BLOCKED') {
    throw new AppError('Your account has been blocked', 403);
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
