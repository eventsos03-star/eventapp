import express from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { createEventSchema, publishEventSchema, updateEventSchema  } from "./event.validator.js";
import * as eventController from "./event.controller.js";

const router = express.Router();

// router.post("/create", authenticate, validate(createEventSchema), eventController.create);
router.post("/", authenticate, validate(createEventSchema), eventController.create);
router.patch("/:id/publish" ,authenticate,validate(publishEventSchema),eventController.publishEvent)
router.get("/",eventController.getPublishedEventLists)
router.get("/:id",authenticate,eventController.getEventById)
router.patch("/:id", authenticate, validate(updateEventSchema), eventController.updateEvent);
router.delete("/:id",authenticate,eventController.deleteEvent)

export default router;