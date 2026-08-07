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
