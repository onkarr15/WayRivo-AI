/// <reference types="node" />
import { prisma } from './src/config/db';
import crypto from 'crypto';

async function runTests() {
  const baseUrl = 'http://localhost:8085/api/v1';
  console.log(`🧪 Running WayRivo AI 2.0 API Test Suite (with Phase 4 Auth) against ${baseUrl}\n`);

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
    const data: any = await res.json();
    if (data.status !== 'UP' || data.database !== 'CONNECTED') {
      throw new Error(`Unexpected body: ${JSON.stringify(data)}`);
    }
  });

  // 2. User Registration & Cookie Check
  const testEmail = `traveler_${Date.now()}@example.com`;
  let registeredToken = '';
  let verificationToken = '';
  await test('POST /api/v1/auth/register (New User & Cookie Issuance)', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123',
        name: 'Aanya Sen',
        phone: '+91 98888 77777',
        role: 'USER',
      }),
    });
    if (!res.ok) {
      const err: any = await res.json();
      throw new Error(`Status ${res.status}: ${JSON.stringify(err)}`);
    }
    const data: any = await res.json();
    if (!data.data?.token) throw new Error('Token missing in registration response');
    registeredToken = data.data.token;
    verificationToken = data.data.verificationToken;

    // Check Set-Cookie header
    const cookie = res.headers.get('set-cookie');
    if (!cookie || !cookie.includes('wayrivo_token')) {
      throw new Error('HTTP-only wayrivo_token cookie was not set');
    }
  });

  // 3. Email Verification
  await test('POST /api/v1/auth/verify-email', async () => {
    const res = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!data.data?.user?.isEmailVerified) {
      throw new Error('Email was not marked as verified');
    }
  });

  // 4. User Login with Cookies
  let travelerToken = '';
  await test('POST /api/v1/auth/login (Existing Traveler with Cookie)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arjun@example.com',
        password: 'password123',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!data.token && !data.data?.token) throw new Error('Token not returned');
    travelerToken = data.token || data.data.token;

    const cookie = res.headers.get('set-cookie');
    if (!cookie || !cookie.includes('wayrivo_token')) {
      throw new Error('HTTP-only cookie not set on login');
    }
  });

  // 5. User Profile Retrieval
  await test('GET /api/v1/users/profile', async () => {
    const res = await fetch(`${baseUrl}/users/profile`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!data.data?.email || data.data.email !== 'arjun@example.com') {
      throw new Error(`Invalid profile data: ${JSON.stringify(data)}`);
    }
  });

  // 6. User Profile Update (Preferences, Interests, Currency, Budget)
  await test('PATCH /api/v1/users/profile (Update Preferences)', async () => {
    const res = await fetch(`${baseUrl}/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        name: 'Arjun K. Sharma',
        phone: '+91 91000 00001',
        preferredDestinations: ['Kerala', 'Ladakh'],
        travelInterests: ['Backwaters', 'Tea Estates', 'Ayurvedic Spa'],
        budgetPreference: 'Luxury',
        preferredCurrency: 'INR',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (data.data?.budgetPreference !== 'Luxury' || data.data?.preferredDestinations?.length !== 2) {
      throw new Error(`Profile preferences not updated: ${JSON.stringify(data)}`);
    }
  });

  // 7. Password Reset Request (Forgot Password)
  let resetToken = '';
  await test('POST /api/v1/auth/forgot-password', async () => {
    const res = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!data.success) throw new Error('Forgot password request failed');

    // Secure design: reset token is NEVER returned in response.
    // For automated test verification, generate test token in database:
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!user) throw new Error('Test user not found in database');

    resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
  });

  // 7b. Verify Reset Token
  await test('POST /api/v1/auth/verify-reset-token', async () => {
    const res = await fetch(`${baseUrl}/auth/verify-reset-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!data.data?.valid) throw new Error('Token verification returned invalid');
  });

  // 8. Password Reset Confirmation
  await test('POST /api/v1/auth/reset-password', async () => {
    const res = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'newsecurepassword2026!',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!data.success) throw new Error('Reset password was not successful');
  });

  // 9. Login with New Password
  await test('POST /api/v1/auth/login (With New Password)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'newsecurepassword2026!',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  // 10. Change Password (Authenticated)
  await test('PUT /api/v1/users/change-password', async () => {
    // Log in as new user to get active token
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'newsecurepassword2026!',
      }),
    });
    const loginData: any = await loginRes.json();
    const token = loginData.token || loginData.data?.token;

    const res = await fetch(`${baseUrl}/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'newsecurepassword2026!',
        newPassword: 'brandNewPassword999!',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  // 11. User Logout (Clear Cookie)
  await test('POST /api/v1/auth/logout', async () => {
    const res = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const cookie = res.headers.get('set-cookie');
    if (!cookie || !cookie.includes('wayrivo_token=;')) {
      throw new Error('Cookie was not cleared on logout');
    }
  });

  // 12. Admin Auth & RBAC Guard
  let adminToken = '';
  await test('POST /api/v1/auth/login (Admin Role)', async () => {
    // Ensure admin user exists with password123
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash('password123', 10);
    await prisma.user.upsert({
      where: { email: 'admin@wayrivo.com' },
      update: { passwordHash: hash, role: 'ADMIN', isEmailVerified: true },
      create: {
        name: 'System Admin',
        email: 'admin@wayrivo.com',
        passwordHash: hash,
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });

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
    adminToken = data.token || data.data.token;
  });

  await test('GET /api/v1/admin/stats (RBAC Admin Only)', async () => {
    // Normal traveler should get 403 Forbidden
    const travelerForbiddenRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    if (travelerForbiddenRes.status !== 403) {
      throw new Error(`Expected 403 for traveler, got ${travelerForbiddenRes.status}`);
    }

    // Admin should get 200 OK
    const adminOkRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!adminOkRes.ok) throw new Error(`Admin failed with status ${adminOkRes.status}`);
  });

  // 13. Public Destinations & Inventory
  await test('GET /api/v1/destinations (Marketplace Listings)', async () => {
    const res = await fetch(`${baseUrl}/destinations?page=1&limit=5`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No destinations returned');
    }
    if (typeof data.total !== 'number' || data.total < 5) {
      throw new Error(`Expected at least 5 destinations total, got ${data.total}`);
    }
  });

  // 14. Destination Detail with Attractions & Tips
  await test('GET /api/v1/destinations/slug/kerala (Destination Details & Related Inventory)', async () => {
    const res = await fetch(`${baseUrl}/destinations/slug/kerala`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    const dest = data.data;
    if (!dest || dest.name !== 'Kerala') throw new Error('Kerala destination record not found');
    if (!Array.isArray(dest.popularAttractions) || dest.popularAttractions.length === 0) {
      throw new Error('Popular attractions missing');
    }
    if (!Array.isArray(dest.hotels) || dest.hotels.length === 0) {
      throw new Error('Associated hotels missing');
    }
    if (!Array.isArray(dest.activities) || dest.activities.length === 0) {
      throw new Error('Associated activities missing');
    }
  });

  // 15. Hotels Marketplace Filtering & Availability
  await test('GET /api/v1/hotels (Filter by minStars & availability check)', async () => {
    const res = await fetch(`${baseUrl}/hotels?minStars=4&sortBy=price_asc`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No hotels returned');
    const hotel = data.data[0];
    if (hotel.stars < 4) throw new Error(`Filter violated: expected stars >= 4, got ${hotel.stars}`);
    if (typeof hotel.availableRooms !== 'number') throw new Error('Hotel missing availableRooms field');
  });

  // 16. Activities Marketplace Filtering
  await test('GET /api/v1/activities (Filter by category)', async () => {
    const res = await fetch(`${baseUrl}/activities?category=Adventure%20activities`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No adventure activities returned');
    const act = data.data[0];
    if (act.category !== 'Adventure activities') throw new Error(`Category mismatch: ${act.category}`);
    if (typeof act.availableSlots !== 'number') throw new Error('Activity missing availableSlots field');
  });

  // 17. Travel Packages Marketplace
  await test('GET /api/v1/packages (Filter by isRecommended)', async () => {
    const res = await fetch(`${baseUrl}/packages?isRecommended=true`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No packages returned');
    const pkg = data.data[0];
    if (!pkg.isRecommended) throw new Error('Non-recommended package returned');
    if (typeof pkg.availableSeats !== 'number') throw new Error('Package missing availableSeats field');
  });

  // 18. Admin Inventory Overview & RBAC Guard
  await test('GET /api/v1/admin/inventory (Admin Inventory Overview)', async () => {
    // Normal traveler should get 403 Forbidden
    const travelerForbiddenRes = await fetch(`${baseUrl}/admin/inventory`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    if (travelerForbiddenRes.status !== 403) {
      throw new Error(`Expected 403 for traveler, got ${travelerForbiddenRes.status}`);
    }

    // Admin should get 200 OK with counts
    const adminRes = await fetch(`${baseUrl}/admin/inventory`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!adminRes.ok) throw new Error(`Admin failed with status ${adminRes.status}`);
    const inv: any = await adminRes.json();
    if (!inv.data?.destinations || inv.data.destinations < 1) {
      throw new Error('Invalid inventory statistics received');
    }
  });

  // 19. Admin CUD Operation (Add & Delete Demo Destination)
  await test('POST & DELETE /api/v1/destinations (Admin CUD Inventory)', async () => {
    // Create new destination
    const createRes = await fetch(`${baseUrl}/destinations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Test Eco Valley ${Date.now()}`,
        country: 'India',
        state: 'Himachal Pradesh',
        description: 'Pristine mountain getaway with alpine meadows and trekking trails.',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
        bestTimeToVisit: 'May to September',
        averageBudget: 32000,
        popularAttractions: ['Valley Ridge', 'Alpine Stream'],
        travelTips: ['Carry warm layers', 'Book guides in advance'],
      }),
    });
    if (!createRes.ok) {
      const err: any = await createRes.json();
      throw new Error(`Create failed: ${JSON.stringify(err)}`);
    }
    const created: any = await createRes.json();
    const createdId = created.data.id;

    // Delete created destination
    const delRes = await fetch(`${baseUrl}/destinations/${createdId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (!delRes.ok) throw new Error(`Delete failed with status ${delRes.status}`);
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
