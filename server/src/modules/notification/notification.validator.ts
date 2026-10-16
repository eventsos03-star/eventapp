import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const listNotificationsSchema = z.object({
  query: z.object({
    unread: z.enum(['true', 'false']).optional(),
    page: z.string().regex(/^\d+$/, 'Invalid page').optional(),
    limit: z.string().regex(/^\d+$/, 'Invalid limit').optional(),
  }),
});