import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

/**
 * Validates the request body/query/params against a Zod schema.
 * Never trust the frontend — every request is validated.
 */
export function validate(schema: AnyZodObject): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const error = result.error as ZodError;
      const message = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      return next(new AppError(message, 400));
    }

    next();
  };
}
