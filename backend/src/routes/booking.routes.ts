import { Router } from 'express';
import {
  createBooking,
  getBookingById,
  getUserBookings,
} from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createBookingSchema } from '../validators/booking.validator';

const router = Router();

router.post('/', authenticate, validate(createBookingSchema), createBooking);
router.get('/my', authenticate, getUserBookings);
router.get('/:id', authenticate, getBookingById);

export default router;
