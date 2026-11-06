/// <reference types="node" />

/**
 * End-to-End Proposal Delivery & Synchronization Test Suite
 * Verifies that proposals submitted by experts are received by travelers in real time.
 */

const baseUrl = 'http://localhost:8085/api/v1';

function assert(condition: unknown, message: string): asserts condition {
  if (!Boolean(condition)) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runProposalSyncTests() {
  console.log('\n======================================================================');
  console.log('🤝 WayRivo AI: Real-Time Proposal Dispatch & Traveler Sync Test Suite');
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
  let createdTripId = '';
  let submittedProposalId = '';

  // 1. Traveler submits a new bespoke trip request
  await test('Step 1: Traveler creates a trip request', async () => {
    const res = await fetch(`${baseUrl}/trip-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: `Manali & Spiti Valley Expedition ${timestamp}`,
        fromLocation: 'Chandigarh',
        startDate: '2026-12-15',
        endDate: '2026-12-22',
        travelersCount: 2,
        budget: 95000,
        travelStyle: 'Mountain Adventure & Heritage',
        travelType: 'Couple',
        numberOfDays: 7,
        travelerName: 'Anand Kumar',
        specialRequirements: '4x4 heated vehicle with verified high-altitude experienced driver.',
        interests: 'Snow trekking, Monastery visits, Local homestays',
      }),
    });

    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Response success should be true');
    assert(body.data?.id, 'Trip request ID must be returned');
    assert(body.data?.status === 'OPEN', 'Initial status must be OPEN');
    createdTripId = body.data.id;
  });

  // 2. Expert browses open marketplace requests and discovers the new request
  await test('Step 2: Expert marketplace discovers traveler request', async () => {
    const res = await fetch(`${baseUrl}/trip-requests/open?search=${encodeURIComponent('Spiti')}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Open requests response should succeed');
    const found = body.data?.content?.find((r: any) => r.id === createdTripId);
    assert(found !== undefined, 'Expert must find newly submitted trip request in marketplace');
    assert(found.destination.includes('Spiti'), 'Destination must match');
  });

  // 3. Traveler queries their request page before proposals are sent (should have 0 proposals)
  await test('Step 3: Traveler views request page (initial state: 0 proposals)', async () => {
    const res = await fetch(`${baseUrl}/proposals/request/${createdTripId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Response should succeed');
    assert(Array.isArray(body.data), 'Data should be an array');
    assert(body.data.length === 0, 'Should initially have 0 proposals');
  });

  // 4. Expert crafts and submits a proposal for this trip request
  await test('Step 4: Expert submits custom proposal for the traveler', async () => {
    const res = await fetch(`${baseUrl}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripRequestId: createdTripId,
        title: 'High Altitude Spiti Winter Wonderland & Monasteries',
        totalPrice: 88000,
        pricePerPerson: 44000,
        validityDate: '2026-12-05',
        description: 'Bespoke 7-day winter journey with heated homestays, oxygen backup, and private 4x4.',
        itinerary: 'Day 1: Chandigarh to Manali\nDay 2: Atal Tunnel & Kaza\nDay 3: Key Monastery & Kibber\nDay 4: Pin Valley\nDay 5: Tabo & Dhankar\nDay 6: Return to Manali\nDay 7: Departure',
        accommodationDetails: 'Traditional solar-heated luxury homestays & 4-star boutique chalet in Manali',
        transportationDetails: 'Dedicated 4x4 Isuzu D-Max with snow chains and verified mountain chauffeur',
        activities: 'Stargazing at Kibber, monk-guided monastery blessing, traditional Spitian butter tea workshop',
        inclusions: 'All meals, vehicle with unlimited fuel, oxygen support, inner line permits, local guide',
        exclusions: 'Flight tickets to Chandigarh, personal gear',
        cancellationPolicy: '100% refund up to 7 days prior under WayRivo Escrow Guarantee',
        expertName: 'Vikram Singh Rathore',
        organizationName: 'Royal Rajasthan & Himalayan Journeys',
      }),
    });

    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Proposal submission should succeed');
    assert(body.data?.id, 'Proposal must receive generated ID');
    assert(body.data?.status === 'SUBMITTED', 'Status must be SUBMITTED');
    assert(body.data?.totalPrice === 88000, 'Price must match');
    submittedProposalId = body.data.id;
  });

  // 5. Traveler receives the proposal at the same time (real-time sync)
  await test('Step 5: Traveler sync receives the proposal immediately at the same time', async () => {
    const res = await fetch(`${baseUrl}/proposals/request/${createdTripId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Response should succeed');
    assert(Array.isArray(body.data), 'Data should be an array');
    assert(body.data.length === 1, `Traveler must have exactly 1 proposal, received ${body.data.length}`);

    const receivedProposal = body.data[0];
    assert(receivedProposal.id === submittedProposalId, 'Received proposal ID must match expert submission');
    assert(receivedProposal.title.includes('Spiti Winter Wonderland'), 'Proposal title must match');
    assert(receivedProposal.totalPrice === 88000, 'Proposal price must match');
    assert(receivedProposal.expertName === 'Vikram Singh Rathore', 'Expert name must be present');
    assert(receivedProposal.status === 'SUBMITTED', 'Status must be SUBMITTED');
  });

  // 6. Trip request status is automatically updated to PROPOSALS_RECEIVED
  await test('Step 6: Traveler request status automatically advances to PROPOSALS_RECEIVED', async () => {
    const res = await fetch(`${baseUrl}/trip-requests/${createdTripId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.data?.status === 'PROPOSALS_RECEIVED', `Expected status PROPOSALS_RECEIVED, got: ${body.data?.status}`);
  });

  // 7. Traveler selects and accepts the proposal
  await test('Step 7: Traveler accepts proposal and locks escrow', async () => {
    const res = await fetch(`${baseUrl}/proposals/${submittedProposalId}/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Proposal selection should succeed');
    assert(body.data?.status === 'CONFIRMED', 'Booking status must be CONFIRMED');
    assert(body.data?.totalAmount === 88000, 'Booking total amount must match proposal price');

    // Confirm proposal is marked SELECTED in DB
    const propRes = await fetch(`${baseUrl}/proposals/${submittedProposalId}`);
    const propBody: any = await propRes.json();
    assert(propBody.data?.status === 'SELECTED', `Expected proposal status SELECTED, got ${propBody.data?.status}`);
    assert(propBody.data?.escrowStatus === 'HELD', `Expected escrowStatus HELD, got ${propBody.data?.escrowStatus}`);
  });

  console.log('\n======================================================================');
  console.log(`🎉 PROPOSAL SYNC TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runProposalSyncTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

