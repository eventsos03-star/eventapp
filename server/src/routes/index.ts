import { Router } from 'express';
import authRoutes from '../modules/auth/index.js';
import venueRoutes from '../modules/venue/index.js';
import eventRouter from '../modules/event/index.js';
const router = Router();

router.use('/auth', authRoutes);
router.use('/venues',venueRoutes)

router.use("/events" , eventRouter)
export default router;