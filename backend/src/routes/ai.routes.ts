import { Router } from 'express';
import { generatePlan } from '../controllers/ai.controller';
import { validate } from '../middleware/validate';
import { generateItinerarySchema } from '../validators/itinerary.validator';

const router = Router();

router.post('/plan', validate(generateItinerarySchema), generatePlan);

export default router;
