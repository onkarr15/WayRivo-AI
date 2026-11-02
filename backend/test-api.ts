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
    const data = await res.json();
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
      const err = await res.json();
      throw new Error(`Status ${res.status}: ${JSON.stringify(err)}`);
    }
    const data = await res.json();
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
    const data = await res.json();
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
    const data = await res.json();
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
    const data = await res.json();
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
    const data = await res.json();
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
    const data = await res.json();
    if (!data.data?.resetToken) throw new Error('Reset token missing');
    resetToken = data.data.resetToken;
  });

  // 8. Password Reset Confirmation
  await test('POST /api/v1/auth/reset-password', async () => {
    const res = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'newpassword2026!',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Reset password was not successful');
  });

  // 9. Login with New Password
  await test('POST /api/v1/auth/login (With New Password)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'newpassword2026!',
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
        password: 'newpassword2026!',
      }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token || loginData.data?.token;

    const res = await fetch(`${baseUrl}/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'newpassword2026!',
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
  await test('GET /api/v1/destinations', async () => {
    const res = await fetch(`${baseUrl}/destinations`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No destinations returned');
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
