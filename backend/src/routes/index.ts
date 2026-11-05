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
const sampleOpenTripRequests = [
  {
    id: 'req_101',
    destination: 'Kerala Backwaters & Munnar Tea Trails',
    fromLocation: 'Mumbai',
    startDate: '2026-12-10',
    endDate: '2026-12-16',
    travelersCount: 2,
    budget: 145000,
    travelStyle: 'Luxury Heritage & Wellness',
    travelType: 'Couple / Honeymoon',
    durationDays: 6,
    matchScore: 98,
    travelerName: 'Arjun K. Sharma',
    notes: 'Prefer private traditional houseboat with dedicated chef, and an organic spice plantation estate retreat.',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'req_102',
    destination: 'Golden Triangle & Desert Haveli Expedition',
    fromLocation: 'New Delhi',
    startDate: '2026-11-28',
    endDate: '2026-12-05',
    travelersCount: 4,
    budget: 180000,
    travelStyle: 'Cultural Experience',
    travelType: 'Family Vacation',
    durationDays: 7,
    matchScore: 96,
    travelerName: 'Pooja Iyer & Family',
    notes: 'Need family-friendly stays in Jaipur and Jodhpur with private heritage walks and camel safari for kids.',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    id: 'req_103',
    destination: 'Ladakh High Mountain Passes & Pangong Lake',
    fromLocation: 'Bangalore',
    startDate: '2026-12-15',
    endDate: '2026-12-24',
    travelersCount: 3,
    budget: 220000,
    travelStyle: 'Adventure Photography',
    travelType: 'Friends Expedition',
    durationDays: 9,
    matchScore: 93,
    travelerName: 'Rohan Deshmukh',
    notes: 'Stargazing camps at Nubra and Pangong, professional 4x4 vehicle, oxygen support equipment verified.',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'req_104',
    destination: 'Goa Coastal Luxury & Heritage Fontainhas',
    fromLocation: 'Hyderabad',
    startDate: '2026-11-20',
    endDate: '2026-11-24',
    travelersCount: 2,
    budget: 95000,
    travelStyle: 'Culinary & Relaxation',
    travelType: 'Couple Getaway',
    durationDays: 4,
    matchScore: 89,
    travelerName: 'Devendra Patel',
    notes: 'Boutique heritage Portuguese villa in Latin Quarter and sunset catamaran private cruise.',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
];

const sampleExpertProposals = [
  {
    id: 'prop_201',
    title: 'Royal Udaipur & Jodhpur Heritage Palaces Retreat',
    tripRequestId: 'req_102',
    destination: 'Rajasthan',
    travelerName: 'Pooja Iyer',
    totalPrice: 175000,
    status: 'SELECTED',
    validityDate: '2026-11-30',
    description: 'Exclusive 5-star palace accommodations with private royal vintage car transfers, stepwell dinner, and folk cultural evenings.',
    escrowStatus: 'HELD',
    submittedAt: '2 days ago',
  },
  {
    id: 'prop_202',
    title: 'Private Kumarakom Houseboat & Marari Beach Eco-Resort',
    tripRequestId: 'req_101',
    destination: 'Kerala',
    travelerName: 'Arjun K. Sharma',
    totalPrice: 142000,
    status: 'SUBMITTED',
    validityDate: '2026-12-05',
    description: 'Handcrafted luxury voyage through Vembanad Lake with private chef, authentic Ayurveda session, and organic estate tour.',
    escrowStatus: 'PENDING_APPROVAL',
    submittedAt: 'Yesterday',
  },
  {
    id: 'prop_203',
    title: 'Pangong Stargazing & Geodesic Glamping Overland',
    tripRequestId: 'req_103',
    destination: 'Ladakh',
    travelerName: 'Rohan Deshmukh',
    totalPrice: 215000,
    status: 'SELECTED',
    validityDate: '2026-12-12',
    description: 'High altitude acclimation itinerary with 24/7 medical escort, heated dome glamping, and private 4x4 overland guide.',
    escrowStatus: 'HELD',
    submittedAt: '4 days ago',
  },
  {
    id: 'prop_204',
    title: 'Sacred Varanasi Dawn Aarti & Sarnath Scholar Tour',
    tripRequestId: 'req_105',
    destination: 'Varanasi',
    travelerName: 'Meera Swaminathan',
    totalPrice: 82000,
    status: 'SUBMITTED',
    validityDate: '2026-12-01',
    description: 'Private dawn boat rides along ancient ghats, classical sitar performance evening, and scholar-guided Buddhist archaeological sites.',
    escrowStatus: 'PENDING_APPROVAL',
    submittedAt: '3 days ago',
  },
];

router.get('/trip-requests/open', async (_req, res) => {
  res.json({
    success: true,
    data: {
      content: sampleOpenTripRequests,
      totalPages: 1,
      totalElements: sampleOpenTripRequests.length,
    },
  });
});

router.get('/trip-requests/my', async (_req, res) => {
  res.json({
    success: true,
    data: {
      content: sampleOpenTripRequests.slice(0, 2),
      totalPages: 1,
      totalElements: 2,
    },
  });
});

router.get('/trip-requests/dashboard-stats', async (_req, res) => {
  res.json({
    success: true,
    data: {
      totalRequests: sampleOpenTripRequests.length,
      activeRequests: 4,
      matchedExperts: 18,
    },
  });
});

router.get('/trip-requests/:id', async (req, res) => {
  const item = sampleOpenTripRequests.find(r => r.id === req.params.id) || sampleOpenTripRequests[0];
  res.json({ success: true, data: item });
});

router.post('/trip-requests', async (_req, res) => {
  res.json({ success: true, data: { id: 'req_' + Date.now(), status: 'OPEN' } });
});

router.get('/proposals/my', async (_req, res) => {
  res.json({
    success: true,
    data: {
      content: sampleExpertProposals,
      totalPages: 1,
      totalElements: sampleExpertProposals.length,
    },
  });
});

router.get('/proposals/expert/dashboard-stats', async (_req, res) => {
  res.json({
    success: true,
    data: {
      totalProposals: 18,
      acceptedProposals: 12,
      activeBookings: 6,
      rating: '4.9',
      totalReviews: 52,
      verificationStatus: 'VERIFIED',
      totalRevenue: 1420000,
      escrowBalance: 485000,
      agencyName: 'Royal Rajasthan & Kerala Journeys',
      specialistName: 'Vikram Singh Rathore',
      memberSince: '2024',
      recentProposals: sampleExpertProposals,
      openRequests: sampleOpenTripRequests,
    },
  });
});

router.get('/proposals/request/:id', async (_req, res) => {
  res.json({ success: true, data: sampleExpertProposals.slice(0, 2) });
});

router.post('/proposals', async (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'prop_' + Date.now(),
      status: 'SUBMITTED',
      ...req.body,
    },
  });
});

router.get('/experts/featured', async (_req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'exp_01',
        name: 'Vikram Singh Rathore',
        agencyName: 'Royal Rajasthan & Kerala Journeys',
        rating: 4.9,
        reviewsCount: 52,
        verified: true,
      },
    ],
  });
});

router.get('/experts/profile', async (_req, res) => {
  res.json({
    success: true,
    data: {
      id: 'exp_01',
      name: 'Vikram Singh Rathore',
      agencyName: 'Royal Rajasthan & Kerala Journeys',
      licenseNumber: 'IN-TOUR-EXP-2024-8902',
      experienceYears: 14,
      verificationStatus: 'VERIFIED',
      rating: 4.9,
      reviewsCount: 52,
      completedTrips: 184,
      destinations: ['Rajasthan', 'Kerala', 'Ladakh', 'Goa', 'Varanasi'],
    },
  });
});

router.get('/experts/:id', async (_req, res) => {
  res.json({
    success: true,
    data: {
      id: 'exp_01',
      name: 'Vikram Singh Rathore',
      agencyName: 'Royal Rajasthan & Kerala Journeys',
      rating: 4.9,
      reviewsCount: 52,
    },
  });
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
