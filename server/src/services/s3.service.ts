import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env.js';
import { getBucketName, getS3Client } from '../config/s3.js';
import { AppError } from '../utils/AppError.js';

export interface S3ImageObject {
  url: string;
  key: string;
}

export interface UploadFileParams {
  /** Raw file bytes (Multer memory storage). */
  buffer: Buffer;
  /** MIME type, e.g. image/jpeg — used as the S3 ContentType. */
  mimeType: string;
  /** Original client filename — used ONLY to derive a safe extension. */
  originalFilename?: string;
  /** Venue MongoDB ObjectId — groups the object under venue-images/{venueId}/. */
  venueId: string;
}

const VENUE_IMAGE_FOLDER = 'venue-images';

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/**
 * Derives a safe extension from the original filename; falls back to the MIME
 * type. The original filename is never used as the object key (collisions),
 * only as an extension hint.
 */
function resolveExtension(originalFilename: string | undefined, mimeType: string): string {
  const fromFilename = path.extname(originalFilename ?? '').replace('.', '').toLowerCase();
  if (fromFilename && /^[a-z0-9]{1,10}$/.test(fromFilename)) return fromFilename;
  return MIME_TO_EXTENSION[mimeType] ?? 'bin';
}

/**
 * Generates a unique object key, e.g.
 * venue-images/68abc123/550e8400-e29b-41d4-a716-446655440000.jpg
 */
export function buildVenueImageKey(venueId: string, extension: string): string {
  return `${VENUE_IMAGE_FOLDER}/${venueId}/${randomUUID()}.${extension}`;
}

/**
 * Uploads a single image to S3 and returns the public URL + object key.
 */
export async function uploadImageToS3(params: UploadFileParams): Promise<S3ImageObject> {
  const { buffer, mimeType, originalFilename, venueId } = params;
  const key = buildVenueImageKey(venueId, resolveExtension(originalFilename, mimeType));

  try {
    const upload = new Upload({
      client: getS3Client(),
      params: {
        Bucket: getBucketName(),
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      },
    });
    await upload.done();
  } catch (error) {
    throw new AppError(
      `Failed to upload venue image to S3: ${error instanceof Error ? error.message : 'Unknown S3 error'}`,
      500,
    );
  }

  return {
    url: `https://${getBucketName()}.s3.${env.AWS_REGION}.amazonaws.com/${key}`,
    key,
  };
}

/**
 * Deletes a single object from S3. Idempotent: deleting a key that no longer
 * exists resolves successfully.
 */
export async function deleteImageFromS3(key: string): Promise<void> {
  try {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucketName(), Key: key }));
  } catch (error) {
    throw new AppError(
      `Failed to delete venue image from S3: ${error instanceof Error ? error.message : 'Unknown S3 error'}`,
      500,
    );
  }
}