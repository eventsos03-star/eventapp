import crypto from 'node:crypto';

/**
 * Creates a random one-time token (for email verification / password reset).
 * Only the hashed version is stored in the database.
 */
export function generateEmailToken(): { raw: string; hashed: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hashed: hashToken(raw) };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
