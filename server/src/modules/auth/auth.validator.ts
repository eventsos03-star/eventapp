import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

const emailSchema = z.string().trim().toLowerCase().email('Invalid email address');

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(50),
    lastName: z.string().trim().min(1, 'Last name is required').max(50),
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: passwordSchema,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      firstName: z.string().trim().min(1, 'First name is required').max(50).optional(),
      lastName: z.string().trim().min(1, 'Last name is required').max(50).optional(),
    })
    .refine((data) => data.firstName !== undefined || data.lastName !== undefined, {
      message: 'Provide at least one field to update',
    }),
});

export const googleSchema = z.object({
  body: z.object({
    credential: z.string().min(1, 'Google credential is required'),
  }),
});

export const setPasswordSchema = z.object({
  body: z.object({
    newPassword: passwordSchema,
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});
