export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  BLOCKED: 'BLOCKED',
} as const;

export const USER_PROVIDER = {
  LOCAL: 'local',
  GOOGLE: 'google',
} as const;

export const USER_ROLE = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export const VENUE_OWNER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const REFRESH_COOKIE_NAME = 'refreshToken';
export const ACCESS_COOKIE_NAME = 'accessToken';

// 30 days in milliseconds
export const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// 15 minutes in milliseconds (matches ACCESS_TOKEN_EXPIRE)
export const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;

// 24 hours for email verification links
export const VERIFY_EMAIL_EXPIRES_MS = 24 * 60 * 60 * 1000;

// 30 minutes for password reset links
export const RESET_PASSWORD_EXPIRES_MS = 30 * 60 * 1000;
