import { Router } from 'express';
import {
  getAdminStats,
  getAdminAnalytics,
  getAdminUsers,
  getAdminUserProfile,
  updateUserRole,
  updateUserStatus,
  getAdminBookings,
  getAdminPayments,
  getAdminCancellations,
  getAuditLogs,
  getInventoryOverview,
  getAdminExperts,
  updateExpertVerification,
  getAdminTripRequests,
  getAdminReviews,
  getAdminDashboardOverview,
  getAdminRecentTrips,
  getAdminRecentPayments,
  getAdminPendingPayments,
  getAdminPaymentDetail,
  reconcileAdminPayment,
  getAdminRevenueOverview,
  getAdminMonthlyRevenue,
  getAdminTravellerRevenue,
  getAdminTravellerRevenueProfile,
  getAdminReportsPayments,
  getAdminReportsRevenue,
} from '../controllers/admin.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Strict Admin RBAC enforcement
router.use(authenticate, requireRoles([UserRole.ADMIN]));

router.get('/stats', getAdminStats);
router.get('/analytics', getAdminAnalytics);
router.get('/users', getAdminUsers);
router.get('/users/:id/profile', getAdminUserProfile);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.get('/experts', getAdminExperts);
router.patch('/experts/:id/verification', updateExpertVerification);
router.get('/trip-requests', getAdminTripRequests);
router.get('/reviews', getAdminReviews);
router.get('/bookings', getAdminBookings);
router.get('/payments', getAdminPayments);
router.get('/cancellations', getAdminCancellations);
router.get('/audit-logs', getAuditLogs);
router.get('/inventory', getInventoryOverview);

// Enhanced Admin Financial & Trip Analytics
router.get('/dashboard/overview', getAdminDashboardOverview);
router.get('/trips/recent', getAdminRecentTrips);
router.get('/payments/recent', getAdminRecentPayments);
router.get('/payments/pending', getAdminPendingPayments);
router.get('/payments/:paymentId', getAdminPaymentDetail);
router.post('/payments/:paymentId/reconcile', reconcileAdminPayment);
router.get('/revenue/overview', getAdminRevenueOverview);
router.get('/revenue/monthly', getAdminMonthlyRevenue);
router.get('/revenue/by-traveller', getAdminTravellerRevenue);
router.get('/travellers/:travellerId/revenue', getAdminTravellerRevenueProfile);
router.get('/reports/payments', getAdminReportsPayments);
router.get('/reports/revenue', getAdminReportsRevenue);

export default router;
