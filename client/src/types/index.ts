export type UserStatus = 'ACTIVE' | 'PENDING' | 'BLOCKED'
export type UserRole = 'USER' | 'ADMIN'
export type UserProvider = 'local' | 'google'

export interface SafeUser {
  id: string
  firstName: string
  lastName: string
  email: string
  provider: UserProvider
  googleId?: string
  avatar?: string
  emailVerified: boolean
  status: UserStatus
  role: UserRole
  organizationId: string | null        // NEW
  createdAt: string
  updatedAt: string
}

export interface ApiSuccess<T = undefined> {
  success: true
  message: string
  data?: T
}

export interface ApiErrorBody {
  success: false
  message: string
}

export interface AuthResult {
  accessToken: string
  user: SafeUser
}

export interface SessionInfo {
  id: string
  browser: string
  ip: string
  userAgent: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  isCurrent: boolean
}

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export type ResourceStatus = 'pending' | 'approved' | 'rejected' | 'blocked'

export type VenueStatus = ResourceStatus

export type BookingPaymentPolicy = 'fullpayment' | 'advanceAllowed' | 'payAfterEvent'

export type OrganizationType = 'college' | 'company' | 'startup' | 'ngo' | 'community' | 'event_org' | 'other'

export interface OrganizationAddress {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Organization {
  id: string
  organizationName: string
  organizationType: OrganizationType
  description?: string
  logo?: string
  email: string
  phoneNumber?: string
  address: OrganizationAddress
  ownerId: string | { firstName: string; lastName: string; email: string }
  status: ResourceStatus
  approvedAt?: string
  approvedBy?: string | { firstName: string; lastName: string; email: string }
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string | { firstName: string; lastName: string; email: string; avatar?: string }
  inviteEmail?: string
  role: 'owner' | 'organizer' | 'member'
  inviteStatus: 'pending' | 'accepted' | 'rejected'
  invitedBy: string
  createdAt: string
  updatedAt: string
}

export interface VenueImage {
  url: string
  publicId: string
}

export interface VenueLocation {
  address: string
  city: string
  state: string
}

export interface Venue {
  _id: string
  ownerId: string
  venueName: string
  description: string
  images: VenueImage[]
  location: VenueLocation
  capacity: number
  pricePerDay: number
  bookingPaymentPolicy: BookingPaymentPolicy
  advancePercentage?: number
  status: VenueStatus
  createdAt: string
  updatedAt: string
}

export interface VenueOwner {
  ownerId: string
  firstName: string
  lastName: string
  email: string
  venueCount: number
  venues: Venue[]
}

export interface AdminStats {
  totalOrganizations: number
  pendingOrganizations: number
  totalVenueOwners: number
  pendingVenueOwners: number
}

export interface CreateVenueInput {
  ownerId: string
  venueName: string
  description: string
  images: VenueImage[]
  location: VenueLocation
  capacity: number
  pricePerDay: number
  bookingPaymentPolicy: BookingPaymentPolicy
  advancePercentage?: number
}
