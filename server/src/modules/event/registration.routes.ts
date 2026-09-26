import { Router } from "express";
import { getAllMyRegistration, individualRegistration,teamRegistration } from "./registration.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { getMyTicket } from "./ticket.controller.js";

const router=Router();

router.get("/",authenticate,getAllMyRegistration)
router.get("/:registrationId/ticket",authenticate,getMyTicket);
router.post("/:id/individual",authenticate,individualRegistration);
router.post("/:id/team",authenticate,teamRegistration)


export default router;