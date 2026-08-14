import express from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { createEventSchema, publishEventSchema } from "./event.validator.js";
import * as eventController from "./event.controller.js";

const router = express.Router();

// router.post("/create", authenticate, validate(createEventSchema), eventController.create);
router.post("/", authenticate, validate(createEventSchema), eventController.create);
router.patch("/:id/publish" ,validate(publishEventSchema),eventController.publishEvent)
router.get("/",eventController.getPublishedEventLists)

export default router;