import { Request, Response, NextFunction } from 'express';
import { destinationService } from '../services/destination.service';
import { sendSuccess } from '../utils/response';

export const getAllDestinations = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const destinations = await destinationService.getAllDestinations();
    sendSuccess(res, destinations);
  } catch (error) {
    next(error);
  }
};

export const getDestinationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const destination = await destinationService.getDestinationById(req.params.id);
    sendSuccess(res, destination);
  } catch (error) {
    next(error);
  }
};

export const getDestinationBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const destination = await destinationService.getDestinationBySlug(req.params.slug);
    sendSuccess(res, destination);
  } catch (error) {
    next(error);
  }
};
