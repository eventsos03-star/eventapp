import { asyncHandler } from "../../utils/asyncHandler.js";
import * as eventService from "./event.service.js";
import { success } from "../../utils/response.js";

export const create = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body);
  return success(res, 201, "event created successfully", event);
});