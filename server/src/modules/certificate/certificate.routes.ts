import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrgRole } from '../../middleware/requireOrgRole.js';
import * as certController from './certificate.controller.js';

const router = Router();

router.use(authenticate);

// Restricted to Owner and Certificate Manager
router.post('/issue', requireOrgRole('certificate_manager'), certController.issue);
router.get('/event/:eventId', requireOrgRole('certificate_manager'), certController.getByEvent);

export default router;