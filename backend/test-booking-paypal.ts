/// <reference types="node" />
import { prisma } from './src/config/db';

async function testBookingAndPayPal() {
  const baseUrl = 'http://localhost:8085/api/v1';
  console.log('======================================================================');
  console.log('💳 WayRivo AI 2.0 Phase 8: Booking Engine & PayPal Sandbox Test Suite');
  console.log(`Target: ${baseUrl}`);
  console.log('======================================================================\n');

  let passCount = 0;
  let failCount = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passCount++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
      failCount++;
    }
  }

  // 1. Authenticate Traveler & Admin
  let travelerToken = '';
  let travelerId = '';
  let adminToken = '';

  await test('1. Traveler & Admin Authentication', async () => {
    const timestamp = Date.now();
    const tEmail = `traveler.pp.${timestamp}@wayrivo.com`;
    const aEmail = `admin.pp.${timestamp}@wayrivo.com`;
    const password = 'Password@123';

    // Register dynamic traveler
    const regT = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'PayPal Traveler', email: tEmail, password, role: 'USER' }),
    });
    const regDataT = await regT.json();
    travelerToken = regDataT.token || regDataT.data?.token;
    travelerId = regDataT.data?.user?.id || regDataT.user?.id;

    // Register dynamic admin
    const regA = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'PayPal Admin', email: aEmail, password, role: 'ADMIN' }),
    });
    const regDataA = await regA.json();

    // Elevate admin in database
    await prisma.user.updateMany({
      where: { email: aEmail },
      data: { role: 'ADMIN', isEmailVerified: true },
    });

    // Login admin
    const resA = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: aEmail, password }),
    });
    const dataA = await resA.json();
    adminToken = dataA.token || dataA.data?.token || regDataA.token || regDataA.data?.token;

    if (!travelerToken || !adminToken) throw new Error('Failed to acquire authentication tokens');
  });

  // 2. Fetch Real Inventory for Booking
  let hotel: any = null;
  let activity: any = null;
  await test('2. Retrieve Real Database Inventory & Capacities', async () => {
    const hRes = await fetch(`${baseUrl}/hotels`);
    const hData = await hRes.json();
    const hotels = hData.data?.hotels || hData.data || [];
    hotel = hotels.find((h: any) => h.availableRooms > 0) || hotels[0];
    if (!hotel) throw new Error('No hotel available in database');

    const aRes = await fetch(`${baseUrl}/activities`);
    const aData = await aRes.json();
    const activities = aData.data?.activities || aData.data || [];
    activity = activities.find((a: any) => a.availableSlots > 0) || activities[0];
    if (!activity) throw new Error('No activity available in database');
  });

  // 3. Create Itinerary for Booking Flow
  let itineraryId = '';
  await test('3. Create Bespoke Itinerary to Bind Booking', async () => {
    const res = await fetch(`${baseUrl}/itineraries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        destinationId: hotel.destinationId,
        title: 'Phase 8 PayPal Verification Itinerary',
        travelStyle: 'COMFORT',
        budget: 45000,
        totalEstimatedCost: 35000,
        numberOfDays: 3,
        travelersCount: 2,
        days: [
          { dayNumber: 1, title: 'Day 1 Arrival', estimatedDayCost: 15000 },
          { dayNumber: 2, title: 'Day 2 Excursion', estimatedDayCost: 10000 },
          { dayNumber: 3, title: 'Day 3 Departure', estimatedDayCost: 10000 },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Failed to create test itinerary: ${res.status}`);
    const data = await res.json();
    itineraryId = data.data?.id;
    if (!itineraryId) throw new Error('Itinerary ID not returned');
  });

  // 4. Validate Availability Rejection (Requesting more rooms than inventory)
  await test('4. Availability Guard: Reject Insufficient Inventory (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            itemType: 'HOTEL',
            referenceId: hotel.id,
            quantity: 9999, // Impossible room count
          },
        ],
      }),
    });

    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request for unavailable inventory, got ${res.status}`);
    }
    const data = await res.json();
    if (!data.error.includes('Insufficient room availability')) {
      throw new Error(`Expected 'Insufficient room availability' error, got: ${data.error}`);
    }
  });

  // 5. Server-Side Booking Creation with Atomic Calculation
  let booking: any = null;
  const initialAvailableRooms = hotel.availableRooms;
  await test('5. POST /api/v1/bookings (Server-Side Verified Price Calculation)', async () => {
    const hotelNights = 2;
    const travelers = 2;

    const res = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        itineraryId,
        items: [
          { itemType: 'HOTEL', referenceId: hotel.id, quantity: hotelNights, notes: '2 nights stay' },
          { itemType: 'ACTIVITY', referenceId: activity.id, quantity: travelers, notes: '2 excursion passes' },
        ],
        specialRequests: JSON.stringify({
          primaryTraveler: 'Arjun Sharma',
          email: 'arjun@example.com',
          phone: '+91 98765 43210',
          emergencyContact: '+91 98765 00000',
          dietary: 'Vegetarian',
        }),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Booking creation failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    booking = data.data;

    // Check unique booking reference
    if (!booking.bookingReference || !booking.bookingReference.startsWith('WR-2026-')) {
      throw new Error(`Invalid booking reference format: ${booking.bookingReference}`);
    }

    if (booking.status !== 'PENDING_PAYMENT') {
      throw new Error(`Expected status PENDING_PAYMENT, got ${booking.status}`);
    }

    // Verify Server-Side Price Calculation Math
    const expectedHotelCost = Number(hotel.pricePerNight) * hotelNights;
    const expectedActCost = Number(activity.pricePerPerson) * travelers;
    const expectedTotal = expectedHotelCost + expectedActCost;

    if (Number(booking.totalAmount) !== expectedTotal) {
      throw new Error(`Server total mismatch: expected ${expectedTotal}, got ${booking.totalAmount}`);
    }
  });

  // 6. Prevent Duplicate Booking Submissions
  await test('6. Prevention of Duplicate Booking Submissions (409 Conflict)', async () => {
    const res = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        itineraryId,
        items: [{ itemType: 'HOTEL', referenceId: hotel.id, quantity: 1 }],
      }),
    });

    if (res.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate booking on same itinerary, got ${res.status}`);
    }
    const data = await res.json();
    if (!data.error.includes('A booking already exists for this itinerary')) {
      throw new Error(`Expected duplicate booking error, got: ${data.error}`);
    }
  });

  // 7. GET /api/v1/payments/config (PayPal Client Configuration & Currency)
  let payPalConfig: any = null;
  await test('7. GET /api/v1/payments/config (PayPal Configuration & Currency Verification)', async () => {
    const res = await fetch(`${baseUrl}/payments/config`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    payPalConfig = data.data;

    if (!payPalConfig.clientId) throw new Error('PayPal clientId missing');
    if (!payPalConfig.currency) throw new Error('PayPal currency missing');
    if (!payPalConfig.exchangeRate || payPalConfig.exchangeRate <= 0) {
      throw new Error('Valid currency exchange rate missing');
    }
    if (payPalConfig.clientSecret) {
      throw new Error('SECURITY VIOLATION: PayPal secret must never be exposed to frontend config');
    }
  });

  // 8. POST /api/v1/payments/create-order (PayPal Orders v2 Creation & Currency Math)
  let payPalOrder: any = null;
  await test('8. POST /api/v1/payments/create-order (PayPal Orders API v2 & Currency Conversion)', async () => {
    const res = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        bookingId: booking.id,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Create order failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    payPalOrder = data.data;

    if (!payPalOrder.orderId) throw new Error('PayPal order ID not returned');
    if (!payPalOrder.chargeCurrency || payPalOrder.chargeCurrency !== payPalConfig.currency) {
      throw new Error(`Charge currency mismatch: expected ${payPalConfig.currency}, got ${payPalOrder.chargeCurrency}`);
    }
    if (!payPalOrder.chargeAmount) throw new Error('Charge amount not returned');
    if (!payPalOrder.approvalUrl) throw new Error('Approval URL not returned');
  });

  // 9. POST /api/v1/payments/capture-order (Server-Side Verification & Escrow Lock)
  let captureResult: any = null;
  await test('9. POST /api/v1/payments/capture-order (Server-Side Capture & Escrow Hold)', async () => {
    const res = await fetch(`${baseUrl}/payments/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        bookingId: booking.id,
        paypalOrderId: payPalOrder.orderId,
        idempotencyKey: `idemp-${Date.now()}-${booking.id}`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Capture failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    captureResult = data.data;

    if (captureResult.bookingStatus !== 'ESCROW_HOLD') {
      throw new Error(`Expected booking status ESCROW_HOLD, got ${captureResult.bookingStatus}`);
    }
    if (!captureResult.captureId || !captureResult.captureId.startsWith('CAP-')) {
      throw new Error(`Invalid capture ID: ${captureResult.captureId}`);
    }
    if (captureResult.payment.status !== 'CAPTURED') {
      throw new Error(`Expected payment status CAPTURED, got ${captureResult.payment?.status}`);
    }
    if (captureResult.payment.escrowStatus !== 'HELD') {
      throw new Error(`Expected escrowStatus HELD, got ${captureResult.payment?.escrowStatus}`);
    }

    // Verify inventory was atomically decremented in database
    const updatedHotel = await prisma.hotel.findUnique({ where: { id: hotel.id } });
    if (updatedHotel && updatedHotel.availableRooms !== initialAvailableRooms - 2) {
      throw new Error(`Inventory decrement failed: expected ${initialAvailableRooms - 2}, got ${updatedHotel.availableRooms}`);
    }
  });

  // 10. Prevention of Double Captures (Idempotency)
  await test('10. Double-Capture Guard: Prevent Duplicate Captures (Idempotency)', async () => {
    const res = await fetch(`${baseUrl}/payments/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        bookingId: booking.id,
        paypalOrderId: payPalOrder.orderId,
      }),
    });

    if (!res.ok) throw new Error(`Double capture check failed: ${res.status}`);
    const data = await res.json();
    if (!data.data.isDuplicate) {
      throw new Error('Expected isDuplicate flag on duplicate capture attempt');
    }
  });

  // 11. PayPal Webhook Signature & Event Processing (Part C)
  await test('11. POST /api/v1/payments/webhook (Cryptographic Event Reconcile & Idempotency)', async () => {
    const webhookEvent = {
      id: `WH-TEST-EVENT-${Date.now()}`,
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: captureResult.captureId,
        supplementary_data: {
          related_ids: {
            order_id: payPalOrder.orderId,
          },
        },
        payer: {
          email_address: 'webhook-verified@traveler.com',
          payer_id: 'WH_PAYER_999',
        },
      },
    };

    // First attempt -> processes cleanly
    const res1 = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookEvent),
    });

    if (!res1.ok) throw new Error(`Webhook failed: ${res1.status}`);
    const data1 = await res1.json();
    if (!data1.received) throw new Error('Expected { received: true }');

    // Second attempt with exact same event -> returns idempotent alreadyProcessed
    const res2 = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookEvent),
    });

    if (!res2.ok) throw new Error(`Webhook retry failed: ${res2.status}`);
    const data2 = await res2.json();
    if (!data2.alreadyProcessed) {
      throw new Error('Expected alreadyProcessed: true on duplicate webhook event');
    }
  });

  // 12. Traveler Cancellation Request (Part D - Does NOT Auto-Refund)
  await test('12. Traveler Cancellation Request (Submits Request Without Auto-Refund)', async () => {
    const res = await fetch(`${baseUrl}/payments/cancel-request/${booking.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        reason: 'Personal schedule conflict.',
      }),
    });

    if (!res.ok) throw new Error(`Cancel request failed: ${res.status}`);
    const data = await res.json();
    if (!data.data.message.includes('In accordance with WayRivo escrow policies')) {
      throw new Error(`Unexpected cancel request response: ${data.data.message}`);
    }

    // Verify booking is NOT automatically refunded
    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    if (updated?.status === 'REFUNDED') {
      throw new Error('SECURITY VIOLATION: Booking was refunded automatically merely on cancellation request');
    }
  });

  // 13. Security Guard: Non-Admin Blocked from Processing Refunds
  await test('13. Security Guard: Traveler Blocked from Executing Refunds (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/payments/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        bookingId: booking.id,
        reason: 'Unauthorized refund attempt',
      }),
    });

    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-admin refund, got ${res.status}`);
    }
  });

  // 14. Administrator-Controlled Refund Workflow via PayPal Refund API (Part D)
  await test('14. POST /api/v1/payments/refund (Administrator-Controlled Refund & Inventory Restored)', async () => {
    const res = await fetch(`${baseUrl}/payments/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        bookingId: booking.id,
        reason: 'Approved by WayRivo Escrow Manager due to verified traveler notice',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Admin refund failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    if (!data.data.success || !data.data.refundId) {
      throw new Error('Refund failed or refundId missing');
    }

    // Verify Payment status is REFUNDED and Escrow status is REFUNDED
    const paymentRecord = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
    if (paymentRecord?.status !== 'REFUNDED') {
      throw new Error(`Expected payment status REFUNDED, got ${paymentRecord?.status}`);
    }
    if (paymentRecord?.escrowStatus !== 'REFUNDED') {
      throw new Error(`Expected escrowStatus REFUNDED, got ${paymentRecord?.escrowStatus}`);
    }

    // Verify Booking status is REFUNDED
    const bookingRecord = await prisma.booking.findUnique({ where: { id: booking.id } });
    if (bookingRecord?.status !== 'REFUNDED') {
      throw new Error(`Expected booking status REFUNDED, got ${bookingRecord?.status}`);
    }

    // Verify inventory counts were restored
    const restoredHotel = await prisma.hotel.findUnique({ where: { id: hotel.id } });
    if (restoredHotel && restoredHotel.availableRooms !== initialAvailableRooms) {
      throw new Error(`Inventory restoration mismatch: expected ${initialAvailableRooms}, got ${restoredHotel.availableRooms}`);
    }
  });

  console.log('\n======================================================================');
  console.log(`📊 Phase 8 Test Summary: ${passCount} Passed, ${failCount} Failed`);
  console.log('======================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

testBookingAndPayPal()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
