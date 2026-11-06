/// <reference types="node" />
import assert from 'node:assert';

const baseUrl = 'http://localhost:8085/api/v1';

async function runConfirmedProposalBookingTest() {
  console.log('\n======================================================================');
  console.log('🧪 WayRivo AI: Confirmed Proposal -> My Bookings Dashboard Verification');
  console.log(`Backend Target: ${baseUrl}`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  const timestamp = Date.now();
  const travelerEmail = `traveler.confirm.${timestamp}@wayrivo.com`;
  const travelerPassword = 'Password@123';
  let travelerToken = '';
  let travelerId = '';

  // 1. Register authenticated traveler
  await test('Step 1: Traveler Registration & Authentication', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Meera Traveler',
        email: travelerEmail,
        password: travelerPassword,
        role: 'USER',
      }),
    });
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const body: any = await res.json();
    travelerToken = body.token || body.data?.token;
    travelerId = body.user?.id || body.data?.user?.id;
    assert(travelerToken, 'Traveler JWT token must be returned');
    assert(travelerId, 'Traveler ID must be returned');
  });

  // 2. Traveler creates a trip request
  let tripRequestId = '';
  await test('Step 2: Traveler creates a trip request', async () => {
    const res = await fetch(`${baseUrl}/trip-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        destination: 'Kerala',
        fromLocation: 'Mumbai',
        travelersCount: 2,
        budget: 150000,
        travelStyle: 'Luxury Houseboat',
        numberOfDays: 6,
        travelerName: 'Meera Traveler',
        specialRequirements: 'Private Ayurvedic chef and backwater cruise',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body: any = await res.json();
    tripRequestId = body.data?.id;
    assert(tripRequestId, 'Trip request ID must be returned');
  });

  // 3. Expert submits proposal
  let proposalId = '';
  await test('Step 3: Expert submits bespoke proposal for the request', async () => {
    const res = await fetch(`${baseUrl}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripRequestId,
        title: 'Emerald Kerala Backwaters & Heritage Estate Voyage',
        totalPrice: 145000,
        pricePerPerson: 72500,
        expertName: 'Vikram Singh Rathore',
        organizationName: 'Royal Kerala Luxury Journeys',
        description: 'Private gold-standard houseboat with dedicated master chef and sunset lake safari.',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body: any = await res.json();
    proposalId = body.data?.id;
    assert(proposalId, 'Proposal ID must be returned');
  });

  // 4. Traveler selects/confirms the proposal
  let confirmedBookingId = '';
  let confirmedBookingRef = '';
  await test('Step 4: Traveler selects/confirms proposal (POST /proposals/:id/select)', async () => {
    const res = await fetch(`${baseUrl}/proposals/${proposalId}/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Selection must succeed');
    assert(body.data?.status === 'CONFIRMED', 'Status must be CONFIRMED');
    assert(body.data?.totalAmount === 145000, 'Total amount must match proposal');
    confirmedBookingId = body.data?.id;
    confirmedBookingRef = body.data?.bookingReference;
    assert(confirmedBookingId, 'A real booking ID must be returned');
    assert(confirmedBookingRef, 'A booking reference must be returned');
  });

  // 5. Booking Confirmation Page retrieval (GET /bookings/:id)
  await test('Step 5: Retrieve booking details (GET /bookings/:id)', async () => {
    const res = await fetch(`${baseUrl}/bookings/${confirmedBookingId}`, {
      headers: {
        Authorization: `Bearer ${travelerToken}`,
      },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Must succeed');
    assert(body.data?.id === confirmedBookingId, 'Returned booking ID must match');
    assert(body.data?.bookingReference === confirmedBookingRef, 'Booking reference must match');
    assert(body.data?.status === 'CONFIRMED', 'Status must be CONFIRMED');
    assert(body.data?.departureLocation, 'Departure location must be present');
    assert(body.data?.destinationLocation, 'Destination location must be present');
    assert(body.data?.itinerary?.startDate, 'Starting date must be present on itinerary');
    assert(Number(body.data?.totalAmount) === 145000, 'Trip amount must match 145000');
    assert(body.data?.items?.length > 0, 'Line items must be present');
    assert(body.data?.payment?.escrowStatus === 'HELD', 'Escrow status must be HELD');
  });

  // 6. User My Bookings Dashboard retrieval (GET /bookings/my)
  await test('Step 6: User My Bookings Dashboard showcases confirmed booking (GET /bookings/my)', async () => {
    const res = await fetch(`${baseUrl}/bookings/my`, {
      headers: {
        Authorization: `Bearer ${travelerToken}`,
      },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Must succeed');
    const bookings = Array.isArray(body.data) ? body.data : body.data?.bookings;
    assert(Array.isArray(bookings), 'Bookings must be an array');
    assert(bookings.length >= 1, `Expected at least 1 booking, got ${bookings.length}`);

    const foundBooking = bookings.find((b: any) => b.id === confirmedBookingId);
    assert(foundBooking, `Confirmed booking ${confirmedBookingId} MUST be present in My Bookings list!`);
    assert(foundBooking.bookingReference === confirmedBookingRef, 'Booking reference must match');
    assert(foundBooking.status === 'CONFIRMED', 'Booking status must be CONFIRMED');
    assert(Number(foundBooking.totalAmount) === 145000, 'Total amount must be 145000');
    assert(foundBooking.itinerary?.title?.includes('Kerala') || foundBooking.items?.length > 0, 'Itinerary or line items must be populated');
  });

  // 7. Traveler Dashboard Overview showcases confirmed booking (GET /users/dashboard)
  await test('Step 7: Traveler Dashboard showcases confirmed booking in overview and trips (GET /users/dashboard)', async () => {
    const res = await fetch(`${baseUrl}/users/dashboard`, {
      headers: {
        Authorization: `Bearer ${travelerToken}`,
      },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Must succeed');
    const data = body.data;
    assert(data.bookings?.some((b: any) => b.id === confirmedBookingId), 'Booking must appear in dashboard bookings list');
    assert(data.upcomingTrips?.some((b: any) => b.id === confirmedBookingId), 'Booking must appear in upcoming trips');
    assert(data.overview?.upcomingBookingsCount >= 1, 'Upcoming bookings counter must be at least 1');
    assert(data.overview?.totalTrips >= 1, 'Total trips counter must be at least 1');
  });

  console.log('\n======================================================================');
  console.log(`🎉 CONFIRMED PROPOSAL BOOKING TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runConfirmedProposalBookingTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

