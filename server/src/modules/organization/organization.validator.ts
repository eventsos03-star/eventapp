import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const organizationTypes = ['college', 'company', 'startup', 'ngo', 'community', 'event_org', 'other'] as const;

const addressSchema = z.object({
  street: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  postalCode: z.string().optional().default(''),
  country: z.string().optional().default('India'),
});

export const createOrganizationSchema = z.object({
  body: z.object({
    organizationName: z.string().min(1, 'Organization name is required').max(200),
    organizationType: z.enum(organizationTypes, { required_error: 'Organization type is required' }),
    description: z.string().max(2000).optional(),
    email: z.string().email('Valid email is required'),
    phoneNumber: z.string().max(20).optional(),
    address: addressSchema.optional(),
  }),
});

export const updateOrganizationSchema = z.object({
  body: z.object({
    organizationName: z.string().min(1).max(200).optional(),
    organizationType: z.enum(organizationTypes).optional(),
    description: z.string().max(2000).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().max(20).optional().nullable(),
    address: addressSchema.optional(),
  }),
});

export const organizationIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    role: z.enum(['organizer', 'member'], { required_error: 'Role is required' }),
  }),
});
