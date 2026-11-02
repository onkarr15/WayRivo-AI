import { Router } from 'express';
import {
  getAllDestinations,
  getDestinationById,
  getDestinationBySlug,
} from '../controllers/destination.controller';

const router = Router();

router.get('/', getAllDestinations);
router.get('/popular', getAllDestinations); // compatibility with legacy frontend destinationService.getPopular()
router.get('/:id', getDestinationById);
router.get('/slug/:slug', getDestinationBySlug);

export default router;
