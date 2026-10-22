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

  // Convert boolean strings
  if (typeof body.certificateEnabled === 'string') {
    body.certificateEnabled = body.certificateEnabled === 'true';
  }
  if (typeof body.removeBannerImage === 'string') {
    body.removeBannerImage = body.removeBannerImage === 'true';
  }
  if (typeof body.removeEventEndDate === 'string') {
    body.removeEventEndDate = body.removeEventEndDate === 'true';
  }

  // If removeEventEndDate is true or eventEndDate is explicitly empty, set to null
  if (body.removeEventEndDate === true || (typeof body.eventEndDate === 'string' && body.eventEndDate.trim() === '')) {
    body.eventEndDate = null;
  }

  // If eventTime is empty string, delete it
  if (typeof body.eventTime === 'string' && body.eventTime.trim() === '') {
    delete body.eventTime;
  }

  next();
}
