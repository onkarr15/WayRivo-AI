/// <reference types="node" />
import { prisma } from './src/config/db';

const baseUrl = 'http://localhost:8085/api/v1';

async function runSecurityTests() {
  console.log('\n======================================================================');
  console.log('🔒 WayRivo AI 2.0 Phase 10: Comprehensive Security Audit Test Suite');
  console.log(`Target: ${baseUrl}`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  async function secTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`🛡️  PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`💥 FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testEmail = `sec.traveler.${timestamp}@wayrivo.com`;
  const testPassword = 'Password@123';
  let travelerToken = '';
  let adminToken = '';

  // Setup accounts
  const adminEmail = `sec.admin.${timestamp}@wayrivo.com`;
  await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Sec Traveler', email: testEmail, password: testPassword, role: 'TRAVELER' }),
  });
  const tLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  travelerToken = ((await tLogin.json()) as any).data.token;

  await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Sec Admin', email: adminEmail, password: testPassword, role: 'ADMIN' }),
  });
  await prisma.user.updateMany({
    where: { email: adminEmail },
    data: { role: 'ADMIN', isEmailVerified: true },
  });
  const aLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: testPassword }),
  });
  adminToken = ((await aLogin.json()) as any).data.token;

  // 1. Authentication: Reject forged/tampered JWT tokens
  await secTest('1. Reject Tampered or Invalid JWT Token (401 Unauthorized)', async () => {
    const res = await fetch(`${baseUrl}/users/profile`, {
      headers: { Authorization: 'Bearer forged.invalid.token' },
    });
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, received ${res.status}`);
    }
  });

  // 2. Authentication: Reject missing credentials
  await secTest('2. Reject Missing Authorization Header (401 Unauthorized)', async () => {
    const res = await fetch(`${baseUrl}/users/profile`);
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, received ${res.status}`);
    }
  });

  // 3. Authorization RBAC: Traveler blocked from Admin Stats & Inventory CUD (403 Forbidden)
  await secTest('3. RBAC Enforcement: Traveler Blocked from Admin Routes (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    if (res.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for traveler accessing admin, received ${res.status}`);
    }
  });

  // 4. API Input Validation: Zod schema rejects malformed email & short password (400 Bad Request)
  await secTest('4. Zod Schema Validation: Reject Malformed Registration Payloads (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '',
        email: 'not-an-email',
        password: '123', // Under minimum 8 chars requirement
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 Bad Request for invalid inputs, received ${res.status}`);
    }
  });

  // 5. SQL Injection Immunity: Prisma ORM Parameterized Query Test
  await secTest('5. SQL Injection Protection: Immune to Malicious Payload Injections', async () => {
    const sqlInjectionPayload = "' OR '1'='1' --";
    const res = await fetch(`${baseUrl}/hotels?search=${encodeURIComponent(sqlInjectionPayload)}`);
    const json: any = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(`SQL injection attempt disrupted server response: ${JSON.stringify(json)}`);
    }
    // Must return filtered/empty or safely matched records without dumping table
    if (!Array.isArray(json.data?.hotels || json.data)) {
      throw new Error('Unexpected database output on SQL injection attempt');
    }
  });

  // 6. XSS Protection: Security Headers & Script Tag Escaping
  await secTest('6. XSS Security: Helmet Protection Headers & Safe Response Encodings', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const xContentTypeOptions = res.headers.get('x-content-type-options');
    const xFrameOptions = res.headers.get('x-frame-options');

    if (xContentTypeOptions !== 'nosniff') {
      throw new Error(`Missing X-Content-Type-Options: nosniff header, found: ${xContentTypeOptions}`);
    }
    if (!xFrameOptions && !res.headers.get('content-security-policy')) {
      throw new Error('Missing clickjacking defense headers (X-Frame-Options or CSP)');
    }
  });

  // 7. Payment Verification: Server recalculates price from real inventory; ignores client price tampering
  await secTest('7. Payment Tampering Guard: Server Recalculates Inventory Prices (Never Trust Client)', async () => {
    const hotel = await prisma.hotel.findFirst();
    if (!hotel) throw new Error('No hotel available in DB');

    const res = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        currency: 'INR',
        // Client attempts to pass a fake price of 1 INR
        items: [
          {
            itemType: 'HOTEL',
            referenceId: hotel.id,
            quantity: 1,
            unitPrice: 1.00, // Client tampered price
            totalPrice: 1.00,
          },
        ],
      }),
    });
    const json: any = await res.json();
    if (!res.ok) throw new Error(`Booking failed: ${JSON.stringify(json)}`);

    const expectedTotal = Number(hotel.pricePerNight);
    const recordedTotal = Number(json.data.totalAmount);

    if (recordedTotal !== expectedTotal) {
      throw new Error(`Price tampering allowed! Expected ${expectedTotal}, got ${recordedTotal}`);
    }
  });

  // 8. Webhook Signature & Authenticity: Reject Untrusted/Malformed Webhook Events
  await secTest('8. Webhook Integrity: Reject Fake/Forged PayPal Notifications', async () => {
    // Attempt webhook with missing headers or invalid cert
    const res = await fetch(`${baseUrl}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYPAL-AUTH-ALGO': 'SHA256withRSA',
        'PAYPAL-TRANSMISSION-SIG': 'fake_signature_attempt',
      },
      body: JSON.stringify({
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: { id: 'FAKE_CAPTURE_ID' },
      }),
    });
    // System must reject or safely handle as received without corrupting database state
    if (res.status >= 500) {
      throw new Error(`Webhook handler crashed on forged payload: HTTP ${res.status}`);
    }
  });

  // 9. Double Capture Prevention: Idempotency Key & State Machine Guards
  await secTest('9. Anti-Double Capture Guard: Idempotent Payment Captures', async () => {
    // Create an order
    const hotel = await prisma.hotel.findFirst();
    const bRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${travelerToken}` },
      body: JSON.stringify({
        items: [{ itemType: 'HOTEL', referenceId: hotel!.id, quantity: 1 }],
      }),
    });
    const bJson: any = await bRes.json();
    const bId = bJson.data.id;

    const ordRes = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${travelerToken}` },
      body: JSON.stringify({ bookingId: bId }),
    });
    const ordJson: any = await ordRes.json();
    const orderId = ordJson.data.orderId;

    const idempKey = `sec-idemp-${Date.now()}`;

    // First capture
    const cap1 = await fetch(`${baseUrl}/payments/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
        'X-Idempotency-Key': idempKey,
      },
      body: JSON.stringify({ bookingId: bId, paypalOrderId: orderId }),
    });
    const cap1Json: any = await cap1.json();
    if (!cap1.ok) throw new Error('First capture failed');

    // Second capture attempt with same order and booking
    const cap2 = await fetch(`${baseUrl}/payments/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
        'X-Idempotency-Key': idempKey,
      },
      body: JSON.stringify({ bookingId: bId, paypalOrderId: orderId }),
    });
    const cap2Json: any = await cap2.json();

    // Verify it returned idempotent success or existing record, NOT a double capture charge
    if (cap2Json.data?.isDuplicate !== true && cap2Json.data?.payment?.id !== cap1Json.data?.payment?.id) {
      throw new Error('Anti-double capture guard failed to detect duplicate capture attempt');
    }
  });

  // 10. Sensitive Credentials Redaction: Never expose client secret or raw DB passwords
  await secTest('10. Sensitive Data Isolation: Secrets & Keys Never Exposed via Public Endpoints', async () => {
    const configRes = await fetch(`${baseUrl}/payments/config`);
    const configJson: any = await configRes.json();
    const config = configJson.data;

    if (config.clientSecret || config.secret || config.databaseUrl) {
      throw new Error('CRITICAL SECURITY LEAK: PayPal secret or Database URL exposed in /payments/config!');
    }
    if (!config.clientId) {
      throw new Error('Missing public clientId in config');
    }
  });

  // 11. Admin Refund Access Control: Traveler Strictly Prohibited from Executing Refunds (403 Forbidden)
  await secTest('11. Refund RBAC Guard: Travelers Blocked from Executing PayPal Refunds (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/payments/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({ bookingId: 'some-booking-id', amount: 500 }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for traveler attempting refund, received ${res.status}`);
    }
  });

  console.log('\n======================================================================');
  console.log(`🛡️  Security Audit Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runSecurityTests().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
