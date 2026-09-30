import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as eventService from "./event.service.js";
import { success } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
import { uploadEventBannerToS3, deleteImageFromS3 } from "../../services/s3.service.js";

export const create = asyncHandler(async (req, res) => {
  const eventId = new mongoose.Types.ObjectId();
  let uploadedKey: string | undefined;
  let bannerImage: { url: string; key: string } | undefined;

  try {
    if (req.file) {
      const s3Result = await uploadEventBannerToS3({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalFilename: req.file.originalname,
        eventId: eventId.toString(),
      });
      uploadedKey = s3Result.key;
      bannerImage = s3Result;
    }

    const event = await eventService.createEvent(
      {
        ...req.body,
        _id: eventId,
        ...(bannerImage && { bannerImage }),
      },
      req.user!.id
    );

    return success(res, 201, "event created successfully", event);
  } catch (error) {
    if (uploadedKey) {
      await deleteImageFromS3(uploadedKey).catch(() => {});
    }
    throw error;
  }
});

export const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let uploadedKey: string | undefined;
  let bannerImage: { url: string; key: string } | undefined;

  try {
    // 1. Fetch current event to find existing S3 banner key (if any)
    const existingEvent = await eventService.getEventById(id);
    if (!existingEvent) {
      throw new AppError("Event not found", 404);
    }
    const oldImageKey = existingEvent.bannerImage?.key;

    // 2. If a new image file was uploaded, upload it to S3
    if (req.file) {
      const s3Result = await uploadEventBannerToS3({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalFilename: req.file.originalname,
        eventId: id,
      });
      uploadedKey = s3Result.key;
      bannerImage = s3Result;
    }

    // 3. Update the event record in MongoDB
    const updatePayload = {
      ...req.body,
      ...(bannerImage && { bannerImage }),
    };

    const event = await eventService.updateEvent(id, updatePayload);

    // 4. If a new image was saved, remove the old S3 image
    if (bannerImage && oldImageKey && oldImageKey !== bannerImage.key) {
      await deleteImageFromS3(oldImageKey).catch(() => {});
    }

    return success(res, 200, "event updated successfully", event);
  } catch (error) {
    // Rollback: if DB update fails, delete the newly uploaded image from S3
    if (uploadedKey) {
      await deleteImageFromS3(uploadedKey).catch(() => {});
    }
    throw error;
  }
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await eventService.deleteEvent(id);

  // Best-effort cleanup: remove banner image from S3 if it exists
  if (event?.bannerImage?.key) {
    await deleteImageFromS3(event.bannerImage.key).catch(() => {});
  }

  return success(res, 200, "event deleted successfully", event);
});

export const publishEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await eventService.publishEvent(id);
  return success(res, 200, "event published successfully", event);
});

export const getPublishedEventLists = asyncHandler(async (req, res) => {
  const events = await eventService.getPublishedLists();
  return success(res, 200, "events fetched successfully", events);
});

export const getEventByOrganizationID = asyncHandler(async (req, res) => {
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw new AppError("No organization associated with this user", 403);
  }

  const events = await eventService.getEventByOrganizationID(organizationId);
  return success(res, 200, "events fetched successfully", events);
});

export const getAlleventsforadmin = asyncHandler(async (req, res) => {
  const events = await eventService.getalleventsforadmin();
  return success(res, 200, "events fetched successfully", events);
});

export const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const events = await eventService.getEventById(id);
  return success(res, 200, "event fetched successfully", events);
});

export const getParticipants = asyncHandler(async (req, res) => {
  const participants = await eventService.getEventParticipants(req.params.id);
  return success(res, 200, "Participants fetched successfully", participants);
});

export const toggleCheckIn = asyncHandler(async (req, res) => {
  const updated = await eventService.toggleParticipantCheckIn(req.params.regId);
  return success(res, 200, "Participant check-in updated", updated);
});