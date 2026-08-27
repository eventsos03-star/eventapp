import { request } from './api'
import type { AdminEvent, AdminStats, Organization, ResourceStatus, UserRole, UserSummary, VenueOwner } from '../types'

export type AdminStatus = ResourceStatus | 'deleted'

export const adminApi = {
  getStats: () => request<AdminStats>('/admin/stats', { auth: true }),

  getOrganizations: (status: AdminStatus) =>
    request<Organization[]>(`/admin/organizations?status=${status}`, { auth: true }),

  getOrganizationDetail: (id: string) =>
    request<Organization>(`/admin/organizations/${id}`, { auth: true }),

  approveOrganization: (id: string) =>
    request<Organization>(`/admin/organizations/${id}/approve`, { method: 'PATCH', auth: true }),

  rejectOrganization: (id: string, reason: string) =>
    request<Organization>(`/admin/organizations/${id}/reject`, { method: 'PATCH', body: { reason }, auth: true }),

  deleteOrganization: (id: string) =>
    request<Organization>(`/admin/organizations/${id}`, { method: 'DELETE', auth: true }),

  restoreOrganization: (id: string) =>
    request<Organization>(`/admin/organizations/${id}/restore`, { method: 'PATCH', auth: true }),

  getVenueOwners: (status: AdminStatus) =>
    request<VenueOwner[]>(`/admin/venue-owners?status=${status}`, { auth: true }),

  approveVenueOwner: (ownerId: string) =>
    request<VenueOwner>(`/admin/venue-owners/${ownerId}/approve`, { method: 'PATCH', auth: true }),

  rejectVenueOwner: (ownerId: string) =>
    request<VenueOwner>(`/admin/venue-owners/${ownerId}/reject`, { method: 'PATCH', auth: true }),

  restoreVenueOwner: (ownerId: string) =>
    request<VenueOwner>(`/admin/venue-owners/${ownerId}/restore`, { method: 'PATCH', auth: true }),

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

  permanentDeleteUser: (userId: string, confirmName: string) =>
    request<void>(`/admin/users/${userId}/permanent`, { method: 'DELETE', body: { confirmName }, auth: true }),

  permanentDeleteOrganization: (orgId: string, confirmName: string) =>
    request<void>(`/admin/organizations/${orgId}/permanent`, { method: 'DELETE', body: { confirmName }, auth: true }),

  permanentDeleteVenueOwner: (ownerId: string, confirmName: string) =>
    request<void>(`/admin/venue-owners/${ownerId}/permanent`, { method: 'DELETE', body: { confirmName }, auth: true }),

  getAllEvents: () =>
    request<AdminEvent[]>('/events/admin/allevents', { auth: true }),

  deleteEvent: (id: string) =>
    request<void>(`/events/${id}`, { method: 'DELETE', auth: true }),

  publishEvent: (id: string) =>
    request<AdminEvent>(`/events/${id}/publish`, { method: 'PATCH', auth: true }),
}
