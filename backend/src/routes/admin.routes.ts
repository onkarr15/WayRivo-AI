import { Router } from 'express';
import {
  getAdminStats,
  getAdminAnalytics,
  getAdminUsers,
  updateUserRole,
  updateUserStatus,
  getAdminBookings,
  getAdminPayments,
  getAdminCancellations,
  getAuditLogs,
  getInventoryOverview,
} from '../controllers/admin.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Strict Admin RBAC enforcement
router.use(authenticate, requireRoles([UserRole.ADMIN]));

router.get('/stats', getAdminStats);
router.get('/analytics', getAdminAnalytics);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.get('/bookings', getAdminBookings);
router.get('/payments', getAdminPayments);
router.get('/cancellations', getAdminCancellations);
router.get('/audit-logs', getAuditLogs);
router.get('/inventory', getInventoryOverview);

export default router;
