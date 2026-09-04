import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { validate } from '../../../middleware/validate.js';
import {
  createBookingSchema,
  bookingIdParamSchema,
  venueBookingsParamSchema,
} from './booking.validator.js';
import {
  createBooking,
  getBookingsForVenue,
  getBookingById,
  approveBooking,
  rejectBooking,
} from './booking.controller.js';

const router = Router();

router.get('/venue/:venueId', authenticate, validate(venueBookingsParamSchema), getBookingsForVenue);
router.get('/:id', authenticate, validate(bookingIdParamSchema), getBookingById);
router.post('/', authenticate, validate(createBookingSchema), createBooking);
router.patch('/:id/approve', authenticate, validate(bookingIdParamSchema), approveBooking);
router.patch('/:id/reject', authenticate, validate(bookingIdParamSchema), rejectBooking);

export default router;