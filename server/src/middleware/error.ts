import type { NextFunction, Request, Response } from 'express';

/**
 * Single global error handler. Everything thrown by routes, middlewares
 * and the database ends up here.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof Error) {
    statusCode = (err as Error & { statusCode?: number }).statusCode || 500;
    message = err.message;
  }

  // Mongoose validation error
  if (err instanceof Error && err.name === 'ValidationError') {
    statusCode = 400;
    const errors = (err as Error & { errors?: Record<string, { message: string }> }).errors || {};
    message = Object.values(errors).map((e) => e.message).join(', ');
  }

  // Mongoose duplicate key
  if (err instanceof Error && 'code' in err && (err as Error & { code: number }).code === 11000) {
    statusCode = 409;
    const key = (err as Error & { keyValue?: Record<string, string> }).keyValue || {};
    const field = Object.keys(key)[0] || 'field';
    message = `An account with this ${field} already exists`;
  }

  // Mongoose invalid ObjectId
  if (err instanceof Error && err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid value provided';
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({ success: false, message });
}
