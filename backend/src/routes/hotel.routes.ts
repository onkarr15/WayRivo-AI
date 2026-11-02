import { Router } from 'express';
import { getHotels } from '../controllers/hotel.controller';

const router = Router();

router.get('/', getHotels);

export default router;
