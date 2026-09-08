import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource id');

const bodySchema = z
  .object({
    venueId: objectIdSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['startDate'],
  });

export const createBookingSchema = z.object({
  body: bodySchema,
});

export const bookingIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const venueBookingsParamSchema = z.object({
  params: z.object({ venueId: objectIdSchema }),
});
