import { asyncHandler } from '../../utils/asyncHandler.js';
import * as eventService from './event.service.js';
import { success } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';

export const create = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user!.id);
  return success(res, 201, 'event created successfully', event);
});

export const publishEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await eventService.publishEvent(id);
  return success(res, 200, 'event published successfully', event);
});

export const getPublishedEventLists = asyncHandler(async (req, res) => {
  const events = await eventService.getPublishedLists();
  return success(res, 200, 'events fetched successfully', events);
});

export const getEventByOrganizationID = asyncHandler(async (req, res) => {
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw new AppError('No organization associated with this user', 403);
  }

  const events = await eventService.getEventByOrganizationID(organizationId);
  return success(res, 200, 'events fetched successfully', events);
});

export const getAlleventsforadmin = asyncHandler(async (req, res) => {
  const events = await eventService.getalleventsforadmin();
  return success(res, 200, 'events fetched successfully', events);
});
export const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const events = await eventService.getEventById(id);
  return success(res, 200, 'event fetched successfully', events);
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const events = await eventService.deleteEvent(id);
  return success(res, 200, 'event fetched successfully', events);
});

export const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await eventService.updateEvent(id, req.body);
  return success(res, 200, 'event updated successfully', event);
});
