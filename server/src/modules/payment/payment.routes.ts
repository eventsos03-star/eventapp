import { authenticate } from "../../middleware/authenticate.js";
import { paymentOrder ,verifiesEventPayment} from "./payment.controller.js";
import { Router } from "express";

const router=Router();


router.post("/",authenticate,paymentOrder);
router.post("/verify",authenticate,verifiesEventPayment);



export default router