async function testAgentWorkflow() {
  const baseUrl = 'http://localhost:8085/api/v1';
  console.log('====================================================');
  console.log('🤖 WayRivo AI 2.0 Phase 6 Agent Workflow Test Suite');
  console.log(`Target: ${baseUrl}`);
  console.log('====================================================\n');

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

  // 1. Get Suggested Prompts
  await test('1. GET /api/v1/agent/suggested-prompts', async () => {
    const res = await fetch(`${baseUrl}/agent/suggested-prompts`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length < 3) {
      throw new Error(`Expected at least 3 suggested prompts, got: ${data.data?.length}`);
    }
  });

  // 2. Login traveler to obtain JWT token
  let token = '';
  await test('2. Traveler Authentication for Agent Session', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arjun@example.com',
        password: 'password123',
      }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const data = await res.json();
    token = data.token || data.data?.token;
    if (!token) throw new Error('Token not returned');
  });

  // 3. User request to AI Travel Agent: "Plan a 5-day Goa trip for two people under ₹25,000..."
  let conversationId = '';
  let assistantMetadata: any = null;
  await test('3. POST /api/v1/agent/chat (Example User Request & Tool Orchestration)', async () => {
    const res = await fetch(`${baseUrl}/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: 'Plan a 5-day Goa trip for two people under ₹25,000. I prefer beaches, adventure activities and good hotels.',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Chat error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const result = data.data;

    if (!result?.conversationId) throw new Error('Missing conversationId in reply');
    if (!result?.reply || result.reply.length < 50) throw new Error('Agent reply is empty or too brief');

    conversationId = result.conversationId;
    assistantMetadata = result.metadata;

    // Verify Destination extracted and retrieved from DB
    if (!Array.isArray(assistantMetadata.destinations) || assistantMetadata.destinations.length === 0) {
      throw new Error('No destination records returned in metadata');
    }
    const dest = assistantMetadata.destinations[0];
    if (dest.name !== 'Goa') throw new Error(`Expected destination Goa, got: ${dest.name}`);

    // Verify Hotel inventory extracted from DB with availableRooms
    if (!Array.isArray(assistantMetadata.hotels) || assistantMetadata.hotels.length === 0) {
      throw new Error('No hotel records returned in metadata');
    }
    const hotel = assistantMetadata.hotels[0];
    if (typeof hotel.pricePerNight !== 'number' || typeof hotel.availableRooms !== 'number') {
      throw new Error('Hotel missing real price or room availability');
    }

    // Verify Activity inventory extracted from DB with availableSlots
    if (!Array.isArray(assistantMetadata.activities) || assistantMetadata.activities.length === 0) {
      throw new Error('No activity records returned in metadata');
    }
    const act = assistantMetadata.activities[0];
    if (typeof act.pricePerPerson !== 'number' || typeof act.availableSlots !== 'number') {
      throw new Error('Activity missing real price or slot availability');
    }

    // Verify Budget Calculation
    if (!assistantMetadata.budgetAnalysis || typeof assistantMetadata.budgetAnalysis.totalCalculatedCost !== 'number') {
      throw new Error('Budget calculation missing in metadata');
    }
    if (!assistantMetadata.budgetAnalysis.breakdown?.accommodation) {
      throw new Error('Accommodation breakdown missing in budget analysis');
    }

    // Verify Itinerary generation
    if (!assistantMetadata.itinerary || !Array.isArray(assistantMetadata.itinerary.days) || assistantMetadata.itinerary.days.length !== 5) {
      throw new Error(`Expected 5-day itinerary, got: ${assistantMetadata.itinerary?.days?.length}`);
    }

    // Verify tools executed
    if (!Array.isArray(assistantMetadata.toolsExecuted) || assistantMetadata.toolsExecuted.length < 4) {
      throw new Error(`Expected at least 4 backend tools executed, got: ${assistantMetadata.toolsExecuted?.length}`);
    }
  });

  // 4. Save Itinerary to PostgreSQL
  let savedItineraryId = '';
  await test('4. POST /api/v1/agent/save-itinerary (Persist Itinerary to DB)', async () => {
    const res = await fetch(`${baseUrl}/agent/save-itinerary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Curated 5-Day Goa Beach & Water Sports Getaway',
        destinationName: 'Goa',
        numberOfDays: 5,
        travelersCount: 2,
        budget: 25000,
        travelStyle: 'Coastal Adventure',
        days: assistantMetadata.itinerary.days,
      }),
    });

    if (!res.ok) throw new Error(`Save itinerary failed: ${res.status}`);
    const data = await res.json();
    if (!data.data?.itineraryId) throw new Error('itineraryId not returned');
    savedItineraryId = data.data.itineraryId;
  });

  // 5. Create Booking Proposal (Pending Payment state)
  let bookingReference = '';
  await test('5. POST /api/v1/agent/create-proposal (Draft Proposal Generation)', async () => {
    const hotel = assistantMetadata.hotels[0];
    const activity = assistantMetadata.activities[0];

    const res = await fetch(`${baseUrl}/agent/create-proposal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        itineraryId: savedItineraryId,
        hotelId: hotel?.id,
        activityIds: activity ? [activity.id] : [],
        requestedNights: 4,
        travelersCount: 2,
        specialRequests: 'High-floor quiet room preferred with ocean view.',
      }),
    });

    if (!res.ok) throw new Error(`Create proposal failed: ${res.status}`);
    const data = await res.json();
    const prop = data.data;

    if (!prop.bookingReference || !prop.bookingReference.startsWith('WR-2026-')) {
      throw new Error(`Invalid booking reference format: ${prop.bookingReference}`);
    }
    if (prop.status !== 'PENDING_PAYMENT') {
      throw new Error(`Safety violation: proposal status must be PENDING_PAYMENT, got: ${prop.status}`);
    }
    if (!Array.isArray(prop.items) || prop.items.length === 0) {
      throw new Error('Booking proposal items missing');
    }
    bookingReference = prop.bookingReference;
  });

  // 6. User Conversations History
  await test('6. GET /api/v1/agent/conversations (Session History in PostgreSQL)', async () => {
    const res = await fetch(`${baseUrl}/agent/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Fetch conversations failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No user conversations returned');
    }
    const found = data.data.find((c: any) => c.id === conversationId);
    if (!found) throw new Error('Recent conversation not found in history');
  });

  // 7. Get Conversation Detail by ID
  await test('7. GET /api/v1/agent/conversations/:id (Dialogue & Message Retrieval)', async () => {
    const res = await fetch(`${baseUrl}/agent/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Fetch conversation detail failed: ${res.status}`);
    const data = await res.json();
    const conv = data.data;

    if (!Array.isArray(conv.messages) || conv.messages.length < 2) {
      throw new Error(`Expected at least 2 messages in dialogue, got: ${conv.messages?.length}`);
    }

    const userMsg = conv.messages.find((m: any) => m.sender === 'USER');
    const assistantMsg = conv.messages.find((m: any) => m.sender === 'ASSISTANT');

    if (!userMsg || !assistantMsg) {
      throw new Error('Conversation missing user or assistant message record');
    }

    if (!assistantMsg.metadata?.itinerary) {
      throw new Error('Assistant message metadata does not contain persisted itinerary');
    }
  });

  console.log('\n====================================================');
  console.log(`📊 AGENT TEST RESULTS: ${passCount} Passed, ${failCount} Failed`);
  console.log('====================================================\n');

  if (failCount > 0) process.exit(1);
}

testAgentWorkflow().catch((err) => {
  console.error('Fatal agent test error:', err);
  process.exit(1);
});

