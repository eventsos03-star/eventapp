import { Router } from 'express';
import authRoutes from '../modules/auth/index.js';
import adminRoutes from '../modules/admin/index.js';
import organizationRoutes from '../modules/organization/organization.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/organizations', organizationRoutes);

export default router;
