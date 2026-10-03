import { Router } from 'express';
import authRoutes from '../modules/auth/index.js';
import eventRouter from '../modules/event/index.js';
import adminRoutes from '../modules/admin/index.js';
import organizationRoutes from '../modules/organization/organization.routes.js';
import venueRoutes from '../modules/venue/index.js';
import bookingRoutes from '../modules/venue/booking/index.js';
import taskRoutes from '../modules/task/task.routes.js';
import certificateRoutes from '../modules/certificate/certificate.routes.js';
import aiRoutes from '../modules/ai/index.js';


const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/organizations', organizationRoutes);
router.use('/venues', venueRoutes);
router.use('/venue-bookings', bookingRoutes);
router.use('/events', eventRouter);
router.use('/tasks', taskRoutes);
router.use('/certificates', certificateRoutes);
router.use('/ai', aiRoutes);


export default router;