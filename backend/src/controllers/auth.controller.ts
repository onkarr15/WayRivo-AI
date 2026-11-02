import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthRequest } from '../types';

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

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.resetPassword({
      token: req.body.token,
      newPassword: req.body.newPassword,
    });
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
