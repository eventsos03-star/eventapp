import express from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { validate } from "../../middleware/validate.js"
import { createEventSchema } from "./event.validator.js"
import * as eventController from "../events/event.controller.js"
const router = express.Router()

// router.post("/create",authenticate,validate(createEventSchema),eventController.create)
router.post("/create",validate(createEventSchema),eventController.create)

export default router