import { Router } from 'express';
import { getAdminStats, getAuditLogs, getInventoryOverview } from '../controllers/admin.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate, requireRoles([UserRole.ADMIN]));

router.get('/stats', getAdminStats);
router.get('/audit-logs', getAuditLogs);
router.get('/inventory', getInventoryOverview);

export default router;
