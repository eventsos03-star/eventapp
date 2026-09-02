import { Router } from "express";
import {
  createVenue,
  getVenues,
  getAllVenuesForAdmin,
  getVenueById,
  approveVenue,
  updateVenue,
  deleteVenue,
  rejectVenue,
  getMyVenues
} from "../../modules/venue/venue.controller.js";
import { authenticate } from "../../middleware/authenticate.js";


const router = Router();
router.post("/", authenticate, createVenue);
router.get("/", getVenues);
router.get("/admin", authenticate,getAllVenuesForAdmin);
router.get("/my", authenticate, getMyVenues);
router.get("/:id", getVenueById);
router.patch("/:id/approve",authenticate,approveVenue);
router.patch("/:id", authenticate, updateVenue);
router.delete("/:id", authenticate, deleteVenue);
router.patch("/:id/reject", authenticate, rejectVenue);

export default router;