import { Router } from 'express';
import {
  getAllDestinations,
  getDestinationById,
  getDestinationBySlug,
  createDestination,
  updateDestination,
  deleteDestination,
} from '../controllers/destination.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', getAllDestinations);
router.get('/popular', getAllDestinations);
router.get('/:id', getDestinationById);
router.get('/slug/:slug', getDestinationBySlug);

// Admin CUD routes
router.post('/', authenticate, requireRoles([UserRole.ADMIN]), createDestination);
router.put('/:id', authenticate, requireRoles([UserRole.ADMIN]), updateDestination);
router.delete('/:id', authenticate, requireRoles([UserRole.ADMIN]), deleteDestination);

export default router;
