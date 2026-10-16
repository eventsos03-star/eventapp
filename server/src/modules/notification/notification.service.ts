import Notification, { type INotification } from './notification.model.js';
import User from '../auth/user.model.js';
import { emitToUser } from '../../socket/index.js';
import { USER_ROLE, USER_STATUS } from '../../constants/index.js';
import { AppError } from '../../utils/AppError.js';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: INotification['type'];
  referenceId?: string;
  link?: string;
  meta?: Record<string, unknown>;
}

function logFailure(context: string, error: unknown): void {
  console.error(
    `[notification] ${context} failed:`,
    error instanceof Error ? error.message : error,
  );
}

/** Persist then emit. May throw on DB error (callers should use notify()). */
export async function createNotification(input: CreateNotificationInput) {
  const notification = await Notification.create({
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    referenceId: input.referenceId,
    link: input.link,
    meta: input.meta,
  });

  try {
    emitToUser(input.userId, 'notification:new', notification.toObject());
  } catch (error) {
    logFailure('emit', error);
  }

  return notification;
}

/** Fire-and-forget wrapper: a notification must never break the caller's flow. */
export async function notify(input: CreateNotificationInput): Promise<void> {
  try {
    await createNotification(input);
  } catch (error) {
    logFailure('create', error);
  }
}

/** Send the same notification to every active admin. */
export async function notifyAdmins(
  input: Omit<CreateNotificationInput, 'userId'>,
): Promise<void> {
  try {
    const admins = await User.find({
      role: USER_ROLE.ADMIN,
      status: USER_STATUS.ACTIVE,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }).select('_id');

    await Promise.all(
      admins.map((admin) => notify({ ...input, userId: admin._id.toString() })),
    );
  } catch (error) {
    logFailure('notifyAdmins', error);
  }
}

export async function listNotifications(
  userId: string,
  opts: { unread?: boolean; page: number; limit: number },
) {
  const filter: Record<string, unknown> = { userId };
  if (opts.unread) filter.isRead = false;

  const skip = (opts.page - 1) * opts.limit;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(opts.limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    items,
    total,
    page: opts.page,
    limit: opts.limit,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
    unreadCount,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({ userId, isRead: false });
}

export async function markRead(userId: string, notificationId: string) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true },
  );
  if (!notification) throw new AppError('Notification not found', 404);
  return notification;
}

export async function markAllRead(userId: string): Promise<number> {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );
  return result.modifiedCount;
}

export async function removeNotification(userId: string, notificationId: string): Promise<void> {
  const result = await Notification.deleteOne({ _id: notificationId, userId });
  if (result.deletedCount === 0) throw new AppError('Notification not found', 404);
}

export async function clearAllNotifications(userId: string): Promise<number> {
  const result = await Notification.deleteMany({ userId });
  return result.deletedCount;
}