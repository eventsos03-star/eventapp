import { request } from './api'
import type {
  Organization,
  OrganizationMember,
  OrganizationType,
  OrganizationAddress,
} from '../types'

type CreateOrgInput = {
  organizationName: string
  organizationType: OrganizationType
  description?: string
  email: string
  phoneNumber?: string
  address?: Partial<OrganizationAddress>
}

type UpdateOrgInput = Partial<CreateOrgInput>

export const organizationApi = {
  getMy: () => request<Organization>('/organizations/me', { auth: true }),

  create: (input: CreateOrgInput) =>
    request<Organization>('/organizations', {
      method: 'POST',
      body: input,
      auth: true,
    }),

  update: (input: UpdateOrgInput) =>
    request<Organization>('/organizations/me', {
      method: 'PATCH',
      body: input,
      auth: true,
    }),

  getMembers: (orgId: string) =>
    request<OrganizationMember[]>(`/organizations/${orgId}/members`, {
      auth: true,
    }),

  addMember: (orgId: string, email: string, role: 'organizer' | 'member') =>
    request<OrganizationMember>(`/organizations/${orgId}/members`, {
      method: 'POST',
      body: { email, role },
      auth: true,
    }),

  removeMember: (orgId: string, memberId: string) =>
    request<void>(`/organizations/${orgId}/members/${memberId}`, {
      method: 'DELETE',
      auth: true,
    }),
}
