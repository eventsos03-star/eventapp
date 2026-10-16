import Notification from './notification.model.js';
import User from '../auth/user.model.js';
import type { Types } from 'mongoose';

// ── Core create helper ──────────────────────────────────────────────────────

export async function createNotification(
  userId: string | Types.ObjectId,
  title: string,
  message: string,
  type: 'team' | 'organization' | 'venuBooking' | 'task' | 'General',
  referenceId?: string | Types.ObjectId,
): Promise<void> {
  await Notification.create({
    userId,
    title,
    message,
    type,
    referenceId,
    isRead: false,
  });
}

// Notify every admin in the system
export async function notifyAllAdmins(
  title: string,
  message: string,
  type: 'team' | 'organization' | 'venuBooking' | 'task' | 'General',
  referenceId?: string | Types.ObjectId,
): Promise<void> {
  const admins = await User.find({ role: 'ADMIN' }).select('_id').lean();
  await Promise.all(
    admins.map((admin) =>
      createNotification(admin._id, title, message, type, referenceId),
    ),
  );
}

// ── Query helpers ───────────────────────────────────────────────────────────

export async function getUserNotifications(
  userId: string,
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
  );
}

export async function markAllAsRead(userId: string): Promise<void> {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({ userId, isRead: false });
}
