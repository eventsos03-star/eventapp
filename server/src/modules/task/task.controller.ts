import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';
import * as taskService from './task.service.js';

export const create = asyncHandler(async (req, res) => {
  const organizationId = req.user!.organizationId;
  if (!organizationId) throw new AppError('No organization associated with this account', 403);

  const task = await taskService.createTask(organizationId, req.user!.id, req.body);
  return success(res, 201, 'Task assigned successfully', task);
});

export const listOrgTasks = asyncHandler(async (req, res) => {
  const organizationId = req.user!.organizationId;
  if (!organizationId) throw new AppError('No organization associated with this account', 403);

  const { eventId, status } = req.query as { eventId?: string; status?: string };
  const tasks = await taskService.getOrganizationTasks(organizationId, { eventId, status });
  return success(res, 200, 'Tasks fetched successfully', tasks);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const task = await taskService.updateTaskStatus(id, status, req.user!.id);
  return success(res, 200, 'Task status updated', task);
});

export const remove = asyncHandler(async (req, res) => {
  const organizationId = req.user!.organizationId;
  if (!organizationId) throw new AppError('No organization associated with this account', 403);

  await taskService.deleteTask(req.params.id, organizationId);
  return success(res, 200, 'Task removed successfully');
});