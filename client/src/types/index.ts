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
  isDeleted?: boolean
  isOwnerDeleted?: boolean
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
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  formattedAddress: string
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
  isDeleted?: boolean
  distance?: number
  createdAt: string
  updatedAt: string
}

export interface VenueOwner {
  ownerId: string
  firstName: string
  lastName: string
  email: string
  venueCount: number
  isOwnerDeleted: boolean
  venues: Venue[]
}

export interface GeocodingResult {
  latitude: number
  longitude: number
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  formattedAddress: string
}

export interface VenueSearchResult {
  venues: Venue[]
  total: number
  page: number
  totalPages: number
}

export type VenueBookingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'

export interface VenueBooking {
  _id: string
  organizationId: string
  venueId: string
  requestedBy:
    | string
    | { _id: string; firstName: string; lastName: string; email: string }
  startDate: string
  endDate: string
  bookingAmount: number
  status: VenueBookingStatus
  paymentStatus: 'pending' | 'advancePaid' | 'fullyPaid'
  cancellationReason?: string
  cancelledBy?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

export interface BookingDateRange {
  startDate: string
  endDate: string
}

export interface CreateBookingInput {
  venueId: string
  startDate: Date | string
  endDate: Date | string
}

export interface UserSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  status: UserStatus
  provider: UserProvider
  createdAt: string
}

export interface AdminStats {
  totalOrganizations: number
  pendingOrganizations: number
  totalVenueOwners: number
  pendingVenueOwners: number
  totalUsers: number
}

export interface AdminReportCounts {
  totalEvents: number
  publishedEvents: number
  totalVenues: number
  approvedVenues: number
  pendingVenues: number
  totalBookings: number
  pendingBookings: number
  approvedBookings: number
  cancelledBookings: number
  completedBookings: number
  totalOrganizations: number
  approvedOrganizations: number
  totalUsers: number
  totalAdmins: number
}

export interface AdminBooking {
  id: string
  organizationId: { _id: string; organizationName: string } | null
  venueId:
    | { _id: string; venueName: string; location?: { formattedAddress?: string; city?: string } }
    | null
  requestedBy: { _id: string; firstName: string; lastName: string; email: string } | null
  startDate: string
  endDate: string
  bookingAmount: number
  status: VenueBookingStatus
  paymentStatus: 'pending' | 'advancePaid' | 'fullyPaid'
  cancellationReason?: string
  cancelledBy?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateVenueInput {
  venueName: string
  description: string
  images: VenueImage[]
  location: VenueLocation
  capacity: number
  pricePerDay: number
  bookingPaymentPolicy: BookingPaymentPolicy
  advancePercentage?: number
}

export interface UpdateVenueInput {
  venueName?: string
  description?: string
  images?: VenueImage[]
  location?: Partial<VenueLocation>
  capacity?: number
  pricePerDay?: number
  bookingPaymentPolicy?: BookingPaymentPolicy
  advancePercentage?: number
}


export interface AdminEvent {
  _id: string
  eventName: string
  description: string
  eventType: 'free' | 'paid'
  registrationType: 'team' | 'individual'
  maxParticipants: number
  ticketPrice?: number
  teamSize?: number
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
  eventDate: string
  eventEndDate?: string
  registrationStartDate: string
  registrationEndDate: string
  certificateEnabled: boolean
  organizationId: { _id: string; organizationName: string } | null
  venueBookingId?: string
  createdBy: { _id: string; firstName: string; lastName: string; email: string } | string
  createdAt: string
  updatedAt: string
}