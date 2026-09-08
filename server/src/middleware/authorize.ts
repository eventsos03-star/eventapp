import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../types/index.js';
import { AppError } from '../utils/AppError.js';

/**
 * Restricts a route to certain roles, e.g. authorize('ADMIN').
 * With no arguments it only requires an authenticated active user.
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user)
      return next(new AppError('Not authenticated. Please login.', 401));

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };
}
