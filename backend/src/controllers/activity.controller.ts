import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess, sendCreated } from '../utils/response';

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = {
      destinationId: req.query.destinationId as string | undefined,
      category: req.query.category as string | undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit || req.query.size ? parseInt((req.query.limit || req.query.size) as string) : 50,
    };
    const { items, total } = await inventoryService.getActivities(options);
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

export const getActivityById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await inventoryService.getActivityById(req.params.id);
    sendSuccess(res, activity);
  } catch (error) {
    next(error);
  }
};

export const createActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await inventoryService.createActivity(req.body);
    sendCreated(res, activity);
  } catch (error) {
    next(error);
  }
};

export const updateActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await inventoryService.updateActivity(req.params.id, req.body);
    sendSuccess(res, activity);
  } catch (error) {
    next(error);
  }
};

export const deleteActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await inventoryService.deleteActivity(req.params.id);
    sendSuccess(res, activity);
  } catch (error) {
    next(error);
  }
};
