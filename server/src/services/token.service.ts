import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AccessTokenPayload, RefreshTokenPayload, UserRole } from '../types/index.js';

export function signAccessToken(payload: {
  id: string;
  role: UserRole;
  sessionId: string;
  organizationId?: string | null;
}): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRE,
  } as SignOptions);
}

export function signRefreshToken(payload: { id: string; sessionId: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRE,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function signSocketTicket(userId: string): string {
  return jwt.sign({ id: userId, purpose: 'socket' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '60s',
  } as SignOptions);
}

export function verifySocketTicket(token: string): { id: string } {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
    id?: string;
    purpose?: string;
  };

  if (decoded.purpose !== 'socket' || !decoded.id) {
    throw new Error('Invalid socket ticket');
  }

  return { id: decoded.id };
}
