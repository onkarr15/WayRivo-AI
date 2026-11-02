import { Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const generatePlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await aiService.planJourney({
      ...req.body,
      userId: req.user?.id,
    });
    sendSuccess(res, result, 'AI itinerary and budget plan generated successfully');
  } catch (error) {
    next(error);
  }
};
