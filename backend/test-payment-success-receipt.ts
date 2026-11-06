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
  console.log('🧾 WayRivo AI: Payment Success Page & PDF Receipt Verification Suite');
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
    // 1. Setup Traveler A
    const travelerAEmail = `traveler.receipt.${Date.now()}@wayrivo.test`;
    const regARes = await postJson(`${API_BASE}/auth/register`, {
      name: 'Rohan V. Deshmukh',
      email: travelerAEmail,
      password: 'Password123!',
      role: 'TRAVELER',
    });
    const travelerAToken = regARes.data.token;
    const travelerAId = regARes.data.user.id;
    assert(!!travelerAToken, '1. Primary traveler account registered and authenticated');

    // 2. Setup Traveler B (Attacker / Unauthorized user)
    const travelerBEmail = `traveler.attacker.${Date.now()}@wayrivo.test`;
    const regBRes = await postJson(`${API_BASE}/auth/register`, {
      name: 'Unauthorized Stranger',
      email: travelerBEmail,
      password: 'Password123!',
      role: 'TRAVELER',
    });
    const travelerBToken = regBRes.data.token;
    assert(!!travelerBToken, '2. Secondary traveler account registered for auth barrier test');

    // 3. Create Itinerary and Booking for Traveler A
    const destRes = await getJson(`${API_BASE}/destinations`);
    const destination = destRes.data[0];

    const itinRes = await postJson(
      `${API_BASE}/itineraries`,
      {
        destinationId: destination.id,
        title: 'Goa Heritage & Luxury Escape',
        travelStyle: 'LUXURY',
        startDate: new Date(Date.now() + 86400000 * 15).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 20).toISOString(),
        travelersCount: 2,
        roomsCount: 1,
        adultsCount: 2,
        childrenCount: 0,
        itineraryDays: [
          {
            dayNumber: 1,
            title: 'Panaji Heritage Walk',
            description: 'Portuguese quarter architectural tour',
            estimatedDayCost: 15000,
          },
        ],
      },
      travelerAToken
    );
    const itinerary = itinRes.data;

    const bookRes = await postJson(
      `${API_BASE}/bookings`,
      {
        itineraryId: itinerary.id,
        specialRequests: 'Ocean view suite requested',
      },
      travelerAToken
    );
    const booking = bookRes.data;
    assert(!!booking.id, `3. Booking created with reference: ${booking.bookingReference}`);

    // TEST 1: Uncaptured / Pending Booking cannot generate receipt (HTTP 400 rejection)
    const sessionRes = await postJson(
      `${API_BASE}/payments/create-session`,
      { bookingId: booking.id },
      travelerAToken
    );
    const sessionId = sessionRes.data.paymentSessionId;
    assert(!!sessionId, '4. Pre-payment session initialized');

    let uncapturedBlocked = false;
    try {
      await getJson(`${API_BASE}/payments/${sessionId}/receipt`, travelerAToken);
    } catch (err: any) {
      if (err.status === 400 && err.message.includes('Receipt unavailable')) {
        uncapturedBlocked = true;
      }
    }
    assert(uncapturedBlocked, '5. Security Check: Receipt generation rejected for uncaptured payment (HTTP 400)');

    // TEST 2: Create Order & Perform Verified PayPal Capture
    const orderRes = await postJson(
      `${API_BASE}/payments/create-order`,
      {
        bookingId: booking.id,
        returnUrl: 'http://localhost:5173/payment/success',
        cancelUrl: 'http://localhost:5173/payment/cancel',
      },
      travelerAToken
    );
    const orderData = orderRes.data;
    assert(!!orderData.orderId, `6. PayPal order created: ${orderData.orderId}`);

    const payerEmail = 'rohan.deshmukh.buyer@personal.example.com';
    const payerName = 'Rohan V. Deshmukh';
    const captureRes = await postJson(
      `${API_BASE}/payments/capture-order`,
      {
        bookingId: booking.id,
        paypalOrderId: orderData.orderId,
        idempotencyKey: `rcpt-test-${Date.now()}-${booking.id}`,
        payerEmail,
        payerName,
      },
      travelerAToken
    );
    assert(captureRes.data.payment.status === 'CAPTURED', '7. Payment successfully captured in Sandbox');

    const paymentId = captureRes.data.payment.id;
    const originalPaypalCaptureId = captureRes.data.payment.paypalCaptureId;

    // TEST 3: Retrieve Verified Payment Receipt
    const receiptRes = await getJson(`${API_BASE}/payments/${paymentId}/receipt`, travelerAToken);
    const receipt = receiptRes.data;
    assert(!!receipt, '8. Receipt retrieved successfully from GET /payments/:paymentId/receipt');

    // TEST 4: Verify 12-Digit Numerical WayRivo Transaction ID
    const wayrivoTxId = receipt.wayrivoTransactionId;
    const is12Digits = typeof wayrivoTxId === 'string' && /^\d{12}$/.test(wayrivoTxId);
    assert(is12Digits, `9. WayRivo Transaction ID is strictly 12 numerical digits: "${wayrivoTxId}"`);

    // Verify it does not start with 0
    const noLeadingZero = wayrivoTxId && wayrivoTxId[0] !== '0';
    assert(noLeadingZero, '10. WayRivo Transaction ID has no leading zero');

    // TEST 5: Verify original PayPal Capture ID is preserved and distinct
    assert(
      receipt.paypalCaptureId === originalPaypalCaptureId,
      `11. Original PayPal Capture ID preserved intact: "${receipt.paypalCaptureId}"`
    );
    assert(
      receipt.paypalCaptureId !== receipt.wayrivoTransactionId,
      '12. WayRivo Transaction ID and PayPal Capture ID are stored separately without collision'
    );

    // TEST 6: Verify Sender Details
    assert(
      receipt.sender.fullName === payerName,
      `13. Sender full name correctly matches verified payer: "${receipt.sender.fullName}"`
    );
    assert(
      receipt.sender.email === payerEmail,
      `14. Sender email correctly matches verified payer: "${receipt.sender.email}"`
    );
    assert(
      receipt.sender.userReference === travelerAId,
      '15. Sender userReference matches authenticated traveler UUID'
    );

    // TEST 7: Verify Timestamps & Indian Standard Time (IST)
    assert(
      typeof receipt.timestamps.transactionDateIST === 'string' &&
      receipt.timestamps.transactionDateIST.length > 5,
      `16. Formatted IST Date present: "${receipt.timestamps.transactionDateIST}"`
    );
    assert(
      typeof receipt.timestamps.transactionTimeIST === 'string' &&
      receipt.timestamps.transactionTimeIST.endsWith('IST'),
      `17. Formatted IST Time present with IST timezone suffix: "${receipt.timestamps.transactionTimeIST}"`
    );
    assert(
      !isNaN(new Date(receipt.timestamps.completedAtUTC).getTime()),
      '18. Completed UTC timestamp is a valid ISO date'
    );

    // TEST 8: Verify Receipt Immutability / Idempotency on repeated fetch
    const receiptRes2 = await getJson(`${API_BASE}/payments/${paymentId}/receipt`, travelerAToken);
    const receipt2 = receiptRes2.data;
    assert(
      receipt2.wayrivoTransactionId === wayrivoTxId,
      '19. Immutability: Repeated receipt requests return identical 12-digit transaction ID'
    );
    assert(
      receipt2.timestamps.completedAtUTC === receipt.timestamps.completedAtUTC,
      '20. Immutability: Repeated receipt requests preserve original completion timestamp'
    );

    // TEST 9: Lookup receipt by 12-digit transaction ID as identifier
    const receiptByTxIdRes = await getJson(`${API_BASE}/payments/${wayrivoTxId}/receipt`, travelerAToken);
    assert(
      receiptByTxIdRes.data.wayrivoTransactionId === wayrivoTxId,
      '21. Receipt can be directly queried using the 12-digit WayRivo Transaction ID'
    );

    // TEST 10: Security Barrier: Unauthorized User (Traveler B) cannot access Traveler A's receipt
    let unauthorizedBlocked = false;
    try {
      await getJson(`${API_BASE}/payments/${paymentId}/receipt`, travelerBToken);
    } catch (err: any) {
      if (err.status === 403) {
        unauthorizedBlocked = true;
      }
    }
    assert(
      unauthorizedBlocked,
      '22. Security Check: Unauthorized user access to another traveler\'s receipt blocked (HTTP 403)'
    );

    // TEST 11: Escrow & Merchant Platform Integrity
    assert(
      receipt.escrowStatus === 'HELD',
      '23. Escrow vault status confirmed as HELD in receipt'
    );
    assert(
      receipt.merchant.paymentProvider === 'PayPal Sandbox',
      '24. Payment provider verified as PayPal Sandbox'
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

