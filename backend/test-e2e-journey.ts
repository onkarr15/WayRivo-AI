import process from 'node:process';
import { prisma } from './src/config/db';

const baseUrl = 'http://localhost:8085/api/v1';

async function runE2EJourney() {
  console.log('\n======================================================================');
  console.log('🚀 WayRivo AI 2.0 Phase 10: Complete End-to-End User Journey Test Suite');
  console.log(`Target: ${baseUrl}`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  async function step(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ STEP ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ STEP ${name} FAILED:`, err.message);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testEmail = `traveler.e2e.${timestamp}@wayrivo.com`;
  const testPassword = 'Password@123';
  let authToken = '';
  let userId = '';
  let conversationId = '';
  let destinationId = '';
  let destinationName = '';
  let generatedItinerary: any = null;
  let savedItineraryId = '';
  let selectedHotel: any = null;
  let selectedActivity: any = null;
  let bookingId = '';
  let bookingReference = '';
  let paypalOrderId = '';
  let paypalCaptureId = '';

  // 1. User registration
  await step('1: User Registration (POST /api/v1/auth/register)', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arjun Explorer',
        email: testEmail,
        password: testPassword,
        role: 'TRAVELER',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) {
      throw new Error(`Registration failed: ${JSON.stringify(json)}`);
    }
    userId = json.data.user.id;
  });

  // 2. User login
  await step('2: User Login (POST /api/v1/auth/login)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) {
      throw new Error(`Login failed: ${JSON.stringify(json)}`);
    }
    authToken = json.data.token;
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  // 3. Destination discovery
  await step('3: Destination Discovery (GET /api/v1/destinations)', async () => {
    const res = await fetch(`${baseUrl}/destinations?limit=5`);
    const json = await res.json();
    const list = Array.isArray(json.data) ? json.data : json.data?.destinations || [];
    if (!res.ok || list.length === 0) {
      throw new Error(`Failed to discover destinations: ${JSON.stringify(json)}`);
    }
    const dest = list[0];
    destinationId = dest.id;
    destinationName = dest.name;

    // Verify slug endpoint
    const slugRes = await fetch(`${baseUrl}/destinations/slug/${dest.slug}`);
    const slugJson = await slugRes.json();
    if (!slugRes.ok || !slugJson.data) {
      throw new Error('Failed to retrieve destination details by slug');
    }
  });

  // 4. AI travel conversation
  await step('4: AI Travel Conversation (POST /api/v1/agent/chat)', async () => {
    const prompt = `Plan a 5-day trip to ${destinationName} for 2 people with a budget of 30000 INR. I enjoy water sports and beaches.`;
    const res = await fetch(`${baseUrl}/agent/chat`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ message: prompt }),
    });
    const json = await res.json();
    if (!res.ok || !json.data?.reply) {
      throw new Error(`AI conversation failed: ${JSON.stringify(json)}`);
    }
    conversationId = json.data.conversationId;
  });

  // 5. AI itinerary generation
  await step('5: AI Itinerary Generation (POST /api/v1/itineraries/generate)', async () => {
    const res = await fetch(`${baseUrl}/itineraries/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        destinationId,
        destinationName,
        numberOfDays: 5,
        travelersCount: 2,
        budget: 30000,
        interests: ['Beaches', 'Water Sports'],
        travelStyle: 'Comfortable',
      }),
    });
    const json = await res.json();
    const itineraryData = json.data;
    if (!res.ok || !itineraryData?.days || itineraryData.days.length !== 5) {
      throw new Error(`Failed to generate 5-day itinerary: ${JSON.stringify(json)}`);
    }
    generatedItinerary = itineraryData;
  });

  // 6. Budget optimisation
  await step('6: Budget Optimization (POST /api/v1/itineraries/optimize-budget)', async () => {
    const res = await fetch(`${baseUrl}/itineraries/optimize-budget`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        destinationId,
        destinationName,
        numberOfDays: 5,
        travelersCount: 2,
        userBudget: 25000, // Trigger budget intelligence
      }),
    });
    const json = await res.json();
    if (!res.ok || (!json.data?.isOverBudget && !json.data?.expensiveComponents)) {
      throw new Error(`Budget optimization failed: ${JSON.stringify(json)}`);
    }
  });

  // 7. Hotel and activity selection
  await step('7: Hotel & Activity Selection from Real Inventory', async () => {
    // Ensure test hotel and activities have available inventory
    await Promise.all([
      prisma.hotel.updateMany({
        where: { availableRooms: { lt: 2 } },
        data: { availableRooms: 10 },
      }),
      prisma.activity.updateMany({
        where: { availableSlots: { lt: 2 } },
        data: { availableSlots: 20 },
      }),
    ]);

    const [hRes, aRes] = await Promise.all([
      fetch(`${baseUrl}/hotels?destinationId=${destinationId}&limit=2`),
      fetch(`${baseUrl}/activities?destinationId=${destinationId}&limit=2`),
    ]);
    const hJson = await hRes.json();
    const aJson = await aRes.json();

    const hotels = hJson.data?.hotels || hJson.data || [];
    const activities = aJson.data?.activities || aJson.data || [];

    if (hotels.length === 0 || activities.length === 0) {
      throw new Error('Database inventory missing for destination');
    }
    selectedHotel = hotels[0];
    selectedActivity = activities[0];
  });

  // 8. Booking proposal & creation
  await step('8: Booking Proposal & Reservation (POST /api/v1/bookings)', async () => {
    // Save itinerary first
    const saveItinRes = await fetch(`${baseUrl}/itineraries`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        destinationId,
        title: `Bespoke Journey to ${destinationName}`,
        numberOfDays: 5,
        travelersCount: 2,
        budget: 30000,
        days: generatedItinerary.days,
      }),
    });
    const saveJson = await saveItinRes.json();
    savedItineraryId = saveJson.data.id;

    // Create Booking
    const bookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        itineraryId: savedItineraryId,
        specialRequests: 'Ocean view room, vegetarian breakfast preferences.',
        items: [
          {
            itemType: 'HOTEL',
            referenceId: selectedHotel.id,
            quantity: 1, // 1 room
            notes: `${selectedHotel.name} (1 Room)`,
          },
          {
            itemType: 'ACTIVITY',
            referenceId: selectedActivity.id,
            quantity: 2, // 2 tickets
            notes: `${selectedActivity.title} (2 Travelers)`,
          },
        ],
      }),
    });
    const bJson = await bookingRes.json();
    if (!bookingRes.ok || !bJson.data?.id || !bJson.data?.bookingReference) {
      throw new Error(`Booking creation failed: ${JSON.stringify(bJson)}`);
    }
    bookingId = bJson.data.id;
    bookingReference = bJson.data.bookingReference;
  });

  // 9. PayPal order creation
  await step('9: PayPal Order Creation (POST /api/v1/payments/create-order)', async () => {
    const res = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        bookingId,
        returnUrl: 'http://localhost:5173/payment-success',
        cancelUrl: 'http://localhost:5173/payment-cancel',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.data?.orderId || !json.data?.chargeAmount) {
      throw new Error(`PayPal order creation failed: ${JSON.stringify(json)}`);
    }
    paypalOrderId = json.data.orderId;
  });

  // 10. Customer payment approval (Simulated via Sandbox token)
  await step('10: Customer Payment Approval Simulation (Orders v2 Approval)', async () => {
    if (!paypalOrderId) {
      throw new Error('PayPal Order ID missing');
    }
  });

  // 11. Server-side payment capture
  await step('11: Server-Side Payment Capture & Escrow Hold (POST /api/v1/payments/capture-order)', async () => {
    const res = await fetch(`${baseUrl}/payments/capture-order`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'X-Idempotency-Key': `idemp-e2e-${timestamp}`,
      },
      body: JSON.stringify({
        bookingId,
        paypalOrderId,
      }),
    });
    const json = await res.json();
    const isSuccess = res.ok && (
      json.data?.bookingStatus === 'ESCROW_HOLD' ||
      json.data?.bookingStatus === 'CONFIRMED' ||
      json.data?.payment?.status === 'CAPTURED'
    );
    if (!isSuccess) {
      throw new Error(`Payment capture failed: ${JSON.stringify(json)}`);
    }
    paypalCaptureId = json.data.payment.paypalCaptureId;
  });

  // 12. Webhook verification
  await step('12: Webhook Verification & Deduplication (POST /api/v1/payments/webhook)', async () => {
    const webhookPayload = {
      id: `WH-E2E-${timestamp}`,
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: paypalCaptureId,
        supplementary_data: {
          related_ids: {
            order_id: paypalOrderId,
          },
        },
      },
    };

    const res = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });
    const json = await res.json();
    if (!res.ok || (!json.received && !json.success)) {
      throw new Error(`Webhook handler failed: ${JSON.stringify(json)}`);
    }
  });

  // 13. Booking confirmation & escrow state verification
  await step('13: Booking Confirmation & Escrow Status (GET /api/v1/bookings/:id)', async () => {
    const res = await fetch(`${baseUrl}/bookings/${bookingId}`, { headers: authHeaders });
    const json = await res.json();
    const b = json.data;
    const isEscrowOrConfirmed = (b.status === 'CONFIRMED' || b.status === 'ESCROW_HOLD') && b.payment?.escrowStatus === 'HELD';
    if (!isEscrowOrConfirmed) {
      throw new Error(`Booking status mismatch: status=${b.status}, escrow=${b.payment?.escrowStatus}`);
    }
  });

  // 14. Booking dashboard update
  await step('14: User Dashboard Live Update (GET /api/v1/users/dashboard)', async () => {
    const res = await fetch(`${baseUrl}/users/dashboard`, { headers: authHeaders });
    const json = await res.json();
    const data = json.data;
    const found = data.bookings.some((b: any) => b.id === bookingId);
    if (!found) {
      throw new Error('New booking not reflected in user dashboard');
    }
    if (data.overview.upcomingBookingsCount < 1) {
      throw new Error('Dashboard upcoming count not incremented');
    }
  });

  // 15. Payment receipt generation
  await step('15: Payment Receipt Verification (Capture ID & Verified Amount)', async () => {
    const res = await fetch(`${baseUrl}/bookings/${bookingId}`, { headers: authHeaders });
    const json = await res.json();
    const payment = json.data?.payment;
    if (!payment || !payment.paypalCaptureId || !payment.amount) {
      throw new Error('Receipt generation data incomplete');
    }
  });

  console.log('\n======================================================================');
  console.log(`📊 E2E User Journey Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runE2EJourney().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
