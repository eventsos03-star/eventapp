import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as bookingService from "./booking.service.js";

export const createBooking = async (params: {
  userId: string;
  organizationId: string | null;
  venueId: string;
  startDate: Date;
  endDate: Date;
}) => {
  const {
    userId,
    organizationId,
    venueId,
  } = params;

  // params.startDate/endDate may arrive as ISO strings (e.g. from req.body),
  // so coerce to real Date instances before using Date methods on them.
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);

  if (!organizationId) {
    throw new AppError(
      "You must own or belong to an approved organization to book a venue",
      403
    );
  }

  /* Check organization */

  const eligible = await isOrgEligible(
    userId,
    organizationId
  );

  if (!eligible) {
    throw new AppError(
      "You are not authorized to book for this organization",
      403
    );
  }

  /* Check venue */

  const venue = await Venue.findOne({
    _id: venueId,
    ...NOT_DELETED,
  });

  if (!venue) {
    throw new AppError(
      "Venue not found",
      404
    );
  }

  if (venue.status !== "approved") {
    throw new AppError(
      "This venue is not available for booking",
      400
    );
  }

  /* Check date overlap */

  const conflict = await hasOverlap(
    venueId,
    startDate,
    endDate
  );

  if (conflict) {
    throw new AppError(
      "This venue is already booked for part or all of the selected date range",
      409
    );
  }

  /* Calculate price */

  const bookingAmount =
    venue.pricePerDay *
    countDays(startDate, endDate);

  /* Create pending booking */

  const booking = await VenueBooking.create({
    organizationId,
    venueId,
    requestedBy: userId,
    startDate,
    endDate,
    bookingAmount,
    status: "pending",
    paymentStatus: "pending",
  });

  return booking;
};

export const getVenueAvailability =
  asyncHandler(async (req, res) => {
    const { venueId } = req.params;

    const availability =
      await bookingService.getVenueAvailability(
        venueId
      );

    return success(
      res,
      200,
      "Venue availability fetched successfully",
      availability
    );
  });

export const getBookingsForVenue =
  asyncHandler(async (req, res) => {
    const bookings =
      await bookingService.getBookingsForVenue({
        userId: req.user!.id,
        userRole: req.user!.role,
        venueId: req.params.venueId,
      });

    return success(
      res,
      200,
      "Bookings fetched successfully",
      bookings
    );
  });

export const getBookingById =
  asyncHandler(async (req, res) => {
    const booking =
      await bookingService.getBookingById({
        userId: req.user!.id,
        userRole: req.user!.role,
        organizationId:
          req.user!.organizationId,
        bookingId: req.params.id,
      });

    return success(
      res,
      200,
      "Booking fetched successfully",
      booking
    );
  });

export const approveBooking =
  asyncHandler(async (req, res) => {
    const booking =
      await bookingService.approveBooking({
        userId: req.user!.id,
        bookingId: req.params.id,
      });

    return success(
      res,
      200,
      "Booking approved successfully",
      booking
    );
  });

export const rejectBooking =
  asyncHandler(async (req, res) => {
    const booking =
      await bookingService.rejectBooking({
        userId: req.user!.id,
        bookingId: req.params.id,
      });

    return success(
      res,
      200,
      "Booking rejected successfully",
      booking
    );
  });