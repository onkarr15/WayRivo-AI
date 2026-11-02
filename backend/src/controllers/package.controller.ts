import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess } from '../utils/response';

export const getPackages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const destinationId = req.query.destinationId as string | undefined;
    const isRecommended = req.query.isRecommended ? req.query.isRecommended === 'true' : undefined;
    const packages = await inventoryService.getPackages(destinationId, isRecommended);
    sendSuccess(res, packages);
  } catch (error) {
    next(error);
  }
};
