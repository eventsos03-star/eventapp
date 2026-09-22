import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  ACCESS_TOKEN_EXPIRE: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRE: z.string().default('30d'),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(2525),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('EventOS <no-reply@eventos.app>'),

  // Google OAuth client ID (from Google Cloud Console). Used to verify the
  // audience of Google ID tokens. Optional: if empty, the audience is not checked.
  GOOGLE_CLIENT_ID: z.string().optional().default(''),

  // AWS S3 — used for venue image uploads. Marked optional at boot so the
  // server still starts without AWS configured; config/s3.ts validates them
  // lazily at request time with a clear error when an upload is attempted.
  AWS_REGION: z.string().optional().default(''),
  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_S3_BUCKET_NAME: z.string().optional().default(''),

  CLIENT_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
