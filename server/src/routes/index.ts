import { Router } from 'express';
import authRoutes from '../modules/auth/index.js';
import eventRouter from '../modules/event/index.js';
import adminRoutes from '../modules/admin/index.js';
import organizationRoutes from '../modules/organization/organization.routes.js';
import venueRoutes from '../modules/venue/index.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/organizations', organizationRoutes);
router.use('/venues', venueRoutes);

router.use("/events" , eventRouter)
export default router;