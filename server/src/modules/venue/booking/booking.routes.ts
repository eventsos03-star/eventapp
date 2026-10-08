
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
  createDateHoldSchema,
  refreshDateHoldSchema,
  holdIdParamSchema,
  checkDateHoldSchema,
} from "./dateHold.validator.js";

import {
  createBooking,
  getVenueAvailability,
  getBookingsForVenue,
  getBookingById,
  approveBooking,
  rejectBooking,
  cancelBooking,
} from "./booking.controller.js";

import {
  createDateHold,
  refreshDateHold,
  releaseDateHold,
  checkDateHold,
} from "./dateHold.controller.js";

const router = Router();

router.get("/venue/:venueId/availability", authenticate, validate(venueBookingsParamSchema), getVenueAvailability);
router.post("/venue/:venueId/date-hold", authenticate, validate(createDateHoldSchema), createDateHold);
router.patch("/venue/:venueId/date-hold/:holdId", authenticate, validate(refreshDateHoldSchema), refreshDateHold);
router.delete("/venue/:venueId/date-hold/:holdId", authenticate, validate(holdIdParamSchema), releaseDateHold);
router.get("/venue/:venueId/date-hold/check", authenticate, validate(checkDateHoldSchema), checkDateHold);
router.get("/venue/:venueId", authenticate, validate(venueBookingsParamSchema), getBookingsForVenue);
router.get("/:id", authenticate, validate(bookingIdParamSchema), getBookingById);
router.post("/", authenticate, validate(createBookingSchema), createBooking);
router.patch("/:id/approve", authenticate, validate(bookingIdParamSchema), approveBooking);
router.patch("/:id/reject", authenticate, validate(bookingIdParamSchema), rejectBooking);
router.patch("/:id/cancel", authenticate, validate(cancelBookingSchema), cancelBooking);

export default router;

