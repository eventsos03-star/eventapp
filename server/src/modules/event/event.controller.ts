import { asyncHandler } from "../../utils/asyncHandler.js";
import * as eventService from "./event.service.js";
import { success } from "../../utils/response.js";
import { id } from "zod/v4/locales";

export const create = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body);
  return success(res, 201, "event created successfully", event);
});

export const publishEvent = asyncHandler(async (req, res) => {
    const { id } = req.params
  const event = await eventService.publishEvent(id);
  return success(res, 201, "event published successfully", event);
});

export const getPublishedEventLists = asyncHandler(async (req, res) => {
  const events = await eventService.getPublishedLists();
  return success(res, 201, "events fetched successfully", events);
});