import type { Request, Response, NextFunction } from 'express';
import * as notificationService from './notification.service.js';

// GET /api/notifications
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await notificationService.getUserNotifications(userId, page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/notifications/unread-count
export async function unreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read
export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAsRead(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/read-all
export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}
