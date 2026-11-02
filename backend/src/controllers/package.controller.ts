import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess, sendCreated } from '../utils/response';

export const getPackages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = {
      destinationId: req.query.destinationId as string | undefined,
      isRecommended: req.query.isRecommended ? req.query.isRecommended === 'true' : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit || req.query.size ? parseInt((req.query.limit || req.query.size) as string) : 50,
    };
    const { items, total } = await inventoryService.getPackages(options);
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

export const getPackageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await inventoryService.getPackageById(req.params.id);
    sendSuccess(res, pkg);
  } catch (error) {
    next(error);
  }
};

export const createPackage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await inventoryService.createPackage(req.body);
    sendCreated(res, pkg);
  } catch (error) {
    next(error);
  }
};

export const updatePackage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await inventoryService.updatePackage(req.params.id, req.body);
    sendSuccess(res, pkg);
  } catch (error) {
    next(error);
  }
};

export const deletePackage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await inventoryService.deletePackage(req.params.id);
    sendSuccess(res, pkg);
  } catch (error) {
    next(error);
  }
};
