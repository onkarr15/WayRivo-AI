import { Router } from 'express';
import {
  saveItinerary,
  getItineraryById,
  getUserItineraries,
} from '../controllers/itinerary.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { saveItinerarySchema } from '../validators/itinerary.validator';

const router = Router();

router.post('/', authenticate, validate(saveItinerarySchema), saveItinerary);
router.get('/my', authenticate, getUserItineraries);
router.get('/:id', authenticate, getItineraryById);

export default router;
