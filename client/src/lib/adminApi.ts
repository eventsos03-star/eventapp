import { request } from './api'
import type { AdminEvent, AdminStats, Organization, ResourceStatus, UserRole, UserSummary, VenueOwner } from '../types'

export const adminApi = {
  getStats: () => request<AdminStats>('/admin/stats', { auth: true }),

  getOrganizations: (status: ResourceStatus) =>
    request<Organization[]>(`/admin/organizations?status=${status}`, { auth: true }),

  getOrganizationDetail: (id: string) =>
    request<Organization>(`/admin/organizations/${id}`, { auth: true }),

  approveOrganization: (id: string) =>
    request<Organization>(`/admin/organizations/${id}/approve`, { method: 'PATCH', auth: true }),

  rejectOrganization: (id: string, reason: string) =>
    request<Organization>(`/admin/organizations/${id}/reject`, { method: 'PATCH', body: { reason }, auth: true }),

  getVenueOwners: (status: ResourceStatus) =>
    request<VenueOwner[]>(`/admin/venue-owners?status=${status}`, { auth: true }),

  approveVenueOwner: (ownerId: string) =>
    request<VenueOwner>(`/admin/venue-owners/${ownerId}/approve`, { method: 'PATCH', auth: true }),

  rejectVenueOwner: (ownerId: string) =>
    request<VenueOwner>(`/admin/venue-owners/${ownerId}/reject`, { method: 'PATCH', auth: true }),

  getUsers: (search?: string, page?: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (page) params.set('page', String(page))
    const query = params.toString()
    return request<{ users: UserSummary[]; total: number; page: number; totalPages: number }>(
      `/admin/users${query ? `?${query}` : ''}`,
      { auth: true },
    )
  },

  updateUserRole: (userId: string, role: UserRole) =>
    request<UserSummary>(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role }, auth: true }),

  deleteUser: (userId: string) =>
    request<void>(`/admin/users/${userId}`, { method: 'DELETE', auth: true }),

  getDeletedUsers: (search?: string, page?: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (page) params.set('page', String(page))
    const query = params.toString()
    return request<{ users: UserSummary[]; total: number; page: number; totalPages: number }>(
      `/admin/users/deleted${query ? `?${query}` : ''}`,
      { auth: true },
    )
  },

  restoreUser: (userId: string) =>
    request<UserSummary>(`/admin/users/${userId}/restore`, { method: 'PATCH', auth: true }),

  getAllEvents: () =>
    request<AdminEvent[]>('/events/admin/allevents', { auth: true }),

  deleteEvent: (id: string) =>
    request<void>(`/events/${id}`, { method: 'DELETE', auth: true }),

  publishEvent: (id: string) =>
    request<AdminEvent>(`/events/${id}/publish`, { method: 'PATCH', auth: true }),
}
