import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

export const MAX_EVENT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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
    files: 1,
    fileSize: MAX_EVENT_IMAGE_SIZE_BYTES,
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
 * Express middleware wrapper around Multer for single event banner image upload.
 * File will be available on `req.file`.
 */
export function uploadEventImage(req: Request, _res: Response, next: NextFunction): void {
  upload.single('bannerImage')(req, _res, (error: unknown) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return next(new AppError('Banner image too large. Maximum file size is 5 MB.', 400));
        case 'LIMIT_UNEXPECTED_FILE':
          return next(new AppError('Unexpected field for image upload. Please use field "bannerImage".', 400));
        default:
          return next(new AppError(`Banner image upload failed: ${error.message}`, 400));
      }
    }

    next(error);
  });
}