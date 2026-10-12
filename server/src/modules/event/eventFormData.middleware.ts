import type { NextFunction, Request, Response } from 'express';

const NUMERIC_EVENT_FIELDS = ['maxParticipants', 'ticketPrice', 'teamSize'] as const;

export function parseEventFormData(req: Request, _res: Response, next: NextFunction): void {
  const body = (req.body ?? {}) as Record<string, unknown>;

  // Convert numeric strings into numbers, or remove if empty so optional Zod schemas pass
  for (const field of NUMERIC_EVENT_FIELDS) {
    const value = body[field];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        body[field] = Number(trimmed);
      } else {
        delete body[field];
      }
    }
  }

  // Convert boolean string
  if (typeof body.certificateEnabled === 'string') {
    body.certificateEnabled = body.certificateEnabled === 'true';
  }

  // If eventEndDate is an empty string, delete it so z.coerce.date().optional() doesn't fail
  if (typeof body.eventEndDate === 'string' && body.eventEndDate.trim() === '') {
    delete body.eventEndDate;
  }

  next();
}