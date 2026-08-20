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

export type VenueStatus = 'pending' | 'approved' | 'rejected' | 'blocked'

export type BookingPaymentPolicy = 'fullpayment' | 'advanceAllowed' | 'payAfterEvent'

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
