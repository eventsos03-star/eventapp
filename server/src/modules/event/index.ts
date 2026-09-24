import eventRouter from './event.routes.js';
import { Router } from 'express';
import registrationRoute from "./registration.routes.js";

const router=Router();

router.use("/registration",registrationRoute);
router.use("/",eventRouter);

export default router;
