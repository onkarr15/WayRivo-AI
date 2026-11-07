const API_BASE = 'http://localhost:8085/api/v1';

async function postJson(url: string, body: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data: any = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function patchJson(url: string, body: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  const data: any = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function putJson(url: string, body: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  const data: any = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function getJson(url: string, token?: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data: any = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function deleteJson(url: string, body: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify(body),
  });
  const data: any = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function runProfileAndAccountDeletionTests() {
  console.log('\n======================================================================');
  console.log('👤 WayRivo AI: Edit Profile & Delete Account Verification Suite');
  console.log('Backend Target:', API_BASE);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();

    // -------------------------------------------------------------
    // PART 1: TRAVELLER EDIT PROFILE
    // -------------------------------------------------------------
    const travelerEmail = `traveler.profile.${timestamp}@test.wayrivo.com`;
    const travelerReg = await postJson(`${API_BASE}/auth/register`, {
      name: 'Pooja Hegde',
      email: travelerEmail,
      password: 'Password123!',
      role: 'TRAVELER',
      phone: '+91 98765 11111',
    });
    const travelerToken = travelerReg.data.token;
    assert(!!travelerToken, '1. Traveler registered and authenticated');

    // Update Traveler Profile with Address, Preferences, and Personal Details
    const updateTravelerRes = await patchJson(
      `${API_BASE}/users/profile`,
      {
        name: 'Pooja K. Hegde',
        phone: '+91 98765 22222',
        country: 'India',
        state: 'Karnataka',
        city: 'Bengaluru',
        address: '88 MG Road, Indiranagar',
        postalCode: '560038',
        bio: 'Avid eco-traveler and culture enthusiast.',
        dateOfBirth: '1995-04-12',
        gender: 'Female',
        preferredDestinations: ['Kerala', 'Goa', 'Ladakh'],
        travelInterests: ['Backwaters & Houseboats', 'White Sand Beaches'],
        budgetPreference: 'Luxury',
        preferredCurrency: 'USD',
      },
      travelerToken
    );

    assert(
      updateTravelerRes.data.name === 'Pooja K. Hegde' &&
        updateTravelerRes.data.city === 'Bengaluru' &&
        updateTravelerRes.data.budgetPreference === 'Luxury',
      '2. Traveler profile updated with address, personal, and preference fields'
    );

    // Verify retrieval immediately
    const getTravelerRes = await getJson(`${API_BASE}/users/profile`, travelerToken);
    assert(
      getTravelerRes.data.city === 'Bengaluru' &&
        getTravelerRes.data.address === '88 MG Road, Indiranagar' &&
        getTravelerRes.data.bio === 'Avid eco-traveler and culture enthusiast.',
      '3. GET /users/profile immediately reflects updated traveler information'
    );

    // -------------------------------------------------------------
    // PART 2: TRAVEL EXPERT AGENCY EDIT PROFILE
    // -------------------------------------------------------------
    const expertEmail = `expert.agency.${timestamp}@test.wayrivo.com`;
    const expertReg = await postJson(`${API_BASE}/auth/register`, {
      name: 'Kabir Varma',
      email: expertEmail,
      password: 'Password123!',
      role: 'EXPERT',
      phone: '+91 98765 33333',
    });
    const expertToken = expertReg.data.token;
    assert(!!expertToken, '4. Travel Expert Agency registered and authenticated');

    // Update Agency Profile
    const updateExpertRes = await putJson(
      `${API_BASE}/experts/profile`,
      {
        name: 'Kabir Varma',
        organizationName: 'Varma Royal Expeditions & Treks',
        agencyName: 'Varma Royal Expeditions & Treks',
        description: 'Bespoke high-altitude expeditions and royal palaces in Rajasthan and Ladakh.',
        yearsOfExperience: 11,
        city: 'Jaipur',
        state: 'Rajasthan',
        country: 'India',
        address: 'Palace Road, Civil Lines',
        postalCode: '302006',
        specializations: 'Rajasthan, Ladakh, Desert Camping, Royal Heritage',
        websiteUrl: 'https://varma-expeditions.example.com',
        languages: ['English', 'Hindi', 'French'],
      },
      expertToken
    );

    assert(
      updateExpertRes.data.agencyName === 'Varma Royal Expeditions & Treks' &&
        updateExpertRes.data.yearsOfExperience === 11,
      '5. Travel Expert Agency profile updated via PUT /experts/profile in Supabase'
    );

    const getExpertRes = await getJson(`${API_BASE}/experts/profile`, expertToken);
    assert(
      getExpertRes.data.agencyName === 'Varma Royal Expeditions & Treks' &&
        getExpertRes.data.city === 'Jaipur' &&
        getExpertRes.data.verificationStatus === 'VERIFIED',
      '6. GET /experts/profile returns verified agency details and credentials'
    );

    // -------------------------------------------------------------
    // PART 3: DELETE ACCOUNT SECURITY & CONFIRMATION CHECKS
    // -------------------------------------------------------------
    // Test: Missing or incorrect confirmation string (Must be 'DELETE')
    let invalidConfirmBlocked = false;
    try {
      await deleteJson(
        `${API_BASE}/users/account`,
        { confirmation: 'no', password: 'Password123!' },
        travelerToken
      );
    } catch (err: any) {
      if (err.status === 400 && err.message.includes('DELETE')) {
        invalidConfirmBlocked = true;
      }
    }
    assert(invalidConfirmBlocked, "7. Security Check: Deletion rejected when confirmation is not 'DELETE' (HTTP 400)");

    // Test: Wrong password reauthentication
    let wrongPassBlocked = false;
    try {
      await deleteJson(
        `${API_BASE}/users/account`,
        { confirmation: 'DELETE', password: 'WrongPassword999!' },
        travelerToken
      );
    } catch (err: any) {
      if (err.status === 401 && err.message.includes('password')) {
        wrongPassBlocked = true;
      }
    }
    assert(wrongPassBlocked, '8. Security Check: Incorrect password reauthentication rejected (HTTP 401)');

    // -------------------------------------------------------------
    // PART 4: ACTIVE BOOKING DELETION BLOCK
    // -------------------------------------------------------------
    // Create an active booking for Traveler
    const destRes = await getJson(`${API_BASE}/destinations`);
    const destination = destRes.data[0];

    const itinRes = await postJson(
      `${API_BASE}/itineraries`,
      {
        destinationId: destination.id,
        title: 'Pending Journey Before Deletion Test',
        travelStyle: 'NATURE',
        startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 9).toISOString(),
        travelersCount: 2,
        roomsCount: 1,
        adultsCount: 2,
        childrenCount: 0,
        itineraryDays: [
          {
            dayNumber: 1,
            title: 'Nature Walk',
            description: 'Trail walk',
            estimatedDayCost: 5000,
          },
        ],
      },
      travelerToken
    );

    const bookingRes = await postJson(
      `${API_BASE}/bookings`,
      {
        itineraryId: itinRes.data.id,
        specialRequests: 'Balcony requested',
      },
      travelerToken
    );
    const booking = bookingRes.data;
    assert(!!booking.id, `9. Active booking created for deletion obstacle test: ${booking.bookingReference}`);

    // Attempt deletion while booking is pending/active
    let activeBookingBlocked = false;
    try {
      await deleteJson(
        `${API_BASE}/users/account`,
        { confirmation: 'DELETE', password: 'Password123!' },
        travelerToken
      );
    } catch (err: any) {
      if (err.status === 400 && err.message.includes('active or pending bookings')) {
        activeBookingBlocked = true;
      }
    }
    assert(activeBookingBlocked, '10. Security Check: Account deletion blocked when active bookings exist (HTTP 400)');

    // Cancel the booking in DB so deletion becomes permitted
    const { prisma } = await import('./src/config/db.js');
    const { BookingStatus } = await import('@prisma/client');
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED },
    });

    // -------------------------------------------------------------
    // PART 5: SUCCESSFUL DELETION & FINANCIAL RECORD RETENTION
    // -------------------------------------------------------------
    const deleteTravelerRes = await deleteJson(
      `${API_BASE}/users/account`,
      { confirmation: 'DELETE', password: 'Password123!', reason: 'Relocating abroad' },
      travelerToken
    );
    assert(
      deleteTravelerRes.success === true &&
        deleteTravelerRes.message.includes('successfully deleted'),
      '11. Traveler account successfully deleted with proper reauthentication'
    );

    // Test: Session revocation (Token is now rejected)
    let tokenRevoked = false;
    try {
      await getJson(`${API_BASE}/users/profile`, travelerToken);
    } catch (err: any) {
      if (err.status === 401 || err.status === 404) {
        tokenRevoked = true;
      }
    }
    assert(tokenRevoked, '12. Session Revocation: Deleted account token rejected on protected routes (HTTP 401)');

    // -------------------------------------------------------------
    // PART 6: TRAVEL EXPERT AGENCY SUCCESSFUL DELETION
    // -------------------------------------------------------------
    const deleteExpertRes = await deleteJson(
      `${API_BASE}/account`,
      { confirmation: 'DELETE', password: 'Password123!', reason: 'Agency closing' },
      expertToken
    );
    assert(
      deleteExpertRes.success === true &&
        deleteExpertRes.message.includes('successfully deleted'),
      '13. Travel Expert Agency account successfully deleted via root /account alias'
    );

    let expertTokenRevoked = false;
    try {
      await getJson(`${API_BASE}/users/profile`, expertToken);
    } catch (err: any) {
      if (err.status === 401 || err.status === 404) {
        expertTokenRevoked = true;
      }
    }
    assert(expertTokenRevoked, '14. Expert Session Revocation: Deleted agency token rejected on protected routes (HTTP 401)');

  } catch (err: any) {
    console.error('Test failed with error:', err.data || err.message);
    failed++;
  }

  console.log('\n======================================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

runProfileAndAccountDeletionTests();
