import { AppError } from "../../utils/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/response.js";
import * as venueService from "./venue.service.js";

export const createVenue = asyncHandler(async (req, res) => {
  const venue = await venueService.createVenue({
    ...req.body,
    ownerId: req.user!.id,
  });

  success(res, 201, "Venue created successfully", venue);
});

export const getVenues = asyncHandler(async (req, res) => {
  const venues = await venueService.getVenues(
    req.query.city as string | undefined
  );

  success(res, 200, "Venues fetched successfully", venues);
});

export const getMyVenues = asyncHandler(async (req, res) => {
  const venues = await venueService.getMyVenues(
    req.user!.id
  );

  success(
    res,
    200,
    "Your venues fetched successfully",
    venues
  );
});

export const getAllVenuesForAdmin = asyncHandler(async (req, res) => {
  if (req.user!.role !== "ADMIN") {
    throw new AppError(
      "Access denied. Admin privileges required.",
      403
    );
  }

  const venues = await venueService.getAllVenuesForAdmin(
    req.query.city as string | undefined
  );

  success(res, 200, "Venues fetched successfully", venues);
});

export const getVenueById = asyncHandler(async (req, res) => {
  const venue = await venueService.getVenueById(req.params.id);

  if (!venue) {
    throw new AppError("Venue not found", 404);
  }

  success(res, 200, "Venue fetched successfully", venue);
});

export const approveVenue = asyncHandler(async (req, res) => {
  if (req.user!.role !== "ADMIN") {
    throw new AppError(
      "Access denied. Admin privileges required.",
      403
    );
  }

  const venue = await venueService.approveVenue(req.params.id);

  if (!venue) {
    throw new AppError("Venue not found", 404);
  }

  success(
    res,
    200,
    "Venue approved successfully",
    venue
  );
});

export const updateVenue = asyncHandler(async (req, res) => {
  const venue = await venueService.updateVenue(
    req.params.id,
    req.user!.id,
    req.body
  );

  if (!venue) {
    throw new AppError(
      "Venue not found or you are not authorized to update this venue",
      404
    );
  }

  success(
    res,
    200,
    "Venue updated successfully",
    venue
  );
});

export const deleteVenue = asyncHandler(async (req, res) => {
  const venue = await venueService.deleteVenue(
    req.params.id,
    req.user!.id,
    req.user!.role
  );

  if (!venue) {
    throw new AppError(
      "Venue not found or you are not authorized to delete this venue",
      404
    );
  }

  success(
    res,
    200,
    "Venue deleted successfully",
    null
  );
});

export const rejectVenue = asyncHandler(async (req, res) => {
  if (req.user!.role !== "ADMIN") {
    throw new AppError(
      "Access denied. Admin privileges required.",
      403
    );
  }

  const venue = await venueService.rejectVenue(req.params.id);

  if (!venue) {
    throw new AppError("Venue not found", 404);
  }

  success(
    res,
    200,
    "Venue rejected successfully",
    venue
  );
});