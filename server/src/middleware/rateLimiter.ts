import type { Request } from 'express';
import rateLimit from 'express-rate-limit';

const jsonMessage = (message: string) => ({
  statusCode: 429,
  message: { success: false, message },
});

// Key rate limits by IP + email so guessing is throttled per account as well
// as per IP (req.body is parsed by express.json before routes run).
function keyByIpAndEmail(req: Request): string {
  const email =
    typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
  return `${req.ip}:${email}`;
}

// General throttle for all auth routes.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many requests, please try again later.'),
});

// Stricter limit for login attempts.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIpAndEmail,
  message: jsonMessage('Too many login attempts, please try again later.'),
});

// Stricter limit for password reset requests.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIpAndEmail,
  message: jsonMessage(
    'Too many password reset requests, please try again later.',
  ),
});
