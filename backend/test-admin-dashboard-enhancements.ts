/// <reference types="node" />
import { prisma } from './src/config/db';

const baseUrl = 'http://localhost:8085/api/v1';

async function testAdminDashboardEnhancements() {
  console.log('\n======================================================================');
  console.log('💎 WayRivo AI 2.0: Enhanced Admin Dashboard & Financial Suite Test');
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

  let adminToken = '';
  let travelerToken = '';
  let travelerId = '';
  let samplePaymentId = '';

  // 1. Auth Setup
  await test('1. Traveler & Administrator Authentication', async () => {
    const adminEmail = 'admin.dash@wayrivo.com';
    const travelerEmail = 'traveler.dash@wayrivo.com';
    const password = 'Password@123';

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

    const resA = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password }),
    });
    const jsonA: any = await resA.json();
    adminToken = jsonA.data?.token;

    const resT = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: travelerEmail, password }),
    });
    const jsonT: any = await resT.json();
    travelerToken = jsonT.data?.token;
    travelerId = jsonT.data?.user?.id;

    if (!adminToken) throw new Error('Could not acquire admin auth token');
    if (!travelerToken) throw new Error('Could not acquire traveler auth token');
  });

  // 2. Overview Endpoint (6 Summary Cards)
  await test('2. GET /admin/dashboard/overview (6 Executive Summary Cards Data)', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json: any = await res.json();
    const data = json.data;

    if (!data.trips || typeof data.trips.total !== 'number') throw new Error('Missing trips summary');
    if (!data.bookings || typeof data.bookings.total !== 'number') throw new Error('Missing bookings summary');
    if (!data.payments || typeof data.payments.totalCount !== 'number') throw new Error('Missing payments summary');
    if (!data.revenue || typeof data.revenue.netCaptured !== 'number') throw new Error('Missing revenue summary');
    if (!data.pendingPayments || typeof data.pendingPayments.count !== 'number') throw new Error('Missing pending payments summary');
    if (!data.activeTravellers || typeof data.activeTravellers.totalRegistered !== 'number') throw new Error('Missing active travellers summary');
  });

  // 3. Recent Trips Endpoint
  await test('3. GET /admin/trips/recent (Paginated Trips with Traveler & Booking Telemetry)', async () => {
    const res = await fetch(`${baseUrl}/admin/trips/recent?page=0&size=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json: any = await res.json();
    const data = json.data;

    if (!Array.isArray(data.content)) throw new Error('content must be an array');
    if (typeof data.totalElements !== 'number') throw new Error('totalElements must be a number');

    if (data.content.length > 0) {
      const trip = data.content[0];
      if (!trip.id || !trip.travellerName || !trip.destination) {
        throw new Error('Trip record missing required fields');
      }
    }
  });

  // 4. Recent Payment History Endpoint
  await test('4. GET /admin/payments/recent (Payment Records with 12-Digit WayRivo TxID & PayPal Capture ID)', async () => {
    const res = await fetch(`${baseUrl}/admin/payments/recent?page=0&size=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json: any = await res.json();
    const data = json.data;

    if (!Array.isArray(data.content)) throw new Error('content must be an array');

    if (data.content.length > 0) {
      const p = data.content[0];
      samplePaymentId = p.id;
      if (!p.wayrivoTransactionId || p.wayrivoTransactionId.length !== 12) {
        throw new Error(`WayRivo Transaction ID must be 12 digits, got: ${p.wayrivoTransactionId}`);
      }
      if (!p.bookingReference) throw new Error('Payment record missing bookingReference');
    }
  });

  // 5. Pending Payments Queue
  await test('5. GET /admin/payments/pending (Pending Checkout Sessions & Expiration Tracking)', async () => {
    const res = await fetch(`${baseUrl}/admin/payments/pending?page=0&size=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json: any = await res.json();
    const data = json.data;

    if (!Array.isArray(data.content)) throw new Error('content must be an array');
    if (data.content.length > 0) {
      const p = data.content[0];
      if (typeof p.isExpired !== 'boolean') throw new Error('Pending payment missing isExpired boolean flag');
      if (!p.failureReason) throw new Error('Pending payment missing failureReason description');
    }
  });

  // 6. Safe Payment Reconciliation & Audit Logging
  await test('6. POST /admin/payments/:id/reconcile (Safe Reconciliation & Audit Record)', async () => {
    if (!samplePaymentId) {
      const p = await prisma.payment.findFirst();
      if (p) samplePaymentId = p.id;
    }

    if (samplePaymentId) {
      const res = await fetch(`${baseUrl}/admin/payments/${samplePaymentId}/reconcile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json: any = await res.json();
      const data = json.data;

      if (!data.paymentId || !data.note) throw new Error('Missing reconciliation confirmation note');

      // Verify Audit Log was recorded in PostgreSQL
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'RECONCILE_PAYMENT', entityId: samplePaymentId },
        orderBy: { createdAt: 'desc' },
      });
      if (!auditLog) throw new Error('Audit log for RECONCILE_PAYMENT not found in database');
    }
  });

  // 7. Single Payment Inspection Record
  await test('7. GET /admin/payments/:id (Comprehensive Payment Telemetry)', async () => {
    if (samplePaymentId) {
      const res = await fetch(`${baseUrl}/admin/payments/${samplePaymentId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json: any = await res.json();
      if (!json.data.payment) throw new Error('Payment payload missing from response');
    }
  });

  // 8. Platform Revenue Overview
  await test('8. GET /admin/revenue/overview (Gross Captured, Refunds, Net Captured)', async () => {
    const res = await fetch(`${baseUrl}/admin/revenue/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json: any = await res.json();
    const data = json.data;

    if (typeof data.grossCaptured !== 'number') throw new Error('grossCaptured must be number');
    if (typeof data.netCaptured !== 'number') throw new Error('netCaptured must be number');
    if (!Array.isArray(data.distribution)) throw new Error('distribution must be an array');
  });

  // 9. 12-Month Revenue History
  await test('9. GET /admin/revenue/monthly?year=2026 (Monthly Revenue Series for Recharts)', async () => {
    const res = await fetch(`${baseUrl}/admin/revenue/monthly?year=2026`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json: any = await res.json();
    const data = json.data;

    if (!Array.isArray(data.monthlyData) || data.monthlyData.length !== 12) {
      throw new Error('monthlyData must contain 12 months of telemetry');
    }
  });

  // 10. Traveller-Wise Revenue Analytics
  await test('10. GET /admin/revenue/by-traveller (Aggregated Revenue & Booking Value per Traveller)', async () => {
    const res = await fetch(`${baseUrl}/admin/revenue/by-traveller?page=0&size=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json: any = await res.json();
    const data = json.data;

    if (!Array.isArray(data.content)) throw new Error('content must be an array');
    if (data.content.length > 0) {
      const tr = data.content[0];
      if (typeof tr.netCapturedAmount !== 'number') throw new Error('netCapturedAmount must be a calculated number');
      if (typeof tr.totalTrips !== 'number') throw new Error('totalTrips must be a number');
    }
  });

  // 11. Traveller Full Revenue Profile Dossier
  await test('11. GET /admin/travellers/:id/revenue (Complete Dossier with Trip & Payment History)', async () => {
    if (travelerId) {
      const res = await fetch(`${baseUrl}/admin/travellers/${travelerId}/revenue`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json: any = await res.json();
      const data = json.data;

      if (!data.profile || !data.financialSummary || !Array.isArray(data.paymentHistory)) {
        throw new Error('Dossier payload missing expected structured data');
      }
    }
  });

  // 12. Export Feeds (Payments & Revenue Reports)
  await test('12. GET /admin/reports/payments & /admin/reports/revenue (CSV Export Telemetry Feeds)', async () => {
    const resP = await fetch(`${baseUrl}/admin/reports/payments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (resP.status !== 200) throw new Error(`Expected 200 on reports/payments, got ${resP.status}`);

    const resR = await fetch(`${baseUrl}/admin/reports/revenue`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (resR.status !== 200) throw new Error(`Expected 200 on reports/revenue, got ${resR.status}`);
  });

  // 13. Security RBAC Enforcement
  await test('13. Security Guard: Traveler Blocked from Admin Analytics (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard/overview`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  console.log('\n======================================================================');
  console.log(`📊 Enhanced Admin Suite Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

testAdminDashboardEnhancements().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});

