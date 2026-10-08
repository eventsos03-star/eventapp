
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as dateHoldService from "./dateHold.service.js";

export const createDateHold = asyncHandler(async (req, res) => {
  const hold = await dateHoldService.createHold({
    userId: req.user!.id,
    venueId: req.params.venueId,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
  });

  return success(res, 201, "Date hold created successfully", hold);
});

export const refreshDateHold = asyncHandler(async (req, res) => {
  const hold = await dateHoldService.refreshHold({
    userId: req.user!.id,
    venueId: req.params.venueId,
    holdId: req.params.holdId,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
  });

  return success(res, 200, "Date hold refreshed successfully", hold);
});

export const releaseDateHold = asyncHandler(async (req, res) => {
  await dateHoldService.releaseHold({
    userId: req.user!.id,
    venueId: req.params.venueId,
    holdId: req.params.holdId,
  });

  return success(res, 200, "Date hold released successfully", null);
});

export const checkDateHold = asyncHandler(async (req, res) => {
  const status = await dateHoldService.getRangeStatus(
    req.params.venueId,
    new Date(req.query.startDate as string),
    new Date(req.query.endDate as string)
  );

  return success(res, 200, "Date availability fetched successfully", {
    available: status === "available",
    reason: status === "available" ? undefined : status,
  });
});
