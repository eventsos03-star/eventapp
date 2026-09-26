import { Router } from "express";
import paymentRouter from "./payment.routes.js"

const router=Router();

router.use("/",paymentRouter)

export default router