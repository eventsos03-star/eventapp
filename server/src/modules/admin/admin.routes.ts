import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as adminController from './admin.controller.js';
import {
  listOrganizationsSchema,
  listVenueOwnersSchema,
  organizationActionSchema,
  rejectOrganizationSchema,
  venueOwnerActionSchema,
} from './admin.validator.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', adminController.getAdminStats);
router.get('/organizations', validate(listOrganizationsSchema), adminController.listOrganizations);
router.get('/organizations/:id', validate(organizationActionSchema), adminController.getOrganizationDetail);
router.patch('/organizations/:id/approve', validate(organizationActionSchema), adminController.approveOrganization);
router.patch('/organizations/:id/reject', validate(rejectOrganizationSchema), adminController.rejectOrganization);
router.get('/venue-owners', validate(listVenueOwnersSchema), adminController.listVenueOwners);
router.patch('/venue-owners/:id/approve', validate(venueOwnerActionSchema), adminController.approveVenueOwner);
router.patch('/venue-owners/:id/reject', validate(venueOwnerActionSchema), adminController.rejectVenueOwner);

export default router;
