import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.user!.id);
    sendSuccess(res, profile, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await authService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, updated, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.changePassword(req.user!.id, req.body);
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};
