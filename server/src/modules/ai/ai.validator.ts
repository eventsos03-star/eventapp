import { z } from 'zod';

export const askSchema = z.object({
  body: z.object({
    question: z
      .string({ required_error: 'Question is required' })
      .trim()
      .min(1, 'Question is required')
      .max(1000, 'Question must be at most 1000 characters'),
  }),
});