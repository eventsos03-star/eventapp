import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import * as orgController from './organization.controller.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  addMemberSchema,
  organizationIdParamSchema,
} from './organization.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createOrganizationSchema), orgController.createOrganization);
router.get('/me', orgController.getMyOrganization);
router.patch('/me', validate(updateOrganizationSchema), orgController.updateOrganization);
router.delete('/me', orgController.deleteMyOrganization);
router.get('/:id/members', validate(organizationIdParamSchema), orgController.getMembers);
router.post('/:id/members', validate(organizationIdParamSchema), validate(addMemberSchema), orgController.addMember);
router.delete('/:id/members/:memberId', orgController.removeMember);

export default router;
