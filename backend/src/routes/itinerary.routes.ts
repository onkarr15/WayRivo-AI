import { Router } from 'express';
import {
  saveItinerary,
  getItineraryById,
  getUserItineraries,
} from '../controllers/itinerary.controller';
import {
  generateAdvancedItinerary,
  calculateDetailedBudget,
  optimizeItineraryBudget,
  saveCompleteItinerary,
  updateItineraryWithSafetyCheck,
} from '../controllers/itinerary-intelligence.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Advanced Itinerary & Budget Intelligence Endpoints
router.post('/generate', optionalAuthenticate, generateAdvancedItinerary);
router.post('/calculate-budget', optionalAuthenticate, calculateDetailedBudget);
router.post('/optimize-budget', optionalAuthenticate, optimizeItineraryBudget);

// Itinerary Management
router.post('/', authenticate, saveCompleteItinerary);
router.put('/:id', authenticate, updateItineraryWithSafetyCheck);
router.get('/my', authenticate, getUserItineraries);
router.get('/:id', authenticate, getItineraryById);

export default router;
