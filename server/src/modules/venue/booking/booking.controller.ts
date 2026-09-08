import { asyncHandler } from '../../../utils/asyncHandler.js';
import { success } from '../../../utils/response.js';
import * as bookingService from './booking.service.js';

export const createBooking = asyncHandler(async (req, res) => {
  const { venueId, startDate, endDate } = req.body as {
    venueId: string;
    startDate: Date;
    endDate: Date;
  };
  const booking = await bookingService.createBooking({
    userId: req.user!.id,
    organizationId: req.user!.organizationId,
    venueId,
    startDate,
    endDate,
  });
  return success(res, 201, 'Booking request created successfully', booking);
});

export const getBookingsForVenue = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getBookingsForVenue({
    userId: req.user!.id,
    userRole: req.user!.role,
    venueId: req.params.venueId,
  });
  return success(res, 200, 'Bookings fetched successfully', bookings);
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById({
    userId: req.user!.id,
    userRole: req.user!.role,
    organizationId: req.user!.organizationId,
    bookingId: req.params.id,
  });
  return success(res, 200, 'Booking fetched successfully', booking);
});

export const approveBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.approveBooking({
    userId: req.user!.id,
    bookingId: req.params.id,
  });
  return success(res, 200, 'Booking approved successfully', booking);
});

export const rejectBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.rejectBooking({
    userId: req.user!.id,
    bookingId: req.params.id,
  });
  return success(res, 200, 'Booking rejected successfully', booking);
});
