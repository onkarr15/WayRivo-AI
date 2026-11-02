import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess } from '../utils/response';

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const destinationId = req.query.destinationId as string | undefined;
    const category = req.query.category as string | undefined;
    const activities = await inventoryService.getActivities(destinationId, category);
    sendSuccess(res, activities);
  } catch (error) {
    next(error);
  }
};
