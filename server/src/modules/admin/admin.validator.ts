import { z } from 'zod';

const resourceStatuses = ['pending', 'approved', 'rejected', 'blocked', 'deleted'] as const;

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

export const rejectOrganizationSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required').max(500),
  }),
});

export const venueOwnerActionSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    role: z.enum(['USER', 'ADMIN']),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const listDeletedUsersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const restoreUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const permanentDeleteSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    confirmName: z.string().min(1, 'Confirmation name is required').max(200),
  }),
});
