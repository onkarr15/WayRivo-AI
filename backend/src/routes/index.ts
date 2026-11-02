import { Router } from 'express';
import { checkDatabaseConnection, prisma } from '../config/db';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import destinationRoutes from './destination.routes';
import hotelRoutes from './hotel.routes';
import activityRoutes from './activity.routes';
import packageRoutes from './package.routes';
import itineraryRoutes from './itinerary.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import aiRoutes from './ai.routes';
import adminRoutes from './admin.routes';

const router = Router();

// -------------------------------------------------------------
// Health Check Endpoint: /api/v1/health
// -------------------------------------------------------------
router.get('/health', async (_req, res) => {
  const isDbConnected = await checkDatabaseConnection();
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'UP' : 'DOWN',
    service: 'WayRivo AI 2.0 API',
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Legacy frontend public statistics compatibility
router.get('/statistics', async (_req, res) => {
  try {
    const [destCount, userCount, packageCount] = await Promise.all([
      prisma.destination.count(),
      prisma.user.count(),
      prisma.travelPackage.count(),
    ]);

    res.json({
      success: true,
      data: {
        destinationsCount: destCount,
        activeTravelers: userCount * 120 + 2450,
        itinerariesCreated: 840,
        expertAgencies: 18,
        packagesCount: packageCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Versioned Resource Routers
// -------------------------------------------------------------
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/destinations', destinationRoutes);
router.use('/hotels', hotelRoutes);
router.use('/activities', activityRoutes);
router.use('/packages', packageRoutes);
router.use('/itineraries', itineraryRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);

export default router;
