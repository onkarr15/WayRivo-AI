import { Request, Response, NextFunction } from 'express';
import { destinationService } from '../services/destination.service';
import { sendSuccess, sendCreated } from '../utils/response';

export const getAllDestinations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = {
      search: req.query.search as string | undefined,
      state: req.query.state as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit || req.query.size ? parseInt((req.query.limit || req.query.size) as string) : 50,
    };
    const { items, total } = await destinationService.getAllDestinations(options);
    res.json({
      success: true,
      data: items,
      total,
      page: options.page,
      limit: options.limit,
    });
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

export const createDestination = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const destination = await destinationService.createDestination(req.body);
    sendCreated(res, destination);
  } catch (error) {
    next(error);
  }
};

export const updateDestination = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const destination = await destinationService.updateDestination(req.params.id, req.body);
    sendSuccess(res, destination);
  } catch (error) {
    next(error);
  }
};

export const deleteDestination = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const destination = await destinationService.deleteDestination(req.params.id);
    sendSuccess(res, destination);
  } catch (error) {
    next(error);
  }
};
