import process from 'node:process';
import { prisma } from './src/config/db';

const baseUrl = 'http://localhost:8085/api/v1';

async function testDashboards() {
  console.log('\n======================================================================');
  console.log('📊 WayRivo AI 2.0 Phase 9: User & Admin Dashboards Test Suite');
  console.log(`Target: ${baseUrl}`);
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

  let travelerToken = '';
  let travelerId = '';
  let adminToken = '';

  await test('1. Traveler & Admin Authentication for Dashboard Testing', async () => {
    const travelerEmail = 'traveler.dash@wayrivo.com';
    const adminEmail = 'admin.dash@wayrivo.com';
    const password = 'Password@123';

    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dashboard Traveler',
        email: travelerEmail,
        password,
        role: 'TRAVELER',
      }),
    }).catch(() => {});

    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'System Admin Dash',
        email: adminEmail,
        password,
        role: 'ADMIN',
      }),
    }).catch(() => {});

    await prisma.user.updateMany({
      where: { email: adminEmail },
      data: { role: 'ADMIN', isEmailVerified: true },
    });

    const resT = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: travelerEmail, password }),
    });
    const jsonT = await resT.json();
    travelerToken = jsonT.data?.token;
    travelerId = jsonT.data?.user?.id;

    const resA = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password }),
    });
    const jsonA = await resA.json();
    adminToken = jsonA.data?.token;

    if (!travelerToken || !adminToken) {
      throw new Error('Failed to retrieve authentication tokens');
    }
  });

  const travelerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${travelerToken}`,
  };

  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  // 2. GET /api/v1/users/dashboard
  await test('2. GET /api/v1/users/dashboard (Full Overview, Trips, Itineraries, AI Chats, Payments)', async () => {
    const res = await fetch(`${baseUrl}/users/dashboard`, { headers: travelerHeaders });
    const json = await res.json();
    const data = json.data;

    if (!data || typeof data.overview?.totalTrips !== 'number') {
      throw new Error(`Invalid overview structure: ${JSON.stringify(json)}`);
    }
    if (!Array.isArray(data.bookings) || !Array.isArray(data.savedItineraries)) {
      throw new Error('Expected bookings and savedItineraries arrays');
    }
  });

  // 3. PATCH /api/v1/users/profile
  await test('3. PATCH /api/v1/users/profile (Save Travel Preferences & Preferred Currency)', async () => {
    const res = await fetch(`${baseUrl}/users/profile`, {
      method: 'PATCH',
      headers: travelerHeaders,
      body: JSON.stringify({
        preferredDestinations: ['Goa', 'Kerala', 'Himachal'],
        travelInterests: ['Beaches', 'Water Sports', 'Heritage'],
        budgetPreference: 'Moderate',
        preferredCurrency: 'INR',
      }),
    });
    const json = await res.json();
    if (!json.data?.preferredDestinations?.includes('Goa')) {
      throw new Error(`Failed to update profile preferences: ${JSON.stringify(json)}`);
    }
  });

  // 4. GET /api/v1/admin/stats
  await test('4. GET /api/v1/admin/stats (Admin KPI Overview & Operational Health)', async () => {
    const res = await fetch(`${baseUrl}/admin/stats`, { headers: adminHeaders });
    const json = await res.json();
    const data = json.data;
    if (!data || typeof data.totalUsers !== 'number' || data.systemHealth !== 'OPERATIONAL') {
      throw new Error(`Invalid admin stats: ${JSON.stringify(json)}`);
    }
  });

  // 5. GET /api/v1/admin/analytics
  await test('5. GET /api/v1/admin/analytics (Booking Velocity, Popular Destinations, Package Occupancy, AI Telemetry)', async () => {
    const res = await fetch(`${baseUrl}/admin/analytics`, { headers: adminHeaders });
    const json = await res.json();
    const data = json.data;
    if (
      !data ||
      typeof data.totalRevenue !== 'number' ||
      !Array.isArray(data.popularDestinations) ||
      !Array.isArray(data.bookingTrends) ||
      !data.aiAnalytics
    ) {
      throw new Error(`Invalid analytics response: ${JSON.stringify(json)}`);
    }
  });

  // 6. GET /api/v1/admin/users
  await test('6. GET /api/v1/admin/users (AG Grid Users List with Total Bookings & Spend Metrics)', async () => {
    const res = await fetch(`${baseUrl}/admin/users?page=0&size=10`, { headers: adminHeaders });
    const json = await res.json();
    if (!Array.isArray(json.data?.content) || json.data.totalElements < 1) {
      throw new Error(`Expected paginated users array: ${JSON.stringify(json)}`);
    }
  });

  // 7. PATCH /api/v1/admin/users/:id/status
  await test('7. PATCH /api/v1/admin/users/:id/status (Toggle User Verification & Log Audit)', async () => {
    const res = await fetch(`${baseUrl}/admin/users/${travelerId}/status?status=VERIFIED`, {
      method: 'PATCH',
      headers: adminHeaders,
    });
    const json = await res.json();
    if (json.data?.isEmailVerified !== true) {
      throw new Error(`Failed to toggle verification: ${JSON.stringify(json)}`);
    }
  });

  // 8. PATCH /api/v1/admin/users/:id/role
  await test('8. PATCH /api/v1/admin/users/:id/role (Update User Role & Log Audit)', async () => {
    const res = await fetch(`${baseUrl}/admin/users/${travelerId}/role`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ role: 'USER' }),
    });
    const json = await res.json();
    if (json.data?.role !== 'USER') {
      throw new Error(`Failed to update role: ${JSON.stringify(json)}`);
    }
  });

  // 9. GET /api/v1/admin/bookings
  await test('9. GET /api/v1/admin/bookings (AG Grid Bookings Control with Reference & Escrow Status)', async () => {
    const res = await fetch(`${baseUrl}/admin/bookings?page=0&size=10`, { headers: adminHeaders });
    const json = await res.json();
    if (!Array.isArray(json.data?.content)) {
      throw new Error(`Expected bookings array: ${JSON.stringify(json)}`);
    }
  });

  // 10. GET /api/v1/admin/payments
  await test('10. GET /api/v1/admin/payments (Payment Records with PayPal Capture ID & Escrow Status)', async () => {
    const res = await fetch(`${baseUrl}/admin/payments?page=0&size=10`, { headers: adminHeaders });
    const json = await res.json();
    if (!Array.isArray(json.data?.content)) {
      throw new Error(`Expected payments array: ${JSON.stringify(json)}`);
    }
  });

  // 11. GET /api/v1/admin/cancellations
  await test('11. GET /api/v1/admin/cancellations (Administrative Review Queue for Traveler Cancellations)', async () => {
    const res = await fetch(`${baseUrl}/admin/cancellations`, { headers: adminHeaders });
    const json = await res.json();
    if (!Array.isArray(json.data)) {
      throw new Error(`Expected cancellations array: ${JSON.stringify(json)}`);
    }
  });

  // 12. GET /api/v1/admin/audit-logs
  await test('12. GET /api/v1/admin/audit-logs (Immutable PostgreSQL Security & Moderation Audit Trail)', async () => {
    const res = await fetch(`${baseUrl}/admin/audit-logs?limit=20`, { headers: adminHeaders });
    const json = await res.json();
    const logs = json.data?.content || json.data?.logs || json.data;
    if (!Array.isArray(logs) || logs.length === 0) {
      throw new Error(`Expected audit logs array: ${JSON.stringify(json)}`);
    }
  });

  // 13. Security RBAC Guard: Traveler Blocked from Admin Endpoints (403 Forbidden)
  await test('13. Security Guard: Traveler Blocked from Admin Endpoints (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/admin/analytics`, { headers: travelerHeaders });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, but received HTTP ${res.status}`);
    }
  });

  console.log('\n======================================================================');
  console.log(`📊 Phase 9 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

testDashboards().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
