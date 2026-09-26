import eventRouter from './event.routes.js';
import { Router } from 'express';
import registrationRoute from "./registration.routes.js";
import paymentRouter from "../payment/index.js"


const router=Router();

router.use("/registration",registrationRoute);
router.use("/payment", paymentRouter);

router.use("/",eventRouter);

export default router;
