import rateLimit from 'express-rate-limit';

const jsonMessage = (message: string) => ({
  statusCode: 429,
  message: { success: false, message },
});

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
  message: jsonMessage('Too many login attempts, please try again later.'),
});

// Stricter limit for password reset requests.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many password reset requests, please try again later.'),
});
