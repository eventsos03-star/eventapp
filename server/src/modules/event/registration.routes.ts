import { Router } from "express";
import { getAllMyRegistration, individualRegistration,teamRegistration } from "./registration.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router=Router();

router.get("/",authenticate,getAllMyRegistration)
router.post("/:id/individual",authenticate,individualRegistration);
router.post("/:id/team",authenticate,teamRegistration)


export default router;