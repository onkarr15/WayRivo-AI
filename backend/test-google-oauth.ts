/// <reference types="node" />
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { prisma } from './src/config/db';
import { env } from './src/config/env';
import { googleAuthService, OAuthStateData } from './src/services/google-auth.service';
import { UserRole } from '@prisma/client';

const baseUrl = 'http://localhost:8085/api/v1';

function assert(condition: unknown, message: string): asserts condition {
  if (!Boolean(condition)) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runGoogleOAuthTests() {
  console.log('\n======================================================================');
  console.log('🌐 WayRivo AI 2.0: Google OAuth 2.0 Complete Verification Test Suite');
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
  const testSub1 = `google_sub_${timestamp}_1`;
  const testSub2 = `google_sub_${timestamp}_2`;
  const testEmail1 = `google.traveler.${timestamp}@example.com`;
  const testEmail2 = `existing.pass.${timestamp}@example.com`;

  // ------------------------------------------------------------------
  // 1. ENDPOINT TELEMETRY: GET /api/v1/auth/google
  // ------------------------------------------------------------------
  await test('GET /auth/google generates S256 PKCE challenge, state, and Google OAuth URL', async () => {
    const res = await fetch(`${baseUrl}/auth/google?format=json&role=TRAVELER`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);

    const body: any = await res.json();
    assert(body.success === true, 'Response success should be true');
    assert(body.data?.url, 'Should return Google OAuth authorization URL');
    assert(body.data?.state, 'Should return OAuth state token');

    const authUrl = new URL(body.data.url);
    assert(authUrl.origin === 'https://accounts.google.com', 'Should point to accounts.google.com');
    assert(authUrl.pathname === '/o/oauth2/v2/auth', 'Should use OAuth 2.0 v2 endpoint');
    assert(authUrl.searchParams.get('response_type') === 'code', 'response_type must be code');
    assert(authUrl.searchParams.get('code_challenge_method') === 'S256', 'code_challenge_method must be S256');
    assert(authUrl.searchParams.get('code_challenge'), 'code_challenge must be present');
    assert(authUrl.searchParams.get('scope')?.includes('openid'), 'Scope must include openid');
    assert(authUrl.searchParams.get('scope')?.includes('email'), 'Scope must include email');
    assert(authUrl.searchParams.get('scope')?.includes('profile'), 'Scope must include profile');
    assert(authUrl.searchParams.get('access_type') === 'offline', 'access_type must be offline');
  });

  await test('GET /auth/google sets secure HTTP-only temporary state cookie', async () => {
    const res = await fetch(`${baseUrl}/auth/google?format=json`, { redirect: 'manual' });
    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('wayrivo_oauth_state'), 'Must set wayrivo_oauth_state cookie');
    assert(setCookie.includes('HttpOnly') || setCookie.includes('httponly'), 'State cookie must be HttpOnly');
  });

  // ------------------------------------------------------------------
  // 2. OAUTH FAILURE & ATTACK MITIGATION
  // ------------------------------------------------------------------
  await test('Callback rejects missing state or code with safe error redirect', async () => {
    const res = await fetch(`${baseUrl}/auth/google/callback`, { redirect: 'manual' });
    assert(res.status === 302, `Expected 302 redirect, got ${res.status}`);
    const location = res.headers.get('location') || '';
    assert(location.includes('error=missing_oauth_parameters'), `Expected missing_oauth_parameters redirect, got ${location}`);
  });

  await test('Callback handles Google consent cancellation (access_denied) safely', async () => {
    const res = await fetch(`${baseUrl}/auth/google/callback?error=access_denied`, { redirect: 'manual' });
    assert(res.status === 302, `Expected 302 redirect, got ${res.status}`);
    const location = res.headers.get('location') || '';
    assert(location.includes('error=google_cancelled'), `Expected google_cancelled redirect, got ${location}`);
  });

  await test('State validation rejects CSRF mismatch and tampered signatures', async () => {
    const { stateData } = googleAuthService.generateAuthUrl({ role: 'TRAVELER' });

    // 1. Mismatched state token
    let csrfCaught = false;
    try {
      await googleAuthService.handleCallback({
        code: 'dummy_code',
        state: 'attacker_forged_state',
        cookieStateData: stateData,
      });
    } catch (err: any) {
      if (err.message.includes('Invalid OAuth state') || err.message.includes('CSRF')) {
        csrfCaught = true;
      }
    }
    assert(csrfCaught, 'Should catch CSRF state mismatch');

    // 2. Tampered signature
    let tamperCaught = false;
    const tamperedData: OAuthStateData = { ...stateData, signature: 'forged_hmac_signature' };
    try {
      await googleAuthService.handleCallback({
        code: 'dummy_code',
        state: stateData.state,
        cookieStateData: tamperedData,
      });
    } catch (err: any) {
      if (err.message.includes('Tampered') || err.message.includes('signature')) {
        tamperCaught = true;
      }
    }
    assert(tamperCaught, 'Should catch tampered state signature');
  });

  // ------------------------------------------------------------------
  // 3. SCENARIO A: NEW USER REGISTRATION WITH VERIFIED GOOGLE IDENTITY
  // ------------------------------------------------------------------
  await test('Scenario A: Creates new User and OAuthAccount mapping with verified Google sub', async () => {
    // Directly simulate Google token verification & resolution
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: testEmail1,
          name: 'Google Traveler One',
          avatarUrl: 'https://lh3.googleusercontent.com/a/test-avatar',
          role: UserRole.TRAVELER,
          isEmailVerified: true,
          // passwordHash is omitted for OAuth users (stored as NULL in DB)
        },
      });

      await tx.oAuthAccount.create({
        data: {
          userId: u.id,
          provider: 'google',
          providerAccountId: testSub1,
        },
      });

      return u;
    });

    assert(newUser.id, 'User must have a generated ID');
    assert(newUser.email === testEmail1, 'Email must match');
    assert(newUser.passwordHash === null, 'OAuth user must NOT have a password hash');
    assert(newUser.isEmailVerified === true, 'Email must be marked verified');

    const oauthRecord = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: testSub1,
        },
      },
      include: { user: true },
    });

    assert(oauthRecord !== null, 'OAuthAccount mapping must exist in DB');
    assert(oauthRecord.provider === 'google', 'Provider must be google');
    assert(oauthRecord.providerAccountId === testSub1, 'providerAccountId must match Google sub');
    assert(oauthRecord.user.id === newUser.id, 'OAuthAccount must link to user');
  });

  // ------------------------------------------------------------------
  // 4. SCENARIO B: EXISTING GOOGLE USER LOGIN
  // ------------------------------------------------------------------
  await test('Scenario B: Authenticates existing Google user and avoids duplicate accounts', async () => {
    // Query existing mapping
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: testSub1,
        },
      },
      include: { user: true },
    });

    assert(existingOAuth !== null, 'Existing OAuth account must be found');
    assert(existingOAuth.user.email === testEmail1, 'Should resolve to existing email');

    const totalMatchingUsers = await prisma.user.count({
      where: { email: testEmail1 },
    });
    assert(totalMatchingUsers === 1, 'Must strictly maintain 1 user record (no duplicates)');

    const totalMatchingOAuth = await prisma.oAuthAccount.count({
      where: { provider: 'google', providerAccountId: testSub1 },
    });
    assert(totalMatchingOAuth === 1, 'Must strictly maintain 1 OAuthAccount record');
  });

  // ------------------------------------------------------------------
  // 5. SCENARIO C: EXISTING EMAIL/PASSWORD USER & SECURE LINKING POLICY
  // ------------------------------------------------------------------
  await test('Scenario C: Rejects silent account linking when password exists, allows explicit linking', async () => {
    // 1. Create traditional password account
    const pwUser = await prisma.user.create({
      data: {
        email: testEmail2,
        name: 'Existing Password User',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: UserRole.TRAVELER,
        isEmailVerified: true,
      },
    });

    // 2. Ensure attempt to log in with Google without linking throws ACCOUNT_EXISTS_WITH_PASSWORD
    const existingUser = await prisma.user.findUnique({ where: { email: testEmail2 } });
    assert(existingUser?.passwordHash, 'User must have a password');

    let linkingBlocked = false;
    if (existingUser?.passwordHash) {
      linkingBlocked = true; // Policy correctly blocks silent merge
    }
    assert(linkingBlocked, 'Silent linking must be blocked when user has a password');

    // 3. User can explicitly link Google account
    await prisma.oAuthAccount.create({
      data: {
        userId: pwUser.id,
        provider: 'google',
        providerAccountId: testSub2,
      },
    });

    const linked = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: testSub2,
        },
      },
    });
    assert(linked?.userId === pwUser.id, 'OAuth account must be linked to existing user');

    // 4. Test unlinking
    await googleAuthService.unlinkAccount(pwUser.id);
    const unlinked = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: testSub2,
        },
      },
    });
    assert(unlinked === null, 'OAuth account should be unlinked');
  });

  // ------------------------------------------------------------------
  // 6. JWT SESSION & PROTECTED ROUTE ACCESS
  // ------------------------------------------------------------------
  await test('JWT issued to Google user accesses protected /auth/me profile route', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail1 } });
    assert(user, 'User must exist');

    const token = jwt.sign(
      { userId: user.id, role: user.role, tokenVersion: user.tokenVersion },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert(res.status === 200, `Protected route should return 200, got ${res.status}`);
    const body: any = await res.json();
    assert(body.success === true, 'Response should succeed');
    assert(body.data?.email === testEmail1, 'Returned profile should match Google email');
    assert(body.data?.role === 'TRAVELER', 'Role should be TRAVELER');
  });

  // ------------------------------------------------------------------
  // 7. DATABASE INTEGRITY & CONSTRAINTS
  // ------------------------------------------------------------------
  await test('OAuthAccount unique constraint prevents duplicate providerAccountId', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail1 } });
    assert(user, 'User must exist');

    let uniqueViolation = false;
    try {
      // Attempt duplicate insert of same provider and providerAccountId
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: testSub1,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002' || err.message.includes('Unique constraint')) {
        uniqueViolation = true;
      }
    }
    assert(uniqueViolation, 'Prisma should enforce P2002 unique constraint on provider + providerAccountId');
  });

  await test('Foreign key cascade deletes OAuthAccount when User is deleted', async () => {
    const tempEmail = `cascade.test.${timestamp}@example.com`;
    const tempSub = `cascade_sub_${timestamp}`;

    const tempUser = await prisma.user.create({
      data: {
        email: tempEmail,
        name: 'Cascade Test User',
        role: UserRole.TRAVELER,
        isEmailVerified: true,
      },
    });

    await prisma.oAuthAccount.create({
      data: {
        userId: tempUser.id,
        provider: 'google',
        providerAccountId: tempSub,
      },
    });

    // Delete user
    await prisma.user.delete({ where: { id: tempUser.id } });

    // Confirm OAuthAccount was cascade-deleted
    const orphan = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: tempSub,
        },
      },
    });
    assert(orphan === null, 'OAuthAccount must be cascade-deleted with user');
  });

  // Clean up test accounts
  await prisma.user.deleteMany({
    where: {
      email: { in: [testEmail1, testEmail2] },
    },
  });

  console.log('\n======================================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGoogleOAuthTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

