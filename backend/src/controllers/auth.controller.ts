import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { googleAuthService } from '../services/google-auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthRequest } from '../types';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('wayrivo_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    setAuthCookie(res, result.token);
    sendCreated(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    setAuthCookie(res, result.token);
    // Response includes both data.token and legacy root token for backward compatibility
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
      token: result.token,
      userId: result.userId,
      name: result.name,
      email: result.email,
      role: result.role,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('wayrivo_token', { path: '/' });
    sendSuccess(res, { loggedOut: true }, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.verifyEmail(req.body.token);
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.requestPasswordReset(req.body.email);
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const verifyResetToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.verifyResetToken(req.body.token);
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.resetPassword({
      token: req.body.token,
      newPassword: req.body.newPassword,
    });
    // Clear any existing session cookie
    res.clearCookie('wayrivo_token', { path: '/' });
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getProfile(req.user!.id);
    sendSuccess(res, user, 'Current user profile');
  } catch (error) {
    next(error);
  }
};

/**
 * Initiates the Google OAuth 2.0 Authorization Code flow with PKCE & state
 */
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = (req.query.role as string) || 'TRAVELER';
    const returnTo = (req.query.returnTo as string) || '';

    const { url, stateData } = googleAuthService.generateAuthUrl({ role, returnTo });

    // Store state & PKCE verifier in a secure, HTTP-only temporary cookie
    res.cookie('wayrivo_oauth_state', JSON.stringify(stateData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
    });

    // If API client requests JSON, return the URL; otherwise redirect browser
    if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
      sendSuccess(res, { url, state: stateData.state });
    } else {
      res.redirect(url);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Handles the Google OAuth 2.0 redirect callback
 */
export const googleCallback = async (req: Request, res: Response) => {
  const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

  try {
    // Check if user cancelled authentication on Google consent screen
    if (req.query.error === 'access_denied') {
      res.clearCookie('wayrivo_oauth_state', { path: '/' });
      return res.redirect(`${frontendUrl}/login?error=google_cancelled`);
    }

    if (req.query.error) {
      res.clearCookie('wayrivo_oauth_state', { path: '/' });
      const googleErr = encodeURIComponent(String(req.query.error_description || req.query.error));
      return res.redirect(`${frontendUrl}/login?error=${googleErr}`);
    }

    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      res.clearCookie('wayrivo_oauth_state', { path: '/' });
      return res.redirect(`${frontendUrl}/login?error=missing_oauth_parameters`);
    }

    // Retrieve state & PKCE verifier from cookie
    let cookieStateData: any;
    try {
      if (req.cookies && req.cookies.wayrivo_oauth_state) {
        cookieStateData = JSON.parse(req.cookies.wayrivo_oauth_state);
      }
    } catch (e) {
      logger.warn('Failed to parse wayrivo_oauth_state cookie:', e);
    }

    // Clear state cookie immediately
    res.clearCookie('wayrivo_oauth_state', { path: '/' });

    const result = await googleAuthService.handleCallback({
      code,
      state,
      cookieStateData,
    });

    // Set authenticated session cookie
    setAuthCookie(res, result.token);

    const redirectTarget = `${frontendUrl}/auth/callback?token=${encodeURIComponent(result.token)}&role=${encodeURIComponent(result.user.role)}&isNew=${result.isNewUser}`;
    res.redirect(redirectTarget);
  } catch (err: any) {
    logger.error('Google OAuth callback error:', err.message);

    if (err.code === 'ACCOUNT_EXISTS_WITH_PASSWORD') {
      const email = encodeURIComponent(err.email || '');
      return res.redirect(`${frontendUrl}/login?error=account_exists_with_password&email=${email}`);
    }

    const errorMsg = encodeURIComponent(err.message || 'Google authentication failed');
    res.redirect(`${frontendUrl}/login?error=${errorMsg}`);
  }
};

/**
 * Authenticated endpoint: Link a Google identity to current account
 */
export const linkGoogle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'Google idToken is required.' });
    }
    const result = await googleAuthService.linkAccount(req.user!.id, idToken);
    sendSuccess(res, result, 'Google account linked successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticated endpoint: Unlink Google identity from current account
 */
export const unlinkGoogle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await googleAuthService.unlinkAccount(req.user!.id);
    sendSuccess(res, result, 'Google account unlinked successfully');
  } catch (error) {
    next(error);
  }
};
