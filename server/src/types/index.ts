export type UserStatus = 'ACTIVE' | 'PENDING' | 'BLOCKED';
export type UserProvider = 'local' | 'google';
export type UserRole = 'USER' | 'ADMIN';
export type VenueOwnerStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  organizationId: string | null;
}

export interface AccessTokenPayload {
  id: string;
  role: UserRole;
    organizationId: string | null;
  sessionId: string;
}

export interface RefreshTokenPayload {
  id: string;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionId?: string;
    }
  }
}

export {};
