import express from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import  {requireOrgRole}  from "../../middleware/requireOrgRole.js";
import { createEventSchema, publishEventSchema, updateEventSchema  } from "./event.validator.js";
import * as eventController from "./event.controller.js";
import * as publicEventController from "./public-event.controller.js"

const router = express.Router();

// router.post("/create", authenticate, validate(createEventSchema), eventController.create);
router.get("/",eventController.getPublishedEventLists)
router.get("/admin/allevents",eventController.getAlleventsforadmin)
router.get("/organization",authenticate,eventController.getEventByOrganizationID)
router.get("/public",publicEventController.getAllEventsController);
router.get("/public/:id",publicEventController.getEventsByIdController)
router.post("/", authenticate, validate(createEventSchema), eventController.create);
router.patch("/:id/publish" ,authenticate,validate(publishEventSchema),eventController.publishEvent)
router.get("/:id",authenticate,eventController.getEventById)
router.patch("/:id", authenticate, validate(updateEventSchema), eventController.updateEvent);
router.delete("/:id",authenticate,eventController.deleteEvent)


// Add these two routes:
router.get("/:id/participants", authenticate, requireOrgRole("user_manager"), eventController.getParticipants);
router.patch("/:id/participants/:regId/check-in", authenticate, requireOrgRole("user_manager"), eventController.toggleCheckIn);


//publicroute


export default router;
