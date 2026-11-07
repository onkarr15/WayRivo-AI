import { Router, Request, Response, NextFunction } from 'express';
import { checkDatabaseConnection, prisma } from '../config/db';
import { optionalAuthenticate, authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';
import { BookingStatus, BookingItemType, PaymentStatus, EscrowStatus, Prisma, UserRole, UserStatus } from '@prisma/client';
import { deleteAccount } from '../controllers/user.controller';
import { deleteAccountSchema, updateProfileSchema } from '../validators/auth.validator';
import { authService } from '../services/auth.service';
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
const getStatsHandler = async (_req: Request, res: Response) => {
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

router.get('/public/ai-insights', async (req: Request, res: Response) => {
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

router.get('/public/recommendations', async (_req: Request, res: Response) => {
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
router.get('/notifications/unread-count', (_req: Request, res: Response) => {
  res.json({ success: true, data: { count: 0 } });
});

router.get('/notifications', (_req: Request, res: Response) => {
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

router.patch(['/notifications/:id/read', '/notifications/read-all'], (_req: Request, res: Response) => {
  res.json({ success: true, data: { updated: true } });
});

router.get('/messages/unread-count', (_req: Request, res: Response) => {
  res.json({ success: true, data: { count: 0 } });
});

router.get('/messages/conversations', (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.get('/messages/conversation/:partnerId', (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.post('/messages', (req: Request, res: Response) => {
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
interface SampleTripRequest {
  id: string;
  destination: string;
  fromLocation: string;
  startDate: string;
  endDate: string;
  travelersCount: number;
  budget: number;
  travelStyle: string;
  travelType: string;
  durationDays: number;
  matchScore: number;
  travelerName: string;
  notes: string;
  interests?: string;
  specialRequirements?: string;
  status: string;
  createdAt: string;
}

interface SampleExpertProposal {
  id: string;
  tripRequestId: string;
  title: string;
  destination: string;
  travelerName: string;
  expertName?: string;
  organizationName?: string;
  totalPrice: number;
  pricePerPerson?: number;
  status: string;
  validityDate: string;
  description: string;
  itinerary?: string;
  accommodationDetails?: string;
  transportationDetails?: string;
  activities?: string;
  inclusions?: string;
  exclusions?: string;
  cancellationPolicy?: string;
  escrowStatus: string;
  submittedAt: string;
  createdAt?: string;
}

const sampleOpenTripRequests: SampleTripRequest[] = [
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
    status: 'OPEN',
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
    status: 'OPEN',
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
    status: 'OPEN',
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
    status: 'OPEN',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
];

const sampleExpertProposals: SampleExpertProposal[] = [
  {
    id: 'prop_201',
    title: 'Royal Udaipur & Jodhpur Heritage Palaces Retreat',
    tripRequestId: 'req_102',
    destination: 'Rajasthan',
    travelerName: 'Pooja Iyer',
    expertName: 'Vikram Singh Rathore',
    organizationName: 'Royal Rajasthan & Kerala Journeys',
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
    expertName: 'Vikram Singh Rathore',
    organizationName: 'Royal Rajasthan & Kerala Journeys',
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
    expertName: 'Vikram Singh Rathore',
    organizationName: 'Royal Rajasthan & Kerala Journeys',
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
    expertName: 'Vikram Singh Rathore',
    organizationName: 'Royal Rajasthan & Kerala Journeys',
    totalPrice: 82000,
    status: 'SUBMITTED',
    validityDate: '2026-12-01',
    description: 'Private dawn boat rides along ancient ghats, classical sitar performance evening, and scholar-guided Buddhist archaeological sites.',
    escrowStatus: 'PENDING_APPROVAL',
    submittedAt: '3 days ago',
  },
];

router.get('/trip-requests/open', async (req, res) => {
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  let filtered = sampleOpenTripRequests;
  if (search) {
    filtered = sampleOpenTripRequests.filter(r =>
      r.destination.toLowerCase().includes(search) ||
      (r.fromLocation && r.fromLocation.toLowerCase().includes(search)) ||
      (r.travelerName && r.travelerName.toLowerCase().includes(search))
    );
  }
  res.json({
    success: true,
    data: {
      content: filtered,
      totalPages: 1,
      totalElements: filtered.length,
    },
  });
});

router.get('/trip-requests/my', async (_req, res) => {
  res.json({
    success: true,
    data: {
      content: sampleOpenTripRequests,
      totalPages: 1,
      totalElements: sampleOpenTripRequests.length,
    },
  });
});

router.get('/trip-requests/dashboard-stats', async (_req, res) => {
  res.json({
    success: true,
    data: {
      totalRequests: sampleOpenTripRequests.length,
      activeRequests: sampleOpenTripRequests.filter(r => r.status !== 'CANCELLED' && r.status !== 'COMPLETED').length,
      matchedExperts: 18,
    },
  });
});

router.get('/trip-requests/:id', async (req, res) => {
  const targetId = String(req.params.id);
  const item = sampleOpenTripRequests.find(r => String(r.id) === targetId) || sampleOpenTripRequests[0];
  res.json({ success: true, data: item });
});

router.post('/trip-requests', async (req, res) => {
  const id = 'req_' + Date.now();
  const travelersList = Array.isArray(req.body.travelers) && req.body.travelers.length > 0
    ? req.body.travelers
    : [
        {
          name: req.body.travelerName || 'Arjun K. Sharma',
          gender: req.body.gender || 'Male',
          age: req.body.age || 28,
          phone: req.body.travelerPhone || '+91 98765 43210',
          email: req.body.travelerEmail || 'arjun@example.com',
        },
      ];

  const primary = travelersList[0] || {};

  const newTrip = {
    id,
    destination: req.body.destination || 'Kerala Backwaters & Munnar',
    fromLocation: req.body.fromLocation || 'Mumbai',
    startDate: req.body.startDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    endDate: req.body.endDate || new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    travelersCount: Number(req.body.travelersCount) || travelersList.length || 2,
    travelers: travelersList,
    primaryTraveler: primary,
    budget: Number(req.body.budget) || 120000,
    travelStyle: req.body.travelStyle || 'Luxury Heritage & Wellness',
    travelType: req.body.travelType || 'Couple',
    durationDays: Number(req.body.numberOfDays) || 6,
    matchScore: 98,
    travelerName: primary.name || req.body.travelerName || 'Arjun K. Sharma',
    travelerEmail: primary.email || req.body.travelerEmail || 'arjun@example.com',
    travelerPhone: primary.phone || req.body.travelerPhone || '+91 98765 43210',
    notes: req.body.specialRequirements || req.body.notes || 'Looking for verified specialist itineraries.',
    interests: req.body.interests || 'Heritage, Backwaters, Wellness',
    specialRequirements: req.body.specialRequirements || '',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  sampleOpenTripRequests.unshift(newTrip);
  res.json({ success: true, data: newTrip });
});

router.patch('/trip-requests/:id/cancel', async (req, res) => {
  const targetId = String(req.params.id);
  const found = sampleOpenTripRequests.find(r => String(r.id) === targetId);
  if (found) found.status = 'CANCELLED';
  res.json({ success: true, data: found || { id: targetId, status: 'CANCELLED' } });
});

router.get('/trip-requests/:id/matched-experts', async (req, res) => {
  const targetId = String(req.params.id);
  const reqObj = sampleOpenTripRequests.find(r => String(r.id) === targetId);
  const dest = reqObj?.destination || 'India';
  res.json({
    success: true,
    data: [
      {
        expertId: 'exp_01',
        name: 'Vikram Singh Rathore',
        organizationName: 'Royal Rajasthan & Kerala Journeys',
        matchScore: 98,
        rating: 4.9,
        totalReviews: 52,
        verificationStatus: 'VERIFIED',
        matchReasons: [`Specialist in ${dest} travel`, '14+ years experience', '98% 5-star traveler satisfaction'],
      },
      {
        expertId: 'exp_02',
        name: 'Ananya Deshmukh',
        organizationName: 'Bespoke India Explorations',
        matchScore: 95,
        rating: 4.8,
        totalReviews: 44,
        verificationStatus: 'VERIFIED',
        matchReasons: ['Verified luxury concierge', 'Direct contracts with premium resorts'],
      },
    ],
  });
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
      totalProposals: sampleExpertProposals.length,
      acceptedProposals: sampleExpertProposals.filter(p => p.status === 'SELECTED').length,
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

router.get('/proposals/request/:id', async (req, res) => {
  const reqId = String(req.params.id);
  const matching = sampleExpertProposals.filter(p => String(p.tripRequestId) === reqId);
  if (matching.length > 0) {
    return res.json({ success: true, data: matching });
  }
  // Default sample proposal mapped to sample request
  if (reqId === 'req_101') {
    return res.json({ success: true, data: sampleExpertProposals.filter(p => p.tripRequestId === 'req_101') });
  }
  if (reqId === 'req_102') {
    return res.json({ success: true, data: sampleExpertProposals.filter(p => p.tripRequestId === 'req_102') });
  }
  if (reqId === 'req_103') {
    return res.json({ success: true, data: sampleExpertProposals.filter(p => p.tripRequestId === 'req_103') });
  }
  res.json({ success: true, data: [] });
});

router.get('/proposals/:id', async (req, res) => {
  const propId = String(req.params.id);
  const found = sampleExpertProposals.find(p => String(p.id) === propId) || sampleExpertProposals[0];
  res.json({ success: true, data: found });
});

router.post('/proposals', async (req, res) => {
  const id = 'prop_' + Date.now();
  const tripRequestId = String(req.body.tripRequestId || '');
  const matchingTrip = sampleOpenTripRequests.find(r => String(r.id) === tripRequestId);

  const newProposal = {
    id,
    tripRequestId,
    title: req.body.title || 'Bespoke Curated Travel Proposal',
    destination: req.body.destination || matchingTrip?.destination || 'India',
    travelerName: req.body.travelerName || matchingTrip?.travelerName || 'Arjun K. Sharma',
    expertName: req.body.expertName || 'Vikram Singh Rathore',
    organizationName: req.body.organizationName || 'Royal Rajasthan & Kerala Journeys',
    totalPrice: Number(req.body.totalPrice) || 85000,
    pricePerPerson: Number(req.body.pricePerPerson) || Math.round((Number(req.body.totalPrice) || 85000) / 2),
    status: 'SUBMITTED',
    validityDate: req.body.validityDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    description: req.body.description || 'Customized luxury travel plan crafted by destination specialist.',
    itinerary: req.body.itinerary || 'Day 1: Private Airport Arrival & Coastal Welcome\nDay 2: Guided Excursion & Heritage Exploration\nDay 3: Sunset Cruise & Cultural Gastronomy',
    accommodationDetails: req.body.accommodationDetails || 'Handpicked 5-star boutique resort with private veranda',
    transportationDetails: req.body.transportationDetails || 'Chauffeured private AC sedan throughout the entire journey',
    activities: req.body.activities || 'Guided cultural heritage walks, sunset cruise, and curated dining',
    inclusions: req.body.inclusions || 'Breakfast daily, airport transfers, all entry permits, dedicated destination expert on call',
    exclusions: req.body.exclusions || 'Personal expenses, international flights, optional spa treatments',
    cancellationPolicy: req.body.cancellationPolicy || '100% refundable up to 7 days before departure under WayRivo Escrow Guarantee',
    escrowStatus: 'PENDING_APPROVAL',
    submittedAt: 'Just now',
    createdAt: new Date().toISOString(),
  };

  sampleExpertProposals.unshift(newProposal);

  if (matchingTrip) {
    matchingTrip.status = 'PROPOSALS_RECEIVED';
  }

  res.json({
    success: true,
    data: newProposal,
  });
});

router.post('/proposals/:id/select', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const propId = String(req.params.id);
    const found = sampleExpertProposals.find(p => String(p.id) === propId);
    const matchingTrip = found ? sampleOpenTripRequests.find(r => String(r.id) === String(found.tripRequestId)) : undefined;

    if (found) {
      found.status = 'SELECTED';
      found.escrowStatus = 'HELD';

      // Mark other proposals for same trip as REJECTED
      sampleExpertProposals.forEach(p => {
        if (p.tripRequestId === found.tripRequestId && String(p.id) !== propId) {
          p.status = 'REJECTED';
        }
      });

      if (matchingTrip) {
        matchingTrip.status = 'PROPOSAL_SELECTED';
      }
    }

    // Determine traveler identity
    let user = req.user;
    let userId = user?.id;

    if (!userId) {
      const defaultUser = (await prisma.user.findFirst({
        where: { role: UserRole.TRAVELER },
      })) || (await prisma.user.findFirst());

      if (defaultUser) {
        userId = defaultUser.id;
        user = {
          id: defaultUser.id,
          name: defaultUser.name,
          email: defaultUser.email,
          role: defaultUser.role,
          status: defaultUser.status,
        };
      }
    }

    // Idempotency: Return existing confirmed booking if already generated for this proposal and user
    if (userId) {
      const existingBooking = await prisma.booking.findFirst({
        where: {
          userId,
          specialRequests: { contains: `[PROP_ID:${propId}]` },
        },
        include: {
          items: true,
          payment: true,
          itinerary: {
            include: { destination: true, days: true },
          },
        },
      });

      if (existingBooking) {
        return res.json({
          success: true,
          data: {
            id: existingBooking.id,
            bookingReference: existingBooking.bookingReference,
            proposalId: propId,
            status: existingBooking.status,
            totalAmount: Number(existingBooking.totalAmount),
            currency: existingBooking.currency,
            booking: existingBooking,
          },
        });
      }
    }

    // Resolve matching destination
    const targetDestName = (matchingTrip?.destination || found?.destination || 'Kerala').toLowerCase();
    let destination = await prisma.destination.findFirst({
      where: {
        OR: [
          { name: { contains: targetDestName, mode: 'insensitive' } },
          { state: { contains: targetDestName, mode: 'insensitive' } },
        ],
      },
    });

    if (!destination) {
      destination = await prisma.destination.findFirst();
    }

    const totalAmount = new Prisma.Decimal(found?.totalPrice || 142000);
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const bookingReference = `WR-2026-${randomCode}`;

    let createdBooking: any = null;

    if (userId && destination) {
      const departureCity = matchingTrip?.fromLocation || 'Mumbai';
      const destFullTitle = matchingTrip?.destination || found?.destination || `${destination.name} Backwaters & Heritage`;
      const destLocation = `${destination.name}, ${destination.state ? `${destination.state}, ` : ''}${destination.country || 'India'}`;
      const expertName = found?.expertName || 'Vikram Singh Rathore';
      const agencyName = found?.organizationName || 'Royal Rajasthan & Kerala Journeys';

      const itineraryTitle = found?.title || `${destFullTitle} Curated Bespoke Journey`;
      const durationDays = matchingTrip?.durationDays || 6;
      const travelersCount = matchingTrip?.travelersCount || 2;

      // 1. Create Itinerary
      const itinerary = await prisma.itinerary.create({
        data: {
          userId,
          destinationId: destination.id,
          title: itineraryTitle,
          travelStyle: matchingTrip?.travelStyle || 'Bespoke Escrow',
          startDate: matchingTrip?.startDate ? new Date(matchingTrip.startDate) : new Date(Date.now() + 14 * 86400000),
          endDate: matchingTrip?.endDate ? new Date(matchingTrip.endDate) : new Date(Date.now() + 20 * 86400000),
          numberOfDays: durationDays,
          travelersCount,
          budget: totalAmount,
          currency: 'INR',
          status: 'CONFIRMED',
          totalEstimatedCost: totalAmount,
          days: {
            create: [
              {
                dayNumber: 1,
                title: `Day 1: Departure from ${departureCity} & Arrival in ${destination.name}`,
                description: `Depart from ${departureCity}. Private VIP greeting at arrival, luxury chauffeured transfer to boutique resort, orientation, and welcome dinner.`,
                estimatedDayCost: totalAmount.mul(0.2),
              },
              {
                dayNumber: 2,
                title: `Day 2: Guided Specialist Excursions in ${destination.name}`,
                description: found?.description || 'Exclusive curated experience crafted by verified destination specialist.',
                estimatedDayCost: totalAmount.mul(0.4),
              },
              {
                dayNumber: 3,
                title: `Day 3: Cultural Immersion & Return Journey to ${departureCity}`,
                description: `Artisanal local visits, culinary heritage lunch, and assisted transfer for return journey to ${departureCity}.`,
                estimatedDayCost: totalAmount.mul(0.4),
              },
            ],
          },
        },
      });

      // 2. Create Confirmed Booking with line items and Escrow Payment
      createdBooking = await prisma.booking.create({
        data: {
          bookingReference,
          userId,
          itineraryId: itinerary.id,
          status: BookingStatus.CONFIRMED,
          totalAmount,
          currency: 'INR',
          specialRequests: `[PROP_ID:${propId}][FROM:${departureCity}][DEST:${destFullTitle}][LOC:${destLocation}][EXPERT:${expertName} • ${agencyName}] ${matchingTrip?.notes || 'Bespoke luxury itinerary with dedicated chauffeur and verified escrow protection.'}`,
          escrowReleaseDate: new Date(Date.now() + 30 * 86400000),
          confirmedAt: new Date(),
          items: {
            create: [
              {
                itemType: BookingItemType.CUSTOM,
                title: found?.title || `${destination.name} Bespoke Travel Package`,
                unitPrice: totalAmount,
                quantity: 1,
                totalPrice: totalAmount,
                notes: `Expert: ${expertName} (${agencyName}). Route: ${departureCity} ➔ ${destLocation}. Escrow Protected.`,
              },
            ],
          },
          payment: {
            create: {
              paypalOrderId: `PAYPAL-ESCROW-${Date.now()}`,
              paypalCaptureId: `CAP-${randomCode}`,
              status: PaymentStatus.CAPTURED,
              amount: totalAmount,
              currency: 'INR',
              escrowStatus: EscrowStatus.HELD,
              payerEmail: user?.email || 'traveler@wayrivo.com',
              payerName: user?.name || 'WayRivo Traveler',
            },
          },
        },
        include: {
          items: true,
          payment: true,
          itinerary: {
            include: { destination: true, days: true },
          },
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: createdBooking ? createdBooking.id : 'book_' + Date.now(),
        bookingReference: createdBooking ? createdBooking.bookingReference : bookingReference,
        proposalId: propId,
        status: 'CONFIRMED',
        totalAmount: Number(totalAmount),
        currency: 'INR',
        booking: createdBooking,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to select proposal and confirm booking',
    });
  }
});

router.get('/experts/featured', async (_req: Request, res: Response) => {
  try {
    const dbExperts = await prisma.user.findMany({
      where: {
        role: UserRole.EXPERT,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        agencyName: true,
        avatarUrl: true,
        verificationStatus: true,
      },
      take: 6,
    });

    if (dbExperts.length > 0) {
      return res.json({
        success: true,
        data: dbExperts.map((exp) => ({
          id: exp.id,
          name: exp.name,
          agencyName: exp.agencyName || exp.name,
          avatarUrl: exp.avatarUrl,
          rating: 4.9,
          reviewsCount: 52,
          verified: exp.verificationStatus === 'VERIFIED',
        })),
      });
    }
  } catch {
    // fallback to demo data if query fails
  }

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

router.get('/experts/profile', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  if (req.user) {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user && user.status === UserStatus.ACTIVE) {
      return res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          organizationName: user.agencyName || user.name,
          agencyName: user.agencyName || user.name,
          description: user.bio || '',
          yearsOfExperience: user.yearsOfExperience || 0,
          city: user.city || '',
          state: user.state || '',
          country: user.country || 'India',
          address: user.address || '',
          postalCode: user.postalCode || '',
          specializations: user.specializations || '',
          languages: user.languages || [],
          websiteUrl: user.websiteUrl || '',
          phone: user.phone || '',
          email: user.email,
          verificationStatus: user.verificationStatus || 'VERIFIED',
          rating: 4.9,
          totalReviews: 24,
          destinations: user.preferredDestinations.length > 0 ? user.preferredDestinations : ['Rajasthan', 'Kerala', 'Ladakh', 'Goa', 'Varanasi'],
        },
      });
    }
  }

  res.json({
    success: true,
    data: {
      id: 'exp_01',
      name: 'Vikram Singh Rathore',
      agencyName: 'Royal Rajasthan & Kerala Journeys',
      organizationName: 'Royal Rajasthan & Kerala Journeys',
      description: 'Over 8 years crafting authentic Himalayan treks, cultural immersion tours in Himachal and Ladakh, and luxury resort stays.',
      yearsOfExperience: 8,
      licenseNumber: 'IN-TOUR-EXP-2024-8902',
      verificationStatus: 'VERIFIED',
      rating: 4.9,
      reviewsCount: 52,
      totalReviews: 24,
      completedTrips: 184,
      city: 'Manali',
      state: 'Himachal Pradesh',
      country: 'India',
      specializations: 'Himachal, Ladakh, Trekking, Honeymoon, Luxury Resorts',
      languages: ['English', 'Hindi', 'Punjabi'],
      destinations: ['Rajasthan', 'Kerala', 'Ladakh', 'Goa', 'Varanasi'],
    },
  });
});

const handleUpdateExpertProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await authService.updateProfile(req.user!.id, req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Expert agency profile updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

router.put('/experts/profile', authenticate, validate(updateProfileSchema), handleUpdateExpertProfile);
router.patch('/experts/profile', authenticate, validate(updateProfileSchema), handleUpdateExpertProfile);

router.delete('/account', authenticate, validate(deleteAccountSchema), deleteAccount);
router.post('/account/delete', authenticate, validate(deleteAccountSchema), deleteAccount);

router.get('/experts/:id', async (req: Request, res: Response) => {
  const targetId = String(req.params.id);
  try {
    const user = await prisma.user.findUnique({
      where: { id: targetId },
    });
    if (user && user.status === UserStatus.ACTIVE) {
      return res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          agencyName: user.agencyName || user.name,
          organizationName: user.agencyName || user.name,
          description: user.bio || '',
          yearsOfExperience: user.yearsOfExperience || 8,
          rating: 4.9,
          reviewsCount: 52,
          verificationStatus: user.verificationStatus || 'VERIFIED',
          city: user.city || 'Manali',
          state: user.state || 'Himachal Pradesh',
          country: user.country || 'India',
          specializations: user.specializations || 'Himachal, Ladakh, Trekking, Honeymoon, Luxury Resorts',
          languages: user.languages || ['English', 'Hindi'],
          destinations: user.preferredDestinations.length > 0 ? user.preferredDestinations : ['Rajasthan', 'Kerala', 'Ladakh', 'Goa', 'Varanasi'],
        },
      });
    }
  } catch {
    // fallback
  }

  res.json({
    success: true,
    data: {
      id: targetId,
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
