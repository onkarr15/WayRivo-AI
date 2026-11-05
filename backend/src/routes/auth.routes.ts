import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  googleAuth,
  googleCallback,
  linkGoogle,
  unlinkGoogle,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  verifyResetTokenSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-reset-token', authRateLimiter, validate(verifyResetTokenSchema), verifyResetToken);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), resetPassword);

// Google OAuth 2.0 endpoints
router.get('/google', authRateLimiter, googleAuth);
router.get('/google/callback', googleCallback);
router.post('/google/link', authenticate, linkGoogle);
router.delete('/google/unlink', authenticate, unlinkGoogle);

router.get('/me', authenticate, getMe);

export default router;
