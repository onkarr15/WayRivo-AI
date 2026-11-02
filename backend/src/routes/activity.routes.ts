import { Router } from 'express';
import {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../controllers/activity.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', getActivities);
router.get('/:id', getActivityById);

// Admin CUD routes
router.post('/', authenticate, requireRoles([UserRole.ADMIN]), createActivity);
router.put('/:id', authenticate, requireRoles([UserRole.ADMIN]), updateActivity);
router.delete('/:id', authenticate, requireRoles([UserRole.ADMIN]), deleteActivity);

export default router;
