/// <reference types="node" />
import { prisma } from './src/config/db';
import { Prisma } from '@prisma/client';

async function testBudgetIntelligence() {
  const baseUrl = 'http://localhost:8085/api/v1';
  console.log('===================================================================');
  console.log('🧮 WayRivo AI 2.0 Phase 7 Budget Intelligence & Itinerary Test Suite');
  console.log(`Target: ${baseUrl}`);
  console.log('===================================================================\n');

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

  // 1. Authenticate user
  let token = '';
  let userId = '';
  await test('1. Traveler Authentication', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arjun@example.com',
        password: 'password123',
      }),
    });
    if (!res.ok) throw new Error(`Auth failed with status ${res.status}`);
    const data: any = await res.json();
    token = data.token || data.data?.token;
    userId = data.data?.user?.id || data.user?.id;
    if (!token) throw new Error('Token was not returned');
  });

  // 2. Fetch Goa destination and real inventory for testing
  let destination: any = null;
  let hotels: any[] = [];
  let activities: any[] = [];
  await test('2. Verify Database Inventory for Goa', async () => {
    const destRes = await fetch(`${baseUrl}/destinations?search=Goa`);
    const destData: any = await destRes.json();
    const dests = destData.data?.destinations || destData.data || [];
    destination = dests.find((d: any) => d.name.toLowerCase().includes('goa')) || dests[0];
    if (!destination) throw new Error('Goa destination not found in database');

    const hotelRes = await fetch(`${baseUrl}/hotels?destinationId=${destination.id}`);
    const hotelData: any = await hotelRes.json();
    hotels = hotelData.data?.hotels || hotelData.data || [];
    if (hotels.length < 2) throw new Error(`Expected at least 2 hotels for Goa, got: ${hotels.length}`);

    const actRes = await fetch(`${baseUrl}/activities?destinationId=${destination.id}`);
    const actData: any = await actRes.json();
    activities = actData.data?.activities || actData.data || [];
    if (activities.length === 0) throw new Error('No activities found for destination');
  });

  // 3. Generate Complete Day-Wise Itinerary (Phase 7 Spec)
  let generatedItinerary: any = null;
  await test('3. POST /api/v1/itineraries/generate (Complete Day-Wise Itinerary)', async () => {
    const res = await fetch(`${baseUrl}/itineraries/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        destinationId: destination.id,
        numberOfDays: 5,
        startDate: '2026-12-01',
        travelersCount: 2,
        interests: ['Beaches', 'Adventure', 'Culture'],
        budget: 35000,
        travelStyle: 'COMFORT',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Itinerary generation failed: ${res.status} - ${errText}`);
    }

    const data: any = await res.json();
    generatedItinerary = data.data;

    // Verify day-wise structure
    if (!Array.isArray(generatedItinerary.days) || generatedItinerary.days.length !== 5) {
      throw new Error(`Expected 5 days in itinerary, got: ${generatedItinerary.days?.length}`);
    }

    const firstDay = generatedItinerary.days[0];
    if (!firstDay.date) throw new Error('Day missing date');
    if (!firstDay.morning || !firstDay.afternoon || !firstDay.evening) {
      throw new Error('Day missing morning, afternoon, or evening activities');
    }
    if (!firstDay.suggestedMealBreaks?.lunch || !firstDay.suggestedMealBreaks?.dinner) {
      throw new Error('Day missing suggested meal breaks');
    }
    if (!firstDay.practicalTravelNotes || firstDay.practicalTravelNotes.length === 0) {
      throw new Error('Day missing practical travel notes');
    }
    if (!firstDay.morning.travelTimeEstimate) {
      throw new Error('Day missing travel time estimates');
    }

    // Verify budget breakdown structure
    const budget = generatedItinerary.budget;
    if (!budget) throw new Error('Itinerary missing budget calculation');
    if (
      budget.accommodation?.amount === undefined ||
      budget.activities?.amount === undefined ||
      budget.taxesAndFees?.amount === undefined
    ) {
      throw new Error('Budget missing itemized components');
    }
  });

  // 4. Independent Budget Calculation (Phase 7 Spec)
  let calculatedBudget: any = null;
  await test('4. POST /api/v1/itineraries/calculate-budget (Independent Math Verification)', async () => {
    const testHotel = hotels[0];
    const testActivities = activities.slice(0, 3);
    const travelersCount = 2;
    const numberOfDays = 5;
    const nights = Math.max(1, numberOfDays - 1); // 4 nights
    const rooms = Math.ceil(travelersCount / 2); // 1 room
    const userBudget = 60000;

    const res = await fetch(`${baseUrl}/itineraries/calculate-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationName: destination.name,
        numberOfDays,
        travelersCount,
        userBudget,
        selectedHotel: testHotel,
        selectedActivities: testActivities,
        travelStyle: 'COMFORT',
        transportMode: 'AC_SEDAN',
      }),
    });

    if (!res.ok) throw new Error(`Budget calculation failed: ${res.status}`);
    const data: any = await res.json();
    calculatedBudget = data.data;

    // Independent manual math checks
    const expectedHotelCost = rooms * nights * Number(testHotel.pricePerNight);
    if (calculatedBudget.accommodation.amount !== expectedHotelCost) {
      throw new Error(`Accommodation mismatch: expected ${expectedHotelCost}, got ${calculatedBudget.accommodation.amount}`);
    }

    let expectedActCost = 0;
    for (const act of testActivities) {
      expectedActCost += Number(act.pricePerPerson || act.price) * travelersCount;
    }
    if (calculatedBudget.activities.amount !== expectedActCost) {
      throw new Error(`Activities mismatch: expected ${expectedActCost}, got ${calculatedBudget.activities.amount}`);
    }

    const subtotal =
      expectedHotelCost +
      expectedActCost +
      calculatedBudget.transportation.amount +
      calculatedBudget.otherServices.amount;
    const expectedTax = Math.round(subtotal * 0.05);
    if (calculatedBudget.taxesAndFees.amount !== expectedTax) {
      throw new Error(`Taxes (5% GST) mismatch: expected ${expectedTax}, got ${calculatedBudget.taxesAndFees.amount}`);
    }

    const expectedTotal = subtotal + calculatedBudget.mealsAndDining.amount + expectedTax;
    if (calculatedBudget.totalEstimatedExpenditure !== expectedTotal) {
      throw new Error(`Total expenditure mismatch: expected ${expectedTotal}, got ${calculatedBudget.totalEstimatedExpenditure}`);
    }

    const expectedRemaining = userBudget - expectedTotal;
    if (calculatedBudget.remainingBudget !== expectedRemaining) {
      throw new Error(`Remaining budget mismatch: expected ${expectedRemaining}, got ${calculatedBudget.remainingBudget}`);
    }
  });

  // 5. Budget Intelligence & Optimization (Phase 7 Spec: Identify expensive components, suggest alternatives, compare budgets)
  let optimizationResult: any = null;
  await test('5. POST /api/v1/itineraries/optimize-budget (Budget Exceeded Intelligence)', async () => {
    // Pick the most expensive hotel (Leela at ₹18,000/night)
    const sortedHotels = [...hotels].sort((a, b) => Number(b.pricePerNight) - Number(a.pricePerNight));
    const expensiveHotel = sortedHotels[0];
    const userStrictBudget = 45000; // Low budget compared to 4 nights * 18,000 = 72,000 + activities

    const res = await fetch(`${baseUrl}/itineraries/optimize-budget`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        destinationId: destination.id,
        numberOfDays: 5,
        travelersCount: 2,
        userBudget: userStrictBudget,
        currentHotelId: expensiveHotel.id,
        currentActivityIds: activities.map((a: any) => a.id),
        travelStyle: 'COMFORT',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Optimization failed: ${res.status} - ${errText}`);
    }

    const data: any = await res.json();
    optimizationResult = data.data;

    // Check Phase 7 Requirements
    // 1. Identify expensive components
    if (!Array.isArray(optimizationResult.expensiveComponents) || optimizationResult.expensiveComponents.length === 0) {
      throw new Error('Expected expensive components to be identified');
    }

    // 2. Suggest alternative hotel from real DB inventory
    const suggestedHotel = optimizationResult.suggestedAlternatives?.hotel;
    if (!suggestedHotel || !suggestedHotel.suggested) {
      throw new Error('Expected alternative hotel suggestions from database');
    }
    if (suggestedHotel.suggested.nightlyRate >= suggestedHotel.original.nightlyRate) {
      throw new Error('Suggested hotel must be cheaper than original');
    }

    // 3. Recalculate itinerary / Compare budgets
    if (!optimizationResult.recalculatedBudget || !optimizationResult.originalEstimate) {
      throw new Error('Expected both original and recalculated budget');
    }

    // 4. Explain savings
    if (!optimizationResult.explanation || typeof optimizationResult.explanation !== 'string') {
      throw new Error('Expected natural language explanation of savings');
    }

    if (optimizationResult.totalSavings <= 0) {
      throw new Error(`Expected positive total savings, got ${optimizationResult.totalSavings}`);
    }

    if (optimizationResult.optimizedEstimate >= optimizationResult.originalEstimate) {
      throw new Error('Optimized expenditure must be lower than original expenditure');
    }
  });

  // 6. Save Itinerary to User Profile
  let savedItineraryId = '';
  await test('6. POST /api/v1/itineraries (Save Complete Itinerary)', async () => {
    const res = await fetch(`${baseUrl}/itineraries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        destinationId: destination.id,
        title: '5-Day Goa Sunshine & Water Sports Trip',
        travelStyle: 'COMFORT',
        startDate: '2026-12-01T00:00:00.000Z',
        endDate: '2026-12-06T00:00:00.000Z',
        numberOfDays: 5,
        travelersCount: 2,
        budget: 35000,
        totalEstimatedCost: generatedItinerary.budget.totalEstimatedExpenditure,
        days: generatedItinerary.days.map((d: any) => ({
          dayNumber: d.dayNumber,
          date: new Date(d.date).toISOString(),
          title: d.title,
          description: `${d.morning.activityTitle} | ${d.afternoon.activityTitle} | ${d.evening.activityTitle}`,
          morning: d.morning,
          afternoon: d.afternoon,
          evening: d.evening,
          mealsIncluded: ['Breakfast', 'Lunch'],
          estimatedDayCost: d.estimatedDayCost || 3000,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Save itinerary failed: ${res.status} - ${err}`);
    }

    const data: any = await res.json();
    savedItineraryId = data.data?.id;
    if (!savedItineraryId) throw new Error('Itinerary ID not returned after save');
  });

  // 7. Update Itinerary with Safety Check (Unconfirmed Itinerary - Should Succeed)
  await test('7. PUT /api/v1/itineraries/:id (Update Editable Activities on Unconfirmed Itinerary)', async () => {
    const res = await fetch(`${baseUrl}/itineraries/${savedItineraryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: '5-Day Goa Relaxed Beach Vacation (Customized)',
        budget: 32000,
        totalEstimatedCost: 29500,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Update itinerary failed: ${res.status} - ${err}`);
    }
    const data: any = await res.json();
    if (data.data?.title !== '5-Day Goa Relaxed Beach Vacation (Customized)') {
      throw new Error('Title was not updated');
    }
  });

  // 8. AI Safety Invariant Verification: Prevent modifying Itinerary tied to Confirmed/Escrow Booking
  await test('8. AI Safety Invariant: Lock Modification of Confirmed Bookings (403 Forbidden)', async () => {
    // Directly link a confirmed booking to this itinerary in the database for testing safety lock
    const lockedBooking = await prisma.booking.create({
      data: {
        bookingReference: `TEST-LOCK-${Date.now()}`,
        userId,
        itineraryId: savedItineraryId,
        totalAmount: new Prisma.Decimal(29500),
        currency: 'INR',
        status: 'CONFIRMED',
      },
    });

    try {
      // Attempt to modify the itinerary
      const res = await fetch(`${baseUrl}/itineraries/${savedItineraryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized Modification Attempt',
          budget: 10000,
        }),
      });

      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for confirmed booking modification, got ${res.status}`);
      }
      const data: any = await res.json();
      const errMsg = data.error || data.message || '';
      if (!errMsg.includes('Modification Blocked')) {
        throw new Error(`Expected 'Modification Blocked' error message, got: ${errMsg}`);
      }
    } finally {
      // Clean up the test booking so database remains clean
      await prisma.booking.delete({ where: { id: lockedBooking.id } });
    }
  });

  console.log('\n===================================================================');
  console.log(`📊 Phase 7 Test Summary: ${passCount} Passed, ${failCount} Failed`);
  console.log('===================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

testBudgetIntelligence()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
