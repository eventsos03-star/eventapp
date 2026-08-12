import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import {
  authLimiter,
  forgotPasswordLimiter,
  loginLimiter,
} from '../../shared/middleware/rateLimiter.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.get('/verify-email', authLimiter, authController.verifyEmail);

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authLimiter, authController.logout);
router.post('/logout-all', authenticate, authLimiter, authController.logoutAll);

router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/change-password', authenticate, authLimiter, validate(changePasswordSchema), authController.changePassword);

router.post('/google', authLimiter, validate(googleSchema), authController.google);
router.get('/me', authenticate, authLimiter, authController.me);
router.patch('/me', authenticate, authLimiter, validate(updateProfileSchema), authController.updateMe);

export default router;
