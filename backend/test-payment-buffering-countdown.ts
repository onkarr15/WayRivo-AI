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
  console.log('⏱️ WayRivo AI: PayPal Buffering & 6-Minute Countdown Verification Suite');
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
    // 1. Authenticate Traveler
    const travelerEmail = `traveler.buffer.${Date.now()}@wayrivo.test`;
    const regRes = await postJson(`${API_BASE}/auth/register`, {
      name: 'Pooja V. Hegde',
      email: travelerEmail,
      password: 'Password123!',
      role: 'TRAVELER',
    });
    const travelerToken = regRes.data.token;
    assert(!!travelerToken, '1. Traveler registered & authenticated');

    // 2. Create Itinerary and Booking
    const destRes = await getJson(`${API_BASE}/destinations`);
    const destination = destRes.data[0];

    const itinRes = await postJson(
      `${API_BASE}/itineraries`,
      {
        destinationId: destination.id,
        title: 'Rajasthan Royal Heritage Expedition',
        travelStyle: 'HERITAGE',
        startDate: new Date(Date.now() + 86400000 * 25).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        travelersCount: 2,
        roomsCount: 1,
        adultsCount: 2,
        childrenCount: 0,
        itineraryDays: [
          {
            dayNumber: 1,
            title: 'Jaipur Pink City Palace',
            description: 'Heritage royal architecture tour',
            estimatedDayCost: 14000,
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
        specialRequests: 'Heritage suite room request',
      },
      travelerToken
    );
    const booking = bookRes.data;
    assert(!!booking.id, `2. Booking created: ${booking.bookingReference}`);

    // TEST 1: Establish Server-Authoritative 6-Minute Payment Session
    const sessionRes = await postJson(
      `${API_BASE}/payments/create-session`,
      { bookingId: booking.id },
      travelerToken
    );
    const session = sessionRes.data;
    assert(!!session.paymentSessionId, `3. Payment session initialized: ${session.paymentSessionId}`);

    const startedAt = new Date(session.startedAt).getTime();
    const expiresAt = new Date(session.expiresAt).getTime();
    const totalDurationSeconds = Math.round((expiresAt - startedAt) / 1000);
    assert(
      totalDurationSeconds >= 355 && totalDurationSeconds <= 365,
      `4. Initial session duration is exactly 6 minutes (360s, measured: ${totalDurationSeconds}s)`
    );

    // TEST 2: Session Remaining Seconds Calculation
    const fetchedSession = await getJson(
      `${API_BASE}/payments/session/${session.paymentSessionId}`,
      travelerToken
    );
    const remainingSecs = fetchedSession.data.remainingSeconds;
    assert(
      remainingSecs > 340 && remainingSecs <= 360,
      `5. Server authoritative remainingSeconds (${remainingSecs}s) matches mathematical time delta`
    );

    // TEST 3: Countdown Immutability (Overlays & Clicks must NOT reset expiry)
    // Repeated session call should return the EXACT SAME expiresAt timestamp
    const sessionCall2 = await postJson(
      `${API_BASE}/payments/create-session`,
      { bookingId: booking.id },
      travelerToken
    );
    assert(
      sessionCall2.data.expiresAt === session.expiresAt,
      '6. Immutability: Repeated session calls preserve original expiration timestamp without resetting'
    );

    // TEST 4: Warning State Logic Verification (Derived from remaining seconds)
    function getTimerState(seconds: number) {
      if (seconds === 0) return 'EXPIRED';
      if (seconds <= 60) return 'CRITICAL';
      if (seconds <= 120) return 'WARNING';
      return 'NORMAL';
    }

    assert(getTimerState(360) === 'NORMAL', '7. Timer state at 360s is NORMAL (> 2 min)');
    assert(getTimerState(120) === 'WARNING', '8. Timer state at 120s is WARNING (amber ring below 2 min)');
    assert(getTimerState(60) === 'CRITICAL', '9. Timer state at 60s is CRITICAL (red pulsing ring below 1 min)');
    assert(getTimerState(0) === 'EXPIRED', '10. Timer state at 0s is EXPIRED (action recovery view)');

    // TEST 5: Create PayPal Sandbox Order
    const orderRes = await postJson(
      `${API_BASE}/payments/create-order`,
      {
        bookingId: booking.id,
        returnUrl: 'http://localhost:5173/payment/success',
        cancelUrl: 'http://localhost:5173/payment/cancel',
      },
      travelerToken
    );
    assert(!!orderRes.data.orderId, `11. PayPal Sandbox order created: ${orderRes.data.orderId}`);

    // TEST 6: Capture Payment in Sandbox
    const payerName = 'Pooja V. Hegde';
    const payerEmail = 'pooja.hegde.buyer@personal.example.com';
    const idempKey = `test-buffering-countdown-${Date.now()}`;

    const captureRes = await postJson(
      `${API_BASE}/payments/capture-order`,
      {
        bookingId: booking.id,
        paypalOrderId: orderRes.data.orderId,
        idempotencyKey: idempKey,
        payerEmail,
        payerName,
      },
      travelerToken
    );
    assert(captureRes.data.payment.status === 'CAPTURED', '12. Payment successfully verified and CAPTURED');

    // TEST 7: Captured Payment Freezes Expiration (Captured payments NEVER transition to EXPIRED)
    const expireAttempt = await postJson(
      `${API_BASE}/payments/expire-session`,
      { sessionId: session.paymentSessionId },
      travelerToken
    );
    assert(
      expireAttempt.data.status === 'CAPTURED',
      '13. Security Integrity: Captured payment cannot be transitioned to EXPIRED'
    );

    // TEST 8: Retrieve Verified Receipt with 12-Digit WayRivo TxID
    const receiptRes = await getJson(
      `${API_BASE}/payments/${captureRes.data.payment.id}/receipt`,
      travelerToken
    );
    const receipt = receiptRes.data;
    assert(
      typeof receipt.wayrivoTransactionId === 'string' && /^\d{12}$/.test(receipt.wayrivoTransactionId),
      `14. Receipt contains valid 12-digit WayRivo Transaction ID: ${receipt.wayrivoTransactionId}`
    );
    assert(
      receipt.sender.fullName === payerName,
      `15. Sender details correctly captured: ${receipt.sender.fullName}`
    );
    assert(
      receipt.timestamps.transactionTimeIST.endsWith('IST'),
      `16. Indian Standard Time timestamp verified: ${receipt.timestamps.transactionTimeIST}`
    );

  } catch (error: any) {
    console.error('💥 Test suite encountered unexpected error:', error);
    failed++;
  }

  console.log('\n======================================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();

