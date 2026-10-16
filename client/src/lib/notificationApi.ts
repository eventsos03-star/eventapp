import { request } from './api'

export interface Notification {
  _id: string
  userId: string
  title: string
  message: string
  type: 'team' | 'organization' | 'venuBooking' | 'task' | 'General'
  referenceId?: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationListResult {
  notifications: Notification[]
  total: number
  unreadCount: number
  page: number
  totalPages: number
}

export const notificationApi = {
  list: (page = 1, limit = 20) =>
    request<NotificationListResult>(`/notifications?page=${page}&limit=${limit}`, { auth: true }),

  unreadCount: () =>
    request<{ count: number }>('/notifications/unread-count', { auth: true }),

  markRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: 'PATCH', auth: true }),

  markAllRead: () =>
    request<void>('/notifications/read-all', { method: 'PATCH', auth: true }),
}
