import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Reusable AWS S3 client built from the project environment configuration.
 *
 * Credentials are never hard-coded — they come exclusively from
 * AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET_NAME.
 * The variables are optional at boot (so the app still starts without AWS),
 * and are validated lazily the first time an S3 operation is attempted.
 */

let cachedClient: S3Client | null = null;

function missingEnvVars(): string[] {
  const required: Array<[string, string]> = [
    ['AWS_REGION', env.AWS_REGION],
    ['AWS_ACCESS_KEY_ID', env.AWS_ACCESS_KEY_ID],
    ['AWS_SECRET_ACCESS_KEY', env.AWS_SECRET_ACCESS_KEY],
    ['AWS_S3_BUCKET_NAME', env.AWS_S3_BUCKET_NAME],
  ];
  return required.filter(([, value]) => !value).map(([name]) => name);
}

function assertS3Configured(): void {
  const missing = missingEnvVars();
  if (missing.length > 0) {
    throw new AppError(
      `S3 is not configured. Missing environment variable(s): ${missing.join(', ')}`,
      500,
    );
  }
}

export function getS3Client(): S3Client {
  assertS3Configured();
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return cachedClient;
}

export function getBucketName(): string {
  assertS3Configured();
  return env.AWS_S3_BUCKET_NAME;
}