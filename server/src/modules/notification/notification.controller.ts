import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';
import { signSocketTicket } from '../../services/token.service.js';
import * as notificationService from './notification.service.js';

export const list = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const unread = req.query.unread === 'true';
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  const result = await notificationService.listNotifications(userId, { unread, page, limit });
  return success(res, 200, 'Notifications fetched successfully', result);
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user!.id);
  return success(res, 200, 'Unread count fetched successfully', { count });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user!.id, req.params.id);
  return success(res, 200, 'Notification marked as read', notification);
});

export const markAllRead = asyncHandler(async (req, res) => {
  const updated = await notificationService.markAllRead(req.user!.id);
  return success(res, 200, 'All notifications marked as read', { updated });
});

export const remove = asyncHandler(async (req, res) => {
  await notificationService.removeNotification(req.user!.id, req.params.id);
  return success(res, 200, 'Notification removed successfully');
});

export const issueSocketTicket = asyncHandler(async (req, res) => {
  const ticket = signSocketTicket(req.user!.id);
  return success(res, 200, 'Socket ticket issued', { ticket, expiresIn: 60 });
});