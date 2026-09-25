import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { uploadVenueImages } from '../../middleware/venueImageUpload.js';
import { parseVenueFormData } from './venueFormData.middleware.js';
import {
  createVenueSchema,
  updateVenueSchema,
  venueIdParamSchema,
  deleteVenueImageSchema,
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
  deleteVenueImage,
  rejectVenue,
  searchLocations,
  reverseSearchLocation,
} from './venue.controller.js';

const router = Router();

router.get('/', validate(listVenuesQuerySchema), getVenues);
router.get('/admin', authenticate, getAllVenuesForAdmin);
router.get('/my', authenticate, getMyVenues);
router.get('/geocode/search', validate(geocodeQuerySchema), searchLocations);
router.get('/geocode/reverse', validate(reverseGeocodeQuerySchema), reverseSearchLocation);
router.get('/:id', validate(venueIdParamSchema), getVenueById);

// Create/update accept multipart/form-data. Order matters:
// authenticate → upload middleware → form-data parsing → validation → controller.
router.post('/', authenticate, uploadVenueImages, parseVenueFormData, validate(createVenueSchema), createVenue);
router.patch('/:id/approve', authenticate, approveVenue);
router.patch('/:id', authenticate, uploadVenueImages, parseVenueFormData, validate(updateVenueSchema), updateVenue);
router.delete('/:id', authenticate, deleteVenue);
router.delete('/:id/images', authenticate, validate(deleteVenueImageSchema), deleteVenueImage);
router.patch('/:id/reject', authenticate, rejectVenue);

export default router;