import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventRoutes from "../modules/events/event.routes.js"
const router = Router();

router.use('/auth', authRoutes);
router.use("/events",eventRoutes)
export default router;
