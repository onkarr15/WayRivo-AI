import { Response, NextFunction } from 'express';
import { itineraryService } from '../services/itinerary.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const saveItinerary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const itinerary = await itineraryService.saveItinerary({
      userId: req.user!.id,
      ...req.body,
    });
    sendCreated(res, itinerary, 'Itinerary saved successfully');
  } catch (error) {
    next(error);
  }
};

export const getItineraryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const itinerary = await itineraryService.getItineraryById(req.params.id);
    sendSuccess(res, itinerary);
  } catch (error) {
    next(error);
  }
};

export const getUserItineraries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const itineraries = await itineraryService.getUserItineraries(req.user!.id);
    sendSuccess(res, itineraries);
  } catch (error) {
    next(error);
  }
};
