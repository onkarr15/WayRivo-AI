import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess, sendCreated } from '../utils/response';

export const getHotels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = {
      destinationId: req.query.destinationId as string | undefined,
      minStars: req.query.stars
        ? parseInt(req.query.stars as string)
        : req.query.minStars
        ? parseInt(req.query.minStars as string)
        : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit || req.query.size ? parseInt((req.query.limit || req.query.size) as string) : 50,
    };
    const { items, total } = await inventoryService.getHotels(options);
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

export const getHotelById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotel = await inventoryService.getHotelById(req.params.id);
    sendSuccess(res, hotel);
  } catch (error) {
    next(error);
  }
};

export const createHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotel = await inventoryService.createHotel(req.body);
    sendCreated(res, hotel);
  } catch (error) {
    next(error);
  }
};

export const updateHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotel = await inventoryService.updateHotel(req.params.id, req.body);
    sendSuccess(res, hotel);
  } catch (error) {
    next(error);
  }
};

export const deleteHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotel = await inventoryService.deleteHotel(req.params.id);
    sendSuccess(res, hotel);
  } catch (error) {
    next(error);
  }
};
