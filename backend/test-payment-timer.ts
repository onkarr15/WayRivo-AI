/// <reference types="node" />
import { prisma } from './src/config/db';

const API_BASE = 'http://127.0.0.1:8085/api/v1';

async function postJson(url: string, data: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as any;
  if (!res.ok) {
    const errorMsg = json.error || `HTTP ${res.status}: ${JSON.stringify(json)}`;
    const err = new Error(errorMsg) as any;
    err.status = res.status;
    err.json = json;
    throw err;
  }
  return json;
}

async function getJson(url: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const json = (await res.json()) as any;
  if (!res.ok) {
    const errorMsg = json.error || `HTTP ${res.status}: ${JSON.stringify(json)}`;
    const err = new Error(errorMsg) as any;
    err.status = res.status;
    err.json = json;
    throw err;
  }
  return json;
}

async function run() {
  console.log('\n======================================================================');
  console.log('⏱️  WayRivo AI: 6-Minute Payment Countdown Timer Automated Verification');
  console.log(`Backend Target: ${API_BASE}`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Setup Traveler A & Traveler B
    const travelerEmail = `timer.traveler.${Date.now()}@wayrivo.test`;
    const regRes = await postJson(`${API_BASE}/auth/register`, {
      name: 'Rohan Mehra',
      email: travelerEmail,
      password: 'Password123!',
      role: 'TRAVELER',
    });
    const travelerToken = regRes.data.token;
    const travelerUser = regRes.data.user;
    assert(!!travelerToken, '1. Traveler A registered and authenticated');

    const unauthorizedEmail = `timer.other.${Date.now()}@wayrivo.test`;
    const regOtherRes = await postJson(`${API_BASE}/auth/register`, {
      name: 'Unauthorized Stranger',
      email: unauthorizedEmail,
      password: 'Password123!',
      role: 'TRAVELER',
    });
    const unauthorizedToken = regOtherRes.data.token;
    assert(!!unauthorizedToken, '2. Traveler B (unauthorized) registered');

    // 2. Discover Inventory & Create Itinerary and Booking
    const destRes = await getJson(`${API_BASE}/destinations`);
    const destination = destRes.data[0];

    const itinRes = await postJson(
      `${API_BASE}/itineraries`,
      {
        destinationId: destination.id,
        title: 'Goa 6-Minute Timer Escrow Test Tour',
        travelStyle: 'COMFORT',
        startDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 19).toISOString(),
        travelersCount: 2,
        roomsCount: 1,
        adultsCount: 2,
        childrenCount: 0,
        itineraryDays: [
          {
            dayNumber: 1,
            title: 'Arrival & Beach Check-in',
            description: 'Relax at beach resort',
            estimatedDayCost: 5000,
          },
        ],
      },
      travelerToken
    );
    const itinerary = itinRes.data;

    const bookRes = await postJson(
      `${API_BASE}/bookings`,
      {
        itineraryId: itinerary.id,
        specialRequests: 'Payment timer verification booking',
      },
      travelerToken
    );
    const booking = bookRes.data;
    assert(!!booking.id, `3. Booking created with reference: ${booking.bookingReference}`);

    // TEST 1: Initiate Payment Session (Server-Authoritative 6-Minute Window)
    const sessionRes = await postJson(
      `${API_BASE}/payments/create-session`,
      { bookingId: booking.id },
      travelerToken
    );
    const session = sessionRes.data;
    assert(!!session.paymentSessionId, '4. Payment session created with unique paymentSessionId');
    assert(session.status === 'CREATED', `5. Initial session status is CREATED (got: ${session.status})`);
    assert(!!session.startedAt, '6. Session startedAt timestamp is present');
    assert(!!session.expiresAt, '7. Session expiresAt timestamp is present');

    const startedTime = new Date(session.startedAt).getTime();
    const expiresTime = new Date(session.expiresAt).getTime();
    const durationSeconds = Math.round((expiresTime - startedTime) / 1000);
    assert(
      durationSeconds === 360,
      `8. Server session duration is exactly 360 seconds (6 minutes) (got: ${durationSeconds}s)`
    );
    assert(
      session.remainingSeconds <= 360 && session.remainingSeconds >= 355,
      `9. Initial remainingSeconds is within [355, 360] (got: ${session.remainingSeconds}s)`
    );

    // TEST 2: Tab Navigation / Page Refresh Persistence
    // Calling get-session or create-session again should return the SAME session and expiration
    const sessionInspectRes = await getJson(
      `${API_BASE}/payments/session/${session.paymentSessionId}`,
      travelerToken
    );
    const inspectedSession = sessionInspectRes.data;
    assert(
      inspectedSession.expiresAt === session.expiresAt,
      '10. Session inspect maintains exact same server expiresAt timestamp'
    );

    const sessionRecreateRes = await postJson(
      `${API_BASE}/payments/create-session`,
      { bookingId: booking.id },
      travelerToken
    );
    assert(
      sessionRecreateRes.data.isExisting === true,
      '11. Re-invoking create-session detects existing active session (isExisting: true)'
    );
    assert(
      sessionRecreateRes.data.paymentSessionId === session.paymentSessionId,
      '12. Re-invoking create-session preserves original paymentSessionId without resetting timer'
    );

    // TEST 3: Security & RBAC Guard
    // Traveler B should NOT be able to view or expire Traveler A's session
    let unauthorizedBlocked = false;
    try {
      await getJson(
        `${API_BASE}/payments/session/${session.paymentSessionId}`,
        unauthorizedToken
      );
    } catch (e: any) {
      if (e.status === 403 || e.message.includes('403') || e.message.includes('authorized')) {
        unauthorizedBlocked = true;
      }
    }
    assert(unauthorizedBlocked, '13. Unauthorized user cannot inspect another traveler payment session (HTTP 403)');

    let unauthorizedExpireBlocked = false;
    try {
      await postJson(
        `${API_BASE}/payments/expire-session`,
        { sessionId: session.paymentSessionId },
        unauthorizedToken
      );
    } catch (e: any) {
      if (e.status === 403 || e.message.includes('403') || e.message.includes('authorized')) {
        unauthorizedExpireBlocked = true;
      }
    }
    assert(unauthorizedExpireBlocked, '14. Unauthorized user cannot expire another traveler payment session (HTTP 403)');

    // TEST 4: Expiration Enforcement
    const expireRes = await postJson(
      `${API_BASE}/payments/expire-session`,
      { sessionId: session.paymentSessionId },
      travelerToken
    );
    assert(
      expireRes.data.status === 'EXPIRED',
      `15. Expire session transitioned status to EXPIRED (got: ${expireRes.data.status})`
    );

    const expiredSessionInspect = await getJson(
      `${API_BASE}/payments/session/${session.paymentSessionId}`,
      travelerToken
    );
    assert(
      expiredSessionInspect.data.status === 'EXPIRED',
      '16. DB record reflects EXPIRED status on subsequent queries'
    );
    assert(
      expiredSessionInspect.data.remainingSeconds === 0,
      '17. Remaining seconds for expired session is 0'
    );

    // TEST 5: Capture Rejection for Expired Session
    let captureExpiredBlocked = false;
    try {
      await postJson(
        `${API_BASE}/payments/capture-order`,
        {
          bookingId: booking.id,
          paypalOrderId: 'EXPIRED-TEST-ORDER-ID',
          idempotencyKey: `test-exp-${Date.now()}`,
        },
        travelerToken
      );
    } catch (e: any) {
      if (e.status === 400 || e.message.includes('expired') || e.message.includes('6-minute')) {
        captureExpiredBlocked = true;
      }
    }
    assert(captureExpiredBlocked, '18. Capture attempt on expired payment session rejected by backend with HTTP 400');

    // TEST 6: Start New Payment (Renew Session)
    const renewedSessionRes = await postJson(
      `${API_BASE}/payments/create-session`,
      { bookingId: booking.id },
      travelerToken
    );
    const renewedSession = renewedSessionRes.data;
    assert(
      renewedSession.status === 'CREATED',
      '19. New payment session successfully started after previous expired'
    );
    assert(
      renewedSession.isExisting === false,
      '20. Renewed session is fresh (isExisting: false)'
    );
    assert(
      renewedSession.remainingSeconds >= 355,
      `21. Renewed session has fresh 360-second window (got: ${renewedSession.remainingSeconds}s)`
    );

    // TEST 7: Successful Payment Capture within Window & Escrow Locking
    const orderRes = await postJson(
      `${API_BASE}/payments/create-order`,
      {
        bookingId: booking.id,
        returnUrl: 'http://localhost:5173/payment/success',
        cancelUrl: 'http://localhost:5173/payment/cancel',
      },
      travelerToken
    );
    assert(!!orderRes.data.orderId, `22. PayPal order created: ${orderRes.data.orderId}`);

    const captureRes = await postJson(
      `${API_BASE}/payments/capture-order`,
      {
        bookingId: booking.id,
        paypalOrderId: orderRes.data.orderId,
        idempotencyKey: `test-cap-${Date.now()}`,
        payerEmail: 'alex.traveler@wayrivo.test',
        payerName: 'Alex Johnson',
      },
      travelerToken
    );
    assert(
      captureRes.data.payment.status === 'CAPTURED',
      `23. Payment successfully captured into escrow (status: ${captureRes.data.payment.status})`
    );
    assert(
      captureRes.data.bookingStatus === 'ESCROW_HOLD',
      `24. Booking status transitioned to ESCROW_HOLD (got: ${captureRes.data.bookingStatus})`
    );

    // TEST 8: Completed Payments Cannot Expire
    const attemptExpireCaptured = await postJson(
      `${API_BASE}/payments/expire-session`,
      { bookingId: booking.id },
      travelerToken
    );
    assert(
      attemptExpireCaptured.data.status === 'CAPTURED',
      '25. Expire call on completed capture is protected; status remains CAPTURED'
    );

    // TEST 9: Idempotent Capture Duplicate Call
    const duplicateCaptureRes = await postJson(
      `${API_BASE}/payments/capture-order`,
      {
        bookingId: booking.id,
        paypalOrderId: orderRes.data.orderId,
      },
      travelerToken
    );
    assert(
      duplicateCaptureRes.data.isDuplicate === true,
      '26. Duplicate capture returns idempotent success without double charging'
    );

  } catch (err: any) {
    console.error('Test execution failed:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n======================================================================');
  console.log(`📊 FINAL RESULT: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

run();
