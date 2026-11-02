import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess } from '../utils/response';

export const getHotels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const destinationId = req.query.destinationId as string | undefined;
    const hotels = await inventoryService.getHotels(destinationId);
    sendSuccess(res, hotels);
  } catch (error) {
    next(error);
  }
};
