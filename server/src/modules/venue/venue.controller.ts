import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';
import * as venueService from './venue.service.js';
import { geocode, reverseGeocode } from '../location/index.js';

export const createVenue = asyncHandler(async (req, res) => {
  const venue = await venueService.createVenue({
    ...req.body,
    ownerId: req.user!.id,
  });
  success(res, 201, 'Venue created successfully', venue);
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
    req.query.city as string | undefined
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
  const venue = await venueService.updateVenue(req.params.id, req.user!.id, req.body);
  if (!venue) {
    throw new AppError('Venue not found or you are not authorized to update this venue', 404);
  }
  success(res, 200, 'Venue updated successfully', venue);
});

export const deleteVenue = asyncHandler(async (req, res) => {
  const venue = await venueService.deleteVenue(req.params.id, req.user!.id, req.user!.role);
  if (!venue) {
    throw new AppError('Venue not found or you are not authorized to delete this venue', 404);
  }
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
