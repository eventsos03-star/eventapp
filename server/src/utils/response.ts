import type { Response } from 'express';

export function success<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): void {
  res.status(statusCode).json({ success: true, message, data });
}
