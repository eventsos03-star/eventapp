import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';
import * as venueService from './venue.service.js';
import type { IVenueImage } from './venue.model.js';
import { uploadImageToS3, deleteImageFromS3 } from '../../services/s3.service.js';
import { geocode, reverseGeocode } from '../location/index.js';

/**
 * Normalizes req.files (multer .array('images') always produces an array; the
 * union form is handled defensively) into a plain array of Multer files.
 */
function getUploadedFiles(req: { files?: unknown }): Express.Multer.File[] {
  if (Array.isArray(req.files)) return req.files as Express.Multer.File[];
  if (req.files && typeof req.files === 'object') {
    return Object.values(req.files as Record<string, Express.Multer.File[]>).flat();
  }
  return [];
}

/**
 * Best-effort rollback of already-uploaded S3 objects. Called when venue
 * creation/update fails after some images were uploaded, so the S3 objects
 * are not left orphaned. Individual cleanup failures are swallowed — the
 * original application error is the one reported to the client.
 */
async function rollbackS3Uploads(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await Promise.allSettled(keys.map((key) => deleteImageFromS3(key)));
}

export const createVenue = asyncHandler(async (req, res) => {
  const files = getUploadedFiles(req);
  // Generate the venue id up front so S3 keys are grouped by it:
  // venue-images/{venueId}/{uuid}.{ext}
  const venueId = new mongoose.Types.ObjectId();

  const uploadedKeys: string[] = [];
  const images: IVenueImage[] = [];

  try {
    for (const file of files) {
      const { url, key } = await uploadImageToS3({
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalFilename: file.originalname,
        venueId: venueId.toString(),
      });
      images.push({ url, key });
      uploadedKeys.push(key);
    }

    const venue = await venueService.createVenue({
      ...req.body,
      _id: venueId,
      ownerId: req.user!.id,
      images,
    });

    success(res, 201, 'Venue created successfully', venue);
  } catch (error) {
    await rollbackS3Uploads(uploadedKeys);
    throw error;
  }
});

export const getVenues = asyncHandler(async (req, res) => {
  const { lat, lng, radius, minCapacity, maxCapacity, minPrice, maxPrice, page, limit, city } =
    req.query as Record<string, string | undefined>;

  if (lat && lng) {
    const result = await venueService.getNearbyVenues({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: radius ? parseFloat(radius) : 25000,
      minCapacity: minCapacity ? parseInt(minCapacity, 10) : undefined,
      maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    success(res, 200, 'Venues fetched successfully', result);
  } else {
    const venues = await venueService.getVenues(city, {
      minCapacity: minCapacity ? parseInt(minCapacity, 10) : undefined,
      maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
    success(res, 200, 'Venues fetched successfully', venues);
  }
});

export const getMyVenues = asyncHandler(async (req, res) => {
  const venues = await venueService.getMyVenues(req.user!.id);
  success(res, 200, 'Your venues fetched successfully', venues);
});

export const getAllVenuesForAdmin = asyncHandler(async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }
  const venues = await venueService.getAllVenuesForAdmin(
    req.query.city as string | undefined,
    req.query.status as string | undefined
  );
  success(res, 200, 'Venues fetched successfully', venues);
});

export const getVenueById = asyncHandler(async (req, res) => {
  const venue = await venueService.getVenueById(req.params.id);
  if (!venue) throw new AppError('Venue not found', 404);
  success(res, 200, 'Venue fetched successfully', venue);
});

export const approveVenue = asyncHandler(async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }
  const venue = await venueService.approveVenue(req.params.id);
  if (!venue) throw new AppError('Venue not found', 404);
  success(res, 200, 'Venue approved successfully', venue);
});

export const updateVenue = asyncHandler(async (req, res) => {
  const files = getUploadedFiles(req);

  const uploadedKeys: string[] = [];
  const newImages: IVenueImage[] = [];

  try {
    // Capture the images currently on the venue so that, once the update
    // replaces them, the old S3 objects can be cleaned up.
    const existingVenue = await venueService.getVenueById(req.params.id);
    const existingKeys = (existingVenue?.images ?? []).map((image) => image.key);

    for (const file of files) {
      const { url, key } = await uploadImageToS3({
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalFilename: file.originalname,
        venueId: req.params.id,
      });
      newImages.push({ url, key });
      uploadedKeys.push(key);
    }

    const venue = await venueService.updateVenue(req.params.id, req.user!.id, req.body, newImages);
    if (!venue) {
      throw new AppError('Venue not found or you are not authorized to update this venue', 404);
    }

    // A venue holds a single image: once the update succeeded with new
    // uploads, the replaced images are no longer referenced and their S3
    // objects are deleted best-effort (cleanup failures are swallowed).
    if (newImages.length > 0) {
      await Promise.allSettled(existingKeys.map((key) => deleteImageFromS3(key)));
    }

    success(res, 200, 'Venue updated successfully', venue);
  } catch (error) {
    await rollbackS3Uploads(uploadedKeys);
    throw error;
  }
});

export const deleteVenue = asyncHandler(async (req, res) => {
  const venue = await venueService.deleteVenue(req.params.id, req.user!.id, req.user!.role);
  if (!venue) {
    throw new AppError('Venue not found or you are not authorized to delete this venue', 404);
  }
  // Best-effort cleanup: remove the deleted venue's images from S3.
  await Promise.allSettled(venue.images.map((image) => deleteImageFromS3(image.key)));
  success(res, 200, 'Venue deleted successfully', null);
});

export const rejectVenue = asyncHandler(async (req, res) => {
  if (req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }
  const venue = await venueService.rejectVenue(req.params.id);
  if (!venue) throw new AppError('Venue not found', 404);
  success(res, 200, 'Venue rejected successfully', venue);
});

export const deleteVenueImage = asyncHandler(async (req, res) => {
  const { key } = req.body as { key: string };

  const venue = await venueService.getVenueById(req.params.id);
  if (!venue) throw new AppError('Venue not found', 404);

  const isOwner = venue.ownerId.toString() === req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to delete images for this venue', 403);
  }

  // Never delete an arbitrary S3 object: the key must belong to this venue.
  const imageBelongsToVenue = venue.images.some((image) => image.key === key);
  if (!imageBelongsToVenue) {
    throw new AppError('Image not found on this venue', 404);
  }

  await deleteImageFromS3(key);

  const updated = await venueService.removeVenueImage(req.params.id, key);
  if (!updated) {
    throw new AppError('Venue not found or image already removed', 404);
  }

  success(res, 200, 'Venue image deleted successfully', updated);
});

export const searchLocations = asyncHandler(async (req, res) => {
  const { q } = req.query as { q: string };
  const results = await geocode(q);
  success(res, 200, 'Locations fetched successfully', results);
});

export const reverseSearchLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query as { lat: string; lng: string };
  const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
  success(res, 200, 'Location fetched successfully', result);
});