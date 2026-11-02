import { Router } from 'express';
import { getActivities } from '../controllers/activity.controller';

const router = Router();

router.get('/', getActivities);

export default router;
