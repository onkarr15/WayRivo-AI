async function runComprehensiveVerification() {
  const baseUrl = 'http://localhost:8085/api/v1';
  console.log(`=======================================================`);
  console.log(`🔍 WayRivo AI 2.0 Comprehensive Phase 1-5 Verification`);
  console.log(`Target: ${baseUrl}`);
  console.log(`=======================================================\n`);

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

  // --- SECTION 1: SYSTEM HEALTH ---
  await test('1. GET /api/v1/health (System and DB Check)', async () => {
    const res = await fetch(`${baseUrl}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (data.status !== 'UP' || data.database !== 'CONNECTED') {
      throw new Error(`Health status invalid: ${JSON.stringify(data)}`);
    }
  });

  // --- SECTION 2: AUTHENTICATION & SECURITY (PHASE 4) ---
  const userTimestamp = Date.now();
  const testEmail = `verify_user_${userTimestamp}@example.com`;
  let travelerToken = '';
  let verificationToken = '';

  await test('2. POST /api/v1/auth/register (New User & Session Cookie)', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
        name: 'Verification Traveler',
        phone: '+91 98765 43210',
        role: 'USER',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!data.data?.token) throw new Error('Token missing from registration');
    travelerToken = data.data.token;
    verificationToken = data.data.verificationToken;
    const cookie = res.headers.get('set-cookie');
    if (!cookie || !cookie.includes('wayrivo_token')) {
      throw new Error('Cookie wayrivo_token not set on registration');
    }
  });

  await test('3. POST /api/v1/auth/verify-email (Email Verification)', async () => {
    const res = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!data.data?.user?.isEmailVerified) throw new Error('isEmailVerified was not true');
  });

  await test('4. GET /api/v1/users/profile (User Profile Details)', async () => {
    const res = await fetch(`${baseUrl}/users/profile`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (data.data?.email !== testEmail) throw new Error(`Email mismatch in profile: ${data.data?.email}`);
  });

  await test('5. PATCH /api/v1/users/profile (Travel Preferences Update)', async () => {
    const res = await fetch(`${baseUrl}/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        preferredDestinations: ['Goa', 'Kerala'],
        travelInterests: ['Beaches', 'Water Sports'],
        budgetPreference: 'Moderate',
        preferredCurrency: 'INR',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (data.data?.budgetPreference !== 'Moderate' || data.data?.preferredDestinations?.length !== 2) {
      throw new Error(`Profile preferences not updated correctly: ${JSON.stringify(data)}`);
    }
  });

  let adminToken = '';
  await test('6. POST /api/v1/auth/login (Admin Login)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@wayrivo.com',
        password: 'password123',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    adminToken = data.token || data.data?.token;
    if (!adminToken) throw new Error('Admin token not returned');
  });

  // --- SECTION 3: RBAC AUTHORIZATION GUARDS ---
  await test('7. RBAC Security Check: Admin Endpoints Block Traveler (403 Forbidden)', async () => {
    const travelerHeaders = { Authorization: `Bearer ${travelerToken}`, 'Content-Type': 'application/json' };
    
    // Check admin stats
    const statsRes = await fetch(`${baseUrl}/admin/stats`, { headers: travelerHeaders });
    if (statsRes.status !== 403) throw new Error(`admin/stats expected 403, got ${statsRes.status}`);

    // Check admin inventory
    const invRes = await fetch(`${baseUrl}/admin/inventory`, { headers: travelerHeaders });
    if (invRes.status !== 403) throw new Error(`admin/inventory expected 403, got ${invRes.status}`);

    // Check hotel creation
    const hotelRes = await fetch(`${baseUrl}/hotels`, {
      method: 'POST',
      headers: travelerHeaders,
      body: JSON.stringify({ name: 'Unauthorized Hotel' }),
    });
    if (hotelRes.status !== 403) throw new Error(`POST /hotels expected 403, got ${hotelRes.status}`);

    // Check package creation
    const pkgRes = await fetch(`${baseUrl}/packages`, {
      method: 'POST',
      headers: travelerHeaders,
      body: JSON.stringify({ title: 'Unauthorized Package' }),
    });
    if (pkgRes.status !== 403) throw new Error(`POST /packages expected 403, got ${pkgRes.status}`);
  });

  // --- SECTION 4: MARKETPLACE PUBLIC EXPLORATION & FILTERING (PHASE 5) ---
  let keralaId = '';
  await test('8. GET /api/v1/destinations (Marketplace Listings & State Filter)', async () => {
    const res = await fetch(`${baseUrl}/destinations?state=Kerala`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No Kerala destinations found');
    const kerala = data.data.find((d: any) => d.slug === 'kerala');
    if (!kerala) throw new Error('Kerala not found in destinations');
    keralaId = kerala.id;
  });

  await test('9. GET /api/v1/destinations/slug/kerala (Slug-based deep-dive)', async () => {
    const res = await fetch(`${baseUrl}/destinations/slug/kerala`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    const dest = data.data;
    if (dest.name !== 'Kerala') throw new Error('Destination name mismatch');
    if (!Array.isArray(dest.popularAttractions) || dest.popularAttractions.length === 0) {
      throw new Error('Kerala popularAttractions missing');
    }
    if (!Array.isArray(dest.hotels) || dest.hotels.length === 0) {
      throw new Error('Kerala hotels relation empty');
    }
    if (!Array.isArray(dest.activities) || dest.activities.length === 0) {
      throw new Error('Kerala activities relation empty');
    }
    if (!Array.isArray(dest.packages) || dest.packages.length === 0) {
      throw new Error('Kerala packages relation empty');
    }
  });

  await test('10. GET /api/v1/destinations/:id (ID-based deep-dive with slug fallback)', async () => {
    const res = await fetch(`${baseUrl}/destinations/${keralaId}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (data.data?.name !== 'Kerala') throw new Error('Failed to resolve by ID');
  });

  await test('11. GET /api/v1/hotels (Hotels Filter by Stars & Destination)', async () => {
    const res = await fetch(`${baseUrl}/hotels?destinationId=${keralaId}&minStars=4&sortBy=price_asc`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No hotels found');
    for (const h of data.data) {
      if (h.stars < 4) throw new Error(`Hotel ${h.name} has stars ${h.stars} < 4`);
      if (h.destinationId !== keralaId) throw new Error(`Hotel ${h.name} has wrong destination`);
    }
  });

  await test('12. GET /api/v1/activities (Activities Filter by Category)', async () => {
    const res = await fetch(`${baseUrl}/activities?category=Water%20sports`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No water sports activities found');
    for (const a of data.data) {
      if (a.category !== 'Water sports') throw new Error(`Activity ${a.title} category mismatch: ${a.category}`);
    }
  });

  await test('13. GET /api/v1/packages (Packages Filter by isRecommended)', async () => {
    const res = await fetch(`${baseUrl}/packages?isRecommended=true`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No recommended packages found');
    for (const p of data.data) {
      if (!p.isRecommended) throw new Error(`Package ${p.title} is not recommended`);
    }
  });

  // --- SECTION 5: FULL ADMIN CUD LIFECYCLE (PHASE 5) ---
  let testHotelId = '';
  await test('14. Admin Hotel CUD Lifecycle (Create -> Read -> Update -> Delete)', async () => {
    const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    // 1. Create
    const createRes = await fetch(`${baseUrl}/hotels`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        destinationId: keralaId,
        name: `Emerald Cloud Boutique Resort ${userTimestamp}`,
        city: 'Munnar',
        stars: 5,
        pricePerNight: 9800,
        currency: 'INR',
        amenities: ['Infinity Pool', 'Plantation View', 'Spa'],
        imageUrls: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
        totalRooms: 12,
        availableRooms: 8,
      }),
    });
    if (!createRes.ok) throw new Error(`Create hotel failed: ${createRes.status}`);
    const created: any = await createRes.json();
    testHotelId = created.data.id;

    // 2. Read
    const getRes = await fetch(`${baseUrl}/hotels/${testHotelId}`);
    if (!getRes.ok) throw new Error(`Get hotel failed: ${getRes.status}`);
    const fetched: any = await getRes.json();
    if (fetched.data?.name !== `Emerald Cloud Boutique Resort ${userTimestamp}`) {
      throw new Error('Hotel name mismatch');
    }

    // 3. Update
    const updateRes = await fetch(`${baseUrl}/hotels/${testHotelId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        pricePerNight: 10500,
        availableRooms: 6,
      }),
    });
    if (!updateRes.ok) throw new Error(`Update hotel failed: ${updateRes.status}`);

    // 4. Delete (Soft-delete)
    const delRes = await fetch(`${baseUrl}/hotels/${testHotelId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    if (!delRes.ok) throw new Error(`Delete hotel failed: ${delRes.status}`);
  });

  let testActivityId = '';
  await test('15. Admin Activity CUD Lifecycle (Create -> Read -> Update -> Delete)', async () => {
    const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    // 1. Create
    const createRes = await fetch(`${baseUrl}/activities`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        destinationId: keralaId,
        title: `Private Sunrise Shikara Cruise ${userTimestamp}`,
        category: 'Water sports',
        durationHours: 3,
        pricePerPerson: 1800,
        location: 'Alleppey Backwaters',
        difficultyLevel: 'Easy',
        maxSlots: 10,
        availableSlots: 6,
        includedItems: ['Mineral Water', 'Traditional Breakfast'],
        imageUrls: ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800'],
      }),
    });
    if (!createRes.ok) throw new Error(`Create activity failed: ${createRes.status}`);
    const created: any = await createRes.json();
    testActivityId = created.data.id;

    // 2. Read
    const getRes = await fetch(`${baseUrl}/activities/${testActivityId}`);
    if (!getRes.ok) throw new Error(`Get activity failed: ${getRes.status}`);

    // 3. Update
    const updateRes = await fetch(`${baseUrl}/activities/${testActivityId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        pricePerPerson: 2200,
        availableSlots: 4,
      }),
    });
    if (!updateRes.ok) throw new Error(`Update activity failed: ${updateRes.status}`);

    // 4. Delete
    const delRes = await fetch(`${baseUrl}/activities/${testActivityId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    if (!delRes.ok) throw new Error(`Delete activity failed: ${delRes.status}`);
  });

  let testPackageId = '';
  await test('16. Admin Travel Package CUD Lifecycle (Create -> Read -> Update -> Delete)', async () => {
    const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    // 1. Create
    const createRes = await fetch(`${baseUrl}/packages`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        destinationId: keralaId,
        title: `Royal Alleppey & Munnar Discovery ${userTimestamp}`,
        description: 'Complete 5-day tea estate and backwater escape.',
        durationDays: 5,
        totalPrice: 42000,
        pricePerPerson: 21000,
        inclusions: ['4-Star Stay', 'All Meals', 'Airport Transfers'],
        exclusions: ['Flight Tickets'],
        highlights: ['Tea Museum Tour', 'Houseboat Overnight', 'Kathakali Show'],
        cancellationPolicy: 'Full refund 10 days before departure.',
        isRecommended: true,
        availableSeats: 10,
        expertName: 'Ramesh Nair',
        organizationName: 'Gods Own Expeditions',
        expertRating: 4.9,
        expertReviews: 24,
      }),
    });
    if (!createRes.ok) throw new Error(`Create package failed: ${createRes.status}`);
    const created: any = await createRes.json();
    testPackageId = created.data.id;

    // 2. Read
    const getRes = await fetch(`${baseUrl}/packages/${testPackageId}`);
    if (!getRes.ok) throw new Error(`Get package failed: ${getRes.status}`);

    // 3. Update
    const updateRes = await fetch(`${baseUrl}/packages/${testPackageId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        totalPrice: 45000,
        availableSeats: 8,
      }),
    });
    if (!updateRes.ok) throw new Error(`Update package failed: ${updateRes.status}`);

    // 4. Delete
    const delRes = await fetch(`${baseUrl}/packages/${testPackageId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    if (!delRes.ok) throw new Error(`Delete package failed: ${delRes.status}`);
  });

  // --- SECTION 6: ADMIN INVENTORY & LOW INVENTORY ALERTS ---
  await test('17. GET /api/v1/admin/inventory (Inventory Counts & Low Alerts)', async () => {
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const res = await fetch(`${baseUrl}/admin/inventory`, { headers: adminHeaders });
    if (!res.ok) throw new Error(`Inventory overview failed: ${res.status}`);
    const data: any = await res.json();
    const inv = data.data;
    if (typeof inv.destinations !== 'number' || inv.destinations < 8) {
      throw new Error(`Expected at least 8 destinations, got ${inv.destinations}`);
    }
    if (typeof inv.hotels !== 'number' || inv.hotels < 8) {
      throw new Error(`Expected at least 8 hotels, got ${inv.hotels}`);
    }
    if (typeof inv.activities !== 'number' || inv.activities < 8) {
      throw new Error(`Expected at least 8 activities, got ${inv.activities}`);
    }
    if (typeof inv.packages !== 'number' || inv.packages < 8) {
      throw new Error(`Expected at least 8 packages, got ${inv.packages}`);
    }
    if (!inv.lowInventoryAlerts) {
      throw new Error('lowInventoryAlerts field missing');
    }
  });

  console.log(`\n=======================================================`);
  console.log(`📊 FINAL RESULT: ${passCount} Passed, ${failCount} Failed`);
  console.log(`=======================================================\n`);

  if (failCount > 0) process.exit(1);
}

runComprehensiveVerification().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
