import { z } from 'zod';

const resourceStatuses = ['pending', 'approved', 'rejected', 'blocked'] as const;

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource id');

export const listOrganizationsSchema = z.object({
  query: z.object({
    status: z.enum(resourceStatuses).optional(),
  }),
});

export const listVenueOwnersSchema = z.object({
  query: z.object({
    status: z.enum(resourceStatuses).optional(),
  }),
});

export const organizationActionSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const venueOwnerActionSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
