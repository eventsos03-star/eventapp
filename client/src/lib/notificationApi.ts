import { request } from './api'
import type { Notification, NotificationListResult } from '../types'

export const notificationApi = {
  socketTicket: () =>
    request<{ ticket: string; expiresIn: number }>('/notifications/socket-ticket', {
      method: 'POST',
      auth: true,
    }),

  list: (page = 1, limit = 20) =>
    request<NotificationListResult>(
      `/notifications?page=${page}&limit=${limit}`,
      { auth: true },
    ),

  unreadCount: () =>
    request<{ count: number }>('/notifications/unread-count', { auth: true }),

  markRead: (id: string) =>
    request<Notification>(`/notifications/${id}/read`, {
      method: 'PATCH',
      auth: true,
    }),

  markAllRead: () =>
    request<{ updated: number }>('/notifications/read-all', {
      method: 'PATCH',
      auth: true,
    }),

  remove: (id: string) =>
    request<void>(`/notifications/${id}`, {
      method: 'DELETE',
      auth: true,
    }),
}
