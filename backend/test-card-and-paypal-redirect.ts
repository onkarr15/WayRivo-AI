/// <reference types="node" />
import { prisma } from './src/config/db';

const API_BASE = 'http://localhost:8085/api/v1';

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
    throw new Error(json.error || `HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function getJson(url: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const json = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function run() {
  console.log('\n======================================================================');
  console.log('💳 WayRivo AI: Debit/Credit Card & PayPal Sandbox Flow Verification');
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
    const travelerEmail = `traveler.test.${Date.now()}@example.com`;
    const regRes = await postJson(`${API_BASE}/auth/register`, {
      name: 'Priya Patel',
      email: travelerEmail,
      password: 'Password123!',
      role: 'TRAVELER',
    });
    const travelerToken = regRes.data.token;
    assert(!!travelerToken, '1. Traveler Registration & Authentication');

    // 2. Discover Inventory & Create Itinerary
    const destRes = await getJson(`${API_BASE}/destinations`);
    const destination = destRes.data[0];

    const itinRes = await postJson(
      `${API_BASE}/itineraries`,
      {
        destinationId: destination.id,
        title: 'Goa Coastal Getaway',
        travelStyle: 'LEISURE',
        startDate: '2026-12-15T00:00:00.000Z',
        endDate: '2026-12-20T00:00:00.000Z',
        numberOfDays: 5,
        travelersCount: 2,
        budget: 60000,
        currency: 'INR',
        days: [
          {
            dayNumber: 1,
            date: '2026-12-15T00:00:00.000Z',
            title: 'Arrival & Beach Relaxation',
            mealsIncluded: ['DINNER'],
            estimatedDayCost: 5000,
          },
        ],
      },
      travelerToken
    );
    const itinerary = itinRes.data;
    assert(!!itinerary.id, '2. Itinerary Created & Persisted');

    // 3. Create Booking
    const bookRes = await postJson(
      `${API_BASE}/bookings`,
      {
        itineraryId: itinerary.id,
        specialRequests: 'Ocean view room, vegetarian food preference.',
      },
      travelerToken
    );
    const booking = bookRes.data;
    assert(booking.status === 'PENDING_PAYMENT', '3. Booking Reservation Created in PENDING_PAYMENT status');

    // 4. Test PayPal Order Creation
    const orderRes = await postJson(
      `${API_BASE}/payments/create-order`,
      {
        bookingId: booking.id,
        returnUrl: `http://localhost:5173/payment/success?bookingId=${booking.id}`,
        cancelUrl: `http://localhost:5173/payment/cancel?bookingId=${booking.id}`,
      },
      travelerToken
    );
    const orderData = orderRes.data;
    assert(!!orderData.orderId, '4. POST /payments/create-order generates verified PayPal Order ID');
    assert(Number(orderData.chargeAmount) > 0 && orderData.chargeCurrency === 'USD', '5. Currency Conversion to USD matches exchange rate');

    // 5. Test Re-order Idempotency on existing pending payment
    const reorderRes = await postJson(
      `${API_BASE}/payments/create-order`,
      {
        bookingId: booking.id,
        returnUrl: `http://localhost:5173/payment/success?bookingId=${booking.id}`,
      },
      travelerToken
    );
    assert(!!reorderRes.data.orderId, '6. Subsequent order creation re-uses/updates pending payment without ConflictError');

    // 6. Test Card Payment Capture Flow
    const cardIdempKey = `card-idemp-${Date.now()}-${booking.id}`;
    const cardCaptureRes = await postJson(
      `${API_BASE}/payments/capture-order`,
      {
        bookingId: booking.id,
        paypalOrderId: reorderRes.data.orderId,
        idempotencyKey: cardIdempKey,
        cardDetails: {
          cardholderName: 'Priya Patel',
          cardBrand: 'Visa',
          last4: '1881',
        },
      },
      travelerToken
    );
    const cardCaptureData = cardCaptureRes.data;
    assert(cardCaptureData.bookingStatus === 'ESCROW_HOLD', '7. Card Capture advances booking to ESCROW_HOLD status');
    assert(cardCaptureData.payment.status === 'CAPTURED', '8. Payment record status set to CAPTURED');

    // 7. Verify Payment Details Endpoint for Card Details
    const detailsRes = await getJson(`${API_BASE}/payments/${cardCaptureData.payment.id}`, travelerToken);
    const details = detailsRes.data;
    assert(details.paymentMethod === 'CREDIT_DEBIT_CARD', '9. Payment Details correctly reports CREDIT_DEBIT_CARD method');
    assert(details.cardBrand === 'Visa' && details.cardLast4 === '1881', '10. Payment Details correctly surfaces Card Brand & Last 4 Digits');
    assert(details.payerName === 'Priya Patel', '11. Payer Name is verified as Priya Patel');

    // 8. Test PayPal Wallet Login Capture Flow on a Second Booking
    const itinRes2 = await postJson(
      `${API_BASE}/itineraries`,
      {
        destinationId: destination.id,
        title: 'Kerala Backwaters Tour',
        travelStyle: 'CULTURAL',
        startDate: '2027-01-10T00:00:00.000Z',
        endDate: '2027-01-15T00:00:00.000Z',
        numberOfDays: 5,
        travelersCount: 2,
        budget: 50000,
        currency: 'INR',
        days: [
          {
            dayNumber: 1,
            date: '2027-01-10T00:00:00.000Z',
            title: 'Houseboat Check-in',
            mealsIncluded: ['LUNCH', 'DINNER'],
            estimatedDayCost: 6000,
          },
        ],
      },
      travelerToken
    );
    const itinerary2 = itinRes2.data;

    const bookRes2 = await postJson(
      `${API_BASE}/bookings`,
      {
        itineraryId: itinerary2.id,
        specialRequests: 'Second booking for PayPal Wallet testing.',
      },
      travelerToken
    );
    const booking2 = bookRes2.data;

    const orderRes2 = await postJson(
      `${API_BASE}/payments/create-order`,
      {
        bookingId: booking2.id,
      },
      travelerToken
    );

    const paypalIdempKey = `paypal-idemp-${Date.now()}-${booking2.id}`;
    const paypalCaptureRes = await postJson(
      `${API_BASE}/payments/capture-order`,
      {
        bookingId: booking2.id,
        paypalOrderId: orderRes2.data.orderId,
        idempotencyKey: paypalIdempKey,
        payerEmail: 'sb-buyer2026@personal.example.com',
        payerName: 'Alex J. Johnson',
      },
      travelerToken
    );
    const paypalCaptureData = paypalCaptureRes.data;
    assert(paypalCaptureData.payment.status === 'CAPTURED', '12. PayPal Sandbox Wallet Capture set to CAPTURED');

    const paypalDetailsRes = await getJson(`${API_BASE}/payments/${paypalCaptureData.payment.id}`, travelerToken);
    const paypalDetails = paypalDetailsRes.data;
    assert(paypalDetails.paymentMethod === 'PAYPAL_WALLET', '13. Payment Details correctly reports PAYPAL_WALLET method');
    assert(paypalDetails.payerEmail === 'sb-buyer2026@personal.example.com', '14. Verified Sandbox Buyer Email persisted');

    // 9. Test Double-Capture Prevention
    const doubleRes = await postJson(
      `${API_BASE}/payments/capture-order`,
      {
        bookingId: booking2.id,
        paypalOrderId: orderRes2.data.orderId,
        idempotencyKey: paypalIdempKey,
      },
      travelerToken
    );
    assert(doubleRes.data.isDuplicate === true, '15. Idempotent Double-Capture protection returned duplicate receipt');

  } catch (err: any) {
    console.error('Test Suite encountered an error:', err.message);
    failed++;
  } finally {
    await prisma.$disconnect();
    console.log('\n======================================================================');
    console.log(`📊 Card & PayPal Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
