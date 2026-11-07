import { Router } from 'express';
import { getProfile, updateProfile, changePassword, getUserDashboard, deleteAccount } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema, deleteAccountSchema } from '../validators/auth.validator';

const router = Router();

router.get('/dashboard', authenticate, getUserDashboard);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.delete('/account', authenticate, validate(deleteAccountSchema), deleteAccount);

export default router;
