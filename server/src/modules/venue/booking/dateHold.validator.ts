import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource id');

const dateRange = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['startDate'],
  });

export const createDateHoldSchema = z.object({
  params: z.object({
    venueId: objectIdSchema,
  }),
  body: dateRange,
});

export const holdIdParamSchema = z.object({
  params: z.object({
    venueId: objectIdSchema,
    holdId: objectIdSchema,
  }),
});

export const refreshDateHoldSchema = z.object({
  params: z.object({
    venueId: objectIdSchema,
    holdId: objectIdSchema,
  }),
  body: z
    .object({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    })
    .refine(
      (data) =>
        (data.startDate === undefined) === (data.endDate === undefined),
      {
        message: 'startDate and endDate must be provided together',
        path: ['startDate'],
      }
    )
    .refine(
      (data) =>
        data.startDate === undefined ||
        data.endDate === undefined ||
        data.startDate <= data.endDate,
      {
        message: 'startDate must be on or before endDate',
        path: ['startDate'],
      }
    ),
});

export const checkDateHoldSchema = z.object({
  params: z.object({
    venueId: objectIdSchema,
  }),
  query: dateRange,
});
