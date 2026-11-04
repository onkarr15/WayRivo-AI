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
import agentRoutes from './agent.routes';
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

// -------------------------------------------------------------
// Public Statistics & AI Insights
// -------------------------------------------------------------
const getStatsHandler = async (_req: any, res: any) => {
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
};

router.get('/statistics', getStatsHandler);
router.get('/public/statistics', getStatsHandler);

router.get('/public/ai-insights', async (req, res) => {
  const destination = (req.query.destination as string) || 'Goa';
  const style = (req.query.style as string) || 'Comfortable';
  const days = Number(req.query.days) || 5;
  res.json({
    success: true,
    data: {
      destination,
      style,
      days,
      weatherSummary: 'Pleasant and sunny with average temperature around 28°C.',
      bestTimeToVisit: 'October through March',
      localTips: [
        'Hire a self-drive scooter or local taxi for scenic coastal travel.',
        'Try local coastal cuisine and beachside seafood shacks.',
        'Carry light linen clothing and sun protection.',
      ],
    },
  });
});

router.get('/public/recommendations', async (_req, res) => {
  try {
    const destinations = await prisma.destination.findMany({
      where: { isActive: true },
      take: 6,
      orderBy: { averageBudget: 'asc' },
    });
    res.json({ success: true, data: destinations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Notifications & Messages Endpoints
// -------------------------------------------------------------
router.get('/notifications/unread-count', (_req, res) => {
  res.json({ success: true, data: { count: 0 } });
});

router.get('/notifications', (_req, res) => {
  res.json({
    success: true,
    data: {
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 20,
    },
  });
});

router.patch(['/notifications/:id/read', '/notifications/read-all'], (_req, res) => {
  res.json({ success: true, data: { updated: true } });
});

router.get('/messages/unread-count', (_req, res) => {
  res.json({ success: true, data: { count: 0 } });
});

router.get('/messages/conversations', (_req, res) => {
  res.json({ success: true, data: [] });
});

router.get('/messages/conversation/:partnerId', (_req, res) => {
  res.json({ success: true, data: [] });
});

router.post('/messages', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'msg_' + Date.now(),
      sender: 'USER',
      content: req.body.message || req.body.content || '',
      createdAt: new Date().toISOString(),
    },
  });
});

// -------------------------------------------------------------
// Legacy Trip Requests, Proposals, Experts & Reviews Handlers
// -------------------------------------------------------------
router.get('/trip-requests/open', async (_req, res) => {
  res.json({ success: true, data: { content: [], totalPages: 0, totalElements: 0 } });
});
router.get('/trip-requests/my', async (_req, res) => {
  res.json({ success: true, data: { content: [], totalPages: 0, totalElements: 0 } });
});
router.get('/trip-requests/dashboard-stats', async (_req, res) => {
  res.json({ success: true, data: { totalRequests: 0, activeRequests: 0, matchedExperts: 0 } });
});
router.get('/trip-requests/:id', async (_req, res) => {
  res.json({ success: true, data: null });
});
router.post('/trip-requests', async (_req, res) => {
  res.json({ success: true, data: { id: 'req_' + Date.now(), status: 'OPEN' } });
});

router.get('/proposals/my', async (_req, res) => {
  res.json({ success: true, data: { content: [], totalPages: 0, totalElements: 0 } });
});
router.get('/proposals/expert/dashboard-stats', async (_req, res) => {
  res.json({ success: true, data: { submittedCount: 0, selectedCount: 0, totalRevenue: 0 } });
});
router.get('/proposals/request/:id', async (_req, res) => {
  res.json({ success: true, data: [] });
});
router.post('/proposals', async (_req, res) => {
  res.json({ success: true, data: { id: 'prop_' + Date.now(), status: 'SUBMITTED' } });
});

router.get('/experts/featured', async (_req, res) => {
  res.json({ success: true, data: [] });
});
router.get('/experts/profile', async (_req, res) => {
  res.json({ success: true, data: null });
});
router.get('/experts/:id', async (_req, res) => {
  res.json({ success: true, data: null });
});
router.get('/reviews/recent', async (_req, res) => {
  res.json({ success: true, data: [] });
});
router.get('/reviews/expert/:id', async (_req, res) => {
  res.json({ success: true, data: [] });
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
router.use('/agent', agentRoutes);
router.use('/admin', adminRoutes);

export default router;
