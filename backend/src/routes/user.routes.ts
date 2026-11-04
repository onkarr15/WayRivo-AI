import { Router } from 'express';
import { getProfile, updateProfile, changePassword, getUserDashboard } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '../validators/auth.validator';

const router = Router();

router.get('/dashboard', authenticate, getUserDashboard);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
