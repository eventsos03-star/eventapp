import { Router } from 'express';
import authRoutes from '../modules/auth/index.js';
import venueRoutes from '../modules/venue/index.js';
const router = Router();

router.use('/auth', authRoutes);
router.use('/venues',venueRoutes)

export default router;
