async function runTests() {
  const baseUrl = 'http://localhost:8085/api/v1';
  console.log(`🧪 Running WayRivo AI 2.0 API Test Suite against ${baseUrl}\n`);

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

  // 1. Health Check
  await test('GET /api/v1/health', async () => {
    const res = await fetch(`${baseUrl}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'UP' || data.database !== 'CONNECTED') {
      throw new Error(`Unexpected body: ${JSON.stringify(data)}`);
    }
  });

  // 2. Destinations List
  let firstDestinationId = '';
  await test('GET /api/v1/destinations', async () => {
    const res = await fetch(`${baseUrl}/destinations`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No destinations returned');
    }
    firstDestinationId = data.data[0].id;
  });

  // 3. Hotels List
  let sampleHotelId = '';
  await test('GET /api/v1/hotels', async () => {
    const res = await fetch(`${baseUrl}/hotels`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No hotels returned');
    }
    sampleHotelId = data.data[0].id;
  });

  // 4. Activities List
  let sampleActivityId = '';
  await test('GET /api/v1/activities', async () => {
    const res = await fetch(`${baseUrl}/activities`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No activities returned');
    }
    sampleActivityId = data.data[0].id;
  });

  // 5. Travel Packages List
  await test('GET /api/v1/packages', async () => {
    const res = await fetch(`${baseUrl}/packages`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No packages returned');
    }
  });

  // 6. User Auth Login
  let travelerToken = '';
  await test('POST /api/v1/auth/login (Traveler)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arjun@example.com',
        password: 'password123',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.data?.token) throw new Error('Token not returned');
    travelerToken = data.data.token;
  });

  // 7. Admin Auth Login
  let adminToken = '';
  await test('POST /api/v1/auth/login (Admin)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@wayrivo.com',
        password: 'password123',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.data?.token) throw new Error('Admin token not returned');
    adminToken = data.data.token;
  });

  // 8. AI Itinerary Planner
  await test('POST /api/v1/ai/plan', async () => {
    const res = await fetch(`${baseUrl}/ai/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Kerala',
        numberOfDays: 3,
        travelersCount: 2,
        budget: 45000,
        travelStyle: 'Romantic & Honeymoon',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.data?.days || data.data.days.length !== 3) {
      throw new Error(`Expected 3 days plan, got ${data.data?.days?.length}`);
    }
  });

  // 9. Create Booking with Server Price Calculation
  let createdBookingId = '';
  await test('POST /api/v1/bookings (Server-side price verification)', async () => {
    const res = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        items: [
          { itemType: 'HOTEL', referenceId: sampleHotelId, quantity: 2 },
          { itemType: 'ACTIVITY', referenceId: sampleActivityId, quantity: 2 },
        ],
        specialRequests: 'High floor, lake facing room please.',
        currency: 'INR',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Status ${res.status}: ${JSON.stringify(err)}`);
    }
    const data = await res.json();
    if (!data.data?.id || !data.data.bookingReference) {
      throw new Error('Booking reference or ID missing');
    }
    // Verify total amount was computed by server, not client
    if (parseFloat(data.data.totalAmount) <= 0) {
      throw new Error('Total amount must be greater than 0');
    }
    createdBookingId = data.data.id;
  });

  // 10. PayPal Order Creation
  let paypalOrderId = '';
  await test('POST /api/v1/payments/create-order', async () => {
    const res = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        bookingId: createdBookingId,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Status ${res.status}: ${JSON.stringify(err)}`);
    }
    const data = await res.json();
    if (!data.data?.orderId) throw new Error('PayPal orderId not returned');
    paypalOrderId = data.data.orderId;
  });

  // 11. PayPal Capture & Escrow Lock (with Idempotency)
  await test('POST /api/v1/payments/capture-order (Idempotent Escrow Lock)', async () => {
    const idempKey = `IDEMP-${Date.now()}`;
    const res = await fetch(`${baseUrl}/payments/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        bookingId: createdBookingId,
        paypalOrderId,
        idempotencyKey: idempKey,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Status ${res.status}: ${JSON.stringify(err)}`);
    }
    const data = await res.json();
    if (data.data?.bookingStatus !== 'ESCROW_HOLD') {
      throw new Error(`Expected bookingStatus ESCROW_HOLD, got ${data.data?.bookingStatus}`);
    }

    // Retest same request to verify idempotency handling
    const retryRes = await fetch(`${baseUrl}/payments/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        bookingId: createdBookingId,
        paypalOrderId,
        idempotencyKey: idempKey,
      }),
    });
    if (!retryRes.ok) throw new Error(`Idempotent retry failed with status ${retryRes.status}`);
  });

  // 12. Admin Stats
  await test('GET /api/v1/admin/stats', async () => {
    const res = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.data?.systemHealth !== 'OPERATIONAL') {
      throw new Error('System health not operational');
    }
  });

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passCount} Passed, ${failCount} Failed`);
  console.log(`========================================\n`);

  if (failCount > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
