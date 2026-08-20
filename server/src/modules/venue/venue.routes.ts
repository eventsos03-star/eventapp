import { Router } from "express";
import {
  createVenue,
  getVenues,
  getAllVenuesForAdmin,
  getVenueById,
  approveVenue,
} from "../../modules/venue/venue.controller.js";
import { authenticate } from "../../middleware/authenticate.js";


const router = Router();
router.post("/", authenticate, createVenue);
router.get("/", getVenues);
router.get("/admin", authenticate,getAllVenuesForAdmin);
router.get("/:id", getVenueById);
router.patch("/:id/approve",authenticate,approveVenue);

export default router;