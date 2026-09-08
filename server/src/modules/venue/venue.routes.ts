import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createVenueSchema,
  updateVenueSchema,
  venueIdParamSchema,
  listVenuesQuerySchema,
  geocodeQuerySchema,
  reverseGeocodeQuerySchema,
} from './venue.validator.js';
import {
  createVenue,
  getVenues,
  getMyVenues,
  getAllVenuesForAdmin,
  getVenueById,
  approveVenue,
  updateVenue,
  deleteVenue,
  rejectVenue,
  searchLocations,
  reverseSearchLocation,
} from './venue.controller.js';

const router = Router();

router.get('/', validate(listVenuesQuerySchema), getVenues);
router.get('/admin', authenticate, getAllVenuesForAdmin);
router.get('/my', authenticate, getMyVenues);
router.get('/geocode/search', validate(geocodeQuerySchema), searchLocations);
router.get(
  '/geocode/reverse',
  validate(reverseGeocodeQuerySchema),
  reverseSearchLocation,
);
router.get('/:id', validate(venueIdParamSchema), getVenueById);
router.post('/', authenticate, validate(createVenueSchema), createVenue);
router.patch('/:id/approve', authenticate, approveVenue);
router.patch('/:id', authenticate, validate(updateVenueSchema), updateVenue);
router.delete('/:id', authenticate, deleteVenue);
router.patch('/:id/reject', authenticate, rejectVenue);

export default router;
