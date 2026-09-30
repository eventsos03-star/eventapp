import express from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { requireOrgRole } from "../../middleware/requireOrgRole.js";
import { uploadEventImage } from "../../middleware/eventImageUpload.js";
import { parseEventFormData } from "./eventFormData.middleware.js";
import { createEventSchema, publishEventSchema, updateEventSchema } from "./event.validator.js";
import * as eventController from "./event.controller.js";
import * as publicEventController from "./public-event.controller.js";

const router = express.Router();

router.get("/", eventController.getPublishedEventLists);
router.get("/admin/allevents", eventController.getAlleventsforadmin);
router.get("/organization", authenticate, eventController.getEventByOrganizationID);
router.get("/public", publicEventController.getAllEventsController);
router.get("/public/:id", publicEventController.getEventsByIdController);

// Create event with banner image
router.post(
  "/",
  authenticate,
  uploadEventImage,
  parseEventFormData,
  validate(createEventSchema),
  eventController.create
);

router.patch("/:id/publish", authenticate, validate(publishEventSchema), eventController.publishEvent);
router.get("/:id", authenticate, eventController.getEventById);

// Update event with banner image replacement support
router.patch(
  "/:id",
  authenticate,
  uploadEventImage,
  parseEventFormData,
  validate(updateEventSchema),
  eventController.updateEvent
);

router.delete("/:id", authenticate, eventController.deleteEvent);

router.get(
  "/:id/participants",
  authenticate,
  requireOrgRole("user_manager", "certificate_manager"),
  eventController.getParticipants
);

router.patch(
  "/:id/participants/:regId/check-in",
  authenticate,
  requireOrgRole("user_manager"),
  eventController.toggleCheckIn
);

export default router;