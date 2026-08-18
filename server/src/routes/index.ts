import { Router } from 'express';
import authRoutes from '../modules/auth/index.js';
import adminRoutes from '../modules/admin/index.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

export default router;
