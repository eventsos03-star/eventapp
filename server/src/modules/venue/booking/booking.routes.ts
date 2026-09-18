import { Router } from "express";

import { authenticate } from "../../../middleware/authenticate.js";
import { validate } from "../../../middleware/validate.js";


import {
  createBookingSchema,
  bookingIdParamSchema,
  venueBookingsParamSchema,
  cancelBookingSchema,
} from "./booking.validator.js";

import {
  createBooking,
  getVenueAvailability,
  getBookingsForVenue,
  getBookingById,
  approveBooking,
  rejectBooking,
  cancelBooking,
} from "./booking.controller.js";

const router = Router();

/*
 * Availability calendar
 */
router.get(
  "/venue/:venueId/availability",
  authenticate,
  validate(venueBookingsParamSchema),
  getVenueAvailability
);

/*
 * Venue owner's bookings
 */
router.get(
  "/venue/:venueId",
  authenticate,
  validate(venueBookingsParamSchema),
  getBookingsForVenue
);

/*
 * Individual booking
 */
router.get(
  "/:id",
  authenticate,
  validate(bookingIdParamSchema),
  getBookingById
);

/*
 * Create booking
 */
router.post(
  "/",
  authenticate,
  validate(createBookingSchema),
  createBooking
);

/*
 * Approve
 */
router.patch(
  "/:id/approve",
  authenticate,
  validate(bookingIdParamSchema),
  approveBooking
);

/*
 * Reject
 */
router.patch(
  "/:id/reject",
  authenticate,
  validate(bookingIdParamSchema),
  rejectBooking
);
router.patch(
  "/:id/cancel",
  authenticate,
  validate(cancelBookingSchema),
  cancelBooking
);

export default router;