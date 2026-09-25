import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError.js';

/**
 * Converts multipart/form-data text fields into the types the Zod schemas
 * expect, before the validation middleware runs:
 *
 * - `location` is sent as a JSON string, e.g.
 *   JSON.stringify({ type: 'Point', coordinates: [lng, lat], ... }) — parse it.
 * - numeric fields (`capacity`, `pricePerDay`, `advancePercentage`) arrive as
 *   strings ("500", "12.5") — coerce them to numbers.
 *
 * Passing a JSON request through is a no-op: multer leaves non-multipart
 * bodies untouched, so the values are already typed.
 */

const NUMERIC_VENUE_FIELDS = ['capacity', 'pricePerDay', 'advancePercentage'] as const;

export function parseVenueFormData(req: Request, _res: Response, next: NextFunction): void {
  const body = (req.body ?? {}) as Record<string, unknown>;

  if (typeof body.location === 'string') {
    try {
      body.location = JSON.parse(body.location);
    } catch {
      return next(new AppError('Invalid location: expected a valid JSON string', 400));
    }
  }

  for (const field of NUMERIC_VENUE_FIELDS) {
    const value = body[field];
    if (typeof value === 'string' && value.trim() !== '') {
      body[field] = Number(value);
    }
  }

  next();
}