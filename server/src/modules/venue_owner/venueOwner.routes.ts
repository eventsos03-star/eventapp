import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { applyVenueOwner,getMyVenueOwner } from "./venueOwner.controller.js";

const router=Router();

router.post("/apply",authenticate,applyVenueOwner);
router.get("/me",authenticate,getMyVenueOwner);

export default router;