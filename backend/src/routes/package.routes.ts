import { Router } from 'express';
import {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} from '../controllers/package.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', getPackages);
router.get('/:id', getPackageById);

// Admin CUD routes
router.post('/', authenticate, requireRoles([UserRole.ADMIN]), createPackage);
router.put('/:id', authenticate, requireRoles([UserRole.ADMIN]), updatePackage);
router.delete('/:id', authenticate, requireRoles([UserRole.ADMIN]), deletePackage);

export default router;
