import { Router } from 'express';
import {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
} from '../controllers/hotel.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', getHotels);
router.get('/:id', getHotelById);

// Admin CUD routes
router.post('/', authenticate, requireRoles([UserRole.ADMIN]), createHotel);
router.put('/:id', authenticate, requireRoles([UserRole.ADMIN]), updateHotel);
router.delete('/:id', authenticate, requireRoles([UserRole.ADMIN]), deleteHotel);

export default router;
