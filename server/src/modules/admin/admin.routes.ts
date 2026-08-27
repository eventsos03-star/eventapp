import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as adminController from './admin.controller.js';
import {
  deleteUserSchema,
  listDeletedUsersSchema,
  listOrganizationsSchema,
  listVenueOwnersSchema,
  listUsersSchema,
  organizationActionSchema,
  rejectOrganizationSchema,
  restoreUserSchema,
  updateUserRoleSchema,
  venueOwnerActionSchema,
} from './admin.validator.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', adminController.getAdminStats);
router.get('/organizations', validate(listOrganizationsSchema), adminController.listOrganizations);
router.get('/organizations/:id', validate(organizationActionSchema), adminController.getOrganizationDetail);
router.patch('/organizations/:id/approve', validate(organizationActionSchema), adminController.approveOrganization);
router.patch('/organizations/:id/reject', validate(rejectOrganizationSchema), adminController.rejectOrganization);
router.patch('/organizations/:id/restore', validate(organizationActionSchema), adminController.restoreOrganization);
router.delete('/organizations/:id', validate(organizationActionSchema), adminController.deleteOrganization);
router.get('/venue-owners', validate(listVenueOwnersSchema), adminController.listVenueOwners);
router.patch('/venue-owners/:id/approve', validate(venueOwnerActionSchema), adminController.approveVenueOwner);
router.patch('/venue-owners/:id/reject', validate(venueOwnerActionSchema), adminController.rejectVenueOwner);
router.patch('/venue-owners/:id/restore', validate(venueOwnerActionSchema), adminController.restoreVenueOwner);

router.get('/users', validate(listUsersSchema), adminController.listUsers);
router.get('/users/deleted', validate(listDeletedUsersSchema), adminController.listDeletedUsers);
router.patch('/users/:id/role', validate(updateUserRoleSchema), adminController.updateUserRole);
router.patch('/users/:id/restore', validate(restoreUserSchema), adminController.restoreUser);
router.delete('/users/:id', validate(deleteUserSchema), adminController.deleteUser);

export default router;
