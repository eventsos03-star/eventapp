import Task, { type ITask } from './task.model.js';
import OrganizationMember from '../organization/organizationMember.model.js';
import { AppError } from '../../utils/AppError.js';

export async function createTask(
  organizationId: string,
  createdByUserId: string,
  data: {
    title: string;
    description?: string;
    assignedMemberId: string;
    eventId?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate: string | Date;
  }
) {
  // Validate that the assigned member belongs to this organization
  const member = await OrganizationMember.findOne({
    _id: data.assignedMemberId,
    organizationId,
    isDeleted: false,
  });

  if (!member) {
    throw new AppError('Assigned member does not exist in your organization', 404);
  }

  const task = await Task.create({
    ...data,
    organizationId,
    createdByUserId,
    dueDate: new Date(data.dueDate),
  });

  return task.populate([
    { path: 'assignedMemberId', populate: { path: 'userId', select: 'firstName lastName email avatar' } },
    { path: 'eventId', select: 'eventName eventDate' },
  ]);
}

export async function getOrganizationTasks(organizationId: string, filters?: { eventId?: string; status?: string }) {
  const query: any = { organizationId, isDeleted: false };
  if (filters?.eventId) query.eventId = filters.eventId;
  if (filters?.status) query.status = filters.status;

  return Task.find(query)
    .populate([
      { path: 'assignedMemberId', populate: { path: 'userId', select: 'firstName lastName email avatar' } },
      { path: 'eventId', select: 'eventName eventDate' },
      { path: 'createdByUserId', select: 'firstName lastName email' },
    ])
    .sort({ dueDate: 1 });
}

export async function updateTaskStatus(taskId: string, status: 'Todo' | 'InProgress' | 'Done', userId: string) {
  const task = await Task.findOne({ _id: taskId, isDeleted: false });
  if (!task) throw new AppError('Task not found', 404);

  task.status = status;
  await task.save();
  return task;
}

export async function deleteTask(taskId: string, organizationId: string) {
  const task = await Task.findOne({ _id: taskId, organizationId, isDeleted: false });
  if (!task) throw new AppError('Task not found', 404);

  task.isDeleted = true;
  await task.save();
  return { message: 'Task deleted successfully' };
}