import { Router } from "express";
import { getAllMyRegistration, individualRegistration,teamRegistration } from "./registration.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { getMyTicket ,verifieTicket} from "./ticket.controller.js";
import { validate } from "../../middleware/validate.js";
import { individualRegistrationSchema,teamRegistrationSchema } from "./registration.validation.js";

const router=Router();

router.get("/",authenticate,getAllMyRegistration);
router.get("/:registrationId/ticket",authenticate,getMyTicket);
router.post("/:id/individual",authenticate,validate(individualRegistrationSchema),individualRegistration);
router.post("/:id/team",authenticate,validate(teamRegistrationSchema),teamRegistration);
router.post("/:registrationId/verify",authenticate,verifieTicket);


export default router;