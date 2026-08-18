import { request } from './api'
import type { AdminStats, Organization, ResourceStatus, VenueOwner } from '../types'

// Thin admin API layer. Reuses the shared fetch/refresh machinery in lib/api,
// so admin requests automatically inherit the httpOnly-cookie auth + 401
// retry-on-refresh behaviour used by every other API call.
export const adminApi = {
  getStats: () => request<AdminStats>('/admin/stats', { auth: true }),

  getOrganizations: (status: ResourceStatus) =>
    request<Organization[]>(`/admin/organizations?status=${status}`, { auth: true }),

  approveOrganization: (id: string) =>
    request<Organization>(`/admin/organizations/${id}/approve`, { method: 'PATCH', auth: true }),

  rejectOrganization: (id: string) =>
    request<Organization>(`/admin/organizations/${id}/reject`, { method: 'PATCH', auth: true }),

  getVenueOwners: (status: ResourceStatus) =>
    request<VenueOwner[]>(`/admin/venue-owners?status=${status}`, { auth: true }),

  approveVenueOwner: (ownerId: string) =>
    request<VenueOwner>(`/admin/venue-owners/${ownerId}/approve`, { method: 'PATCH', auth: true }),

  rejectVenueOwner: (ownerId: string) =>
    request<VenueOwner>(`/admin/venue-owners/${ownerId}/reject`, { method: 'PATCH', auth: true }),
}
