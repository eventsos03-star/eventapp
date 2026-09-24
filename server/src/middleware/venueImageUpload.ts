import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

/**
 * Reusable Multer middleware for venue image uploads.
 *
 * - memory storage (files never touch the local filesystem)
 * - max 1 file, 5 MB
 * - rejects anything that is not a JPEG/PNG/GIF/WebP/AVIF image
 */

export const MAX_VENUE_IMAGES = 1;
export const MAX_VENUE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    files: MAX_VENUE_IMAGES,
    fileSize: MAX_VENUE_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      return callback(
        new AppError(
          `Unsupported file type "${file.mimetype}". Only JPEG, PNG, GIF, WebP and AVIF images are allowed.`,
          400,
        ),
      );
    }
    callback(null, true);
  },
});

/**
 * Express middleware wrapper around Multer so its low-level errors become
 * clear, consistent AppErrors. Uploaded files land in req.files (array).
 */
export function uploadVenueImages(req: Request, _res: Response, next: NextFunction): void {
  upload.array('images', MAX_VENUE_IMAGES)(req, _res, (error: unknown) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return next(new AppError('Image too large. Maximum file size is 5 MB per image.', 400));
        case 'LIMIT_FILE_COUNT':
        case 'LIMIT_UNEXPECTED_FILE':
          return next(new AppError('Too many images. Maximum of 1 image per venue is allowed.', 400));
        default:
          return next(new AppError(`Image upload failed: ${error.message}`, 400));
      }
    }

    next(error);
  });
}