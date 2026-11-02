import { Router } from 'express';
import { getPackages } from '../controllers/package.controller';

const router = Router();

router.get('/', getPackages);

export default router;
