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

export interface Organization {
  id: string
  organizationName: string
  description?: string
  logo?: string
  email: string
  phoneNumber?: string
  address: string
  ownerId: string
  status: ResourceStatus
  createdAt: string
  updatedAt: string
}

export interface VenueImage {
  url: string
  publicId: string
}

export interface Venue {
  id: string
  ownerId: string
  venueName: string
  description: string
  images: VenueImage[]
  location: { address: string; city: string; state: string }
  capacity: number
  pricePerDay: number
  bookingPaymentPolicy: 'fullpayment' | 'advanceAllowed' | 'payAfterEvent'
  advancePercentage?: number
  status: ResourceStatus
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
