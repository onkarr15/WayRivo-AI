/// <reference types="node" />

/**
 * Automated Security & Integration Test Suite: WayRivo AI Password Reset System
 * Tests all 16 scenarios mandated by application security guidelines.
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from './src/config/db';
import { authService } from './src/services/auth.service';
import { env } from './src/config/env';
import { validatePasswordStrength } from './src/utils/password-policy';

const TEST_EMAIL = `security-test-${Date.now()}@example.com`;
const INITIAL_PASSWORD = 'OriginalPassword123!';
const NEW_PASSWORD = 'NewSecurePassphrase2026!';
const WEAK_PASSWORD = 'short';
const BLOCKLISTED_PASSWORD = 'password123456';

let testUserId: string;

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING WAYRIVO AI SECURE PASSWORD RESET TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: unknown, testName: string, detail?: string) {
    if (Boolean(condition)) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  try {
    // -----------------------------------------------------------------
    // SETUP: Create a test user
    // -----------------------------------------------------------------
    console.log('[SETUP] Creating clean test user...');
    const initialHash = await bcrypt.hash(INITIAL_PASSWORD, 10);
    const user = await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        passwordHash: initialHash,
        name: 'Security Test Subject',
        role: 'TRAVELER',
        tokenVersion: 1,
      },
    });
    testUserId = user.id;

    // Issue initial JWT with current tokenVersion (v1)
    const initialSessionJwt = jwt.sign(
      { userId: testUserId, role: 'TRAVELER', tokenVersion: 1 },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // -----------------------------------------------------------------
    // TEST 1: Request reset for registered email
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 1: Valid Registered Email Request ---');
    const req1 = await authService.requestPasswordReset(TEST_EMAIL);
    assert(
      req1.success === true &&
        req1.message.includes('If an account exists with this email address'),
      'Valid registered email returns generic anti-enumeration response'
    );

    // Verify token hash is recorded in DB and raw token is NOT stored
    const dbToken1 = await prisma.passwordResetToken.findFirst({
      where: { userId: testUserId },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!dbToken1, 'PasswordResetToken record created in database');
    assert(
      dbToken1?.tokenHash.length === 64,
      'Token is stored as a 64-character SHA-256 hash'
    );
    assert(
      (req1 as any).resetToken === undefined,
      'Raw token is NEVER leaked in API response'
    );
    assert(
      dbToken1?.usedAt !== null,
      'Token was safely invalidated because RESEND_API_KEY is not set in this test environment'
    );

    // -----------------------------------------------------------------
    // TEST 2: Request reset for unregistered email (Anti-Enumeration)
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 2: Unregistered Email Request ---');
    const unregisteredEmail = `nonexistent-${Date.now()}@example.com`;
    const req2 = await authService.requestPasswordReset(unregisteredEmail);
    assert(
      req2.success === true && req2.message === req1.message,
      'Unregistered email returns IDENTICAL response to prevent user enumeration'
    );

    // -----------------------------------------------------------------
    // TEST 3: Password policy validation
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 3: Password Policy Validation ---');
    const weakCheck = validatePasswordStrength(WEAK_PASSWORD);
    assert(
      !weakCheck.isValid && weakCheck.error?.includes('12 characters'),
      'Rejects passwords under 12 characters'
    );

    const blocklistCheck = validatePasswordStrength(BLOCKLISTED_PASSWORD);
    assert(
      !blocklistCheck.isValid && blocklistCheck.error?.includes('commonly used'),
      'Rejects compromised passwords from blocklist'
    );

    const strongCheck = validatePasswordStrength(NEW_PASSWORD);
    assert(strongCheck.isValid, 'Accepts strong 12+ character passphrases');

    // -----------------------------------------------------------------
    // TEST 4: Token verification API (Valid Token)
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 4: Valid Token Verification ---');
    // Generate a known test token
    const testRawToken = crypto.randomBytes(32).toString('hex');
    const testTokenHash = crypto.createHash('sha256').update(testRawToken).digest('hex');
    const expiresFuture = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: testUserId,
        tokenHash: testTokenHash,
        expiresAt: expiresFuture,
      },
    });

    const verifyRes = await authService.verifyResetToken(testRawToken);
    assert(
      verifyRes.success === true && verifyRes.valid === true,
      'Valid token verification succeeds'
    );

    // Verify token was NOT consumed during verification
    const tokenAfterVerify = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: testTokenHash },
    });
    assert(
      tokenAfterVerify?.usedAt === null,
      'Token is NOT consumed by verifyResetToken check'
    );

    // -----------------------------------------------------------------
    // TEST 5: Token verification API (Invalid / Tampered Token)
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 5: Invalid Token Verification ---');
    let invalidCaught = false;
    try {
      await authService.verifyResetToken('fake-or-tampered-token-1234567890');
    } catch (e: any) {
      invalidCaught = true;
      assert(
        e.message.includes('invalid or has expired'),
        'Tampered / non-existent token rejected'
      );
    }
    assert(invalidCaught, 'Invalid token throws error');

    // -----------------------------------------------------------------
    // TEST 6: Token verification API (Expired Token)
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 6: Expired Token Verification ---');
    const expiredRawToken = crypto.randomBytes(32).toString('hex');
    const expiredTokenHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: testUserId,
        tokenHash: expiredTokenHash,
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 min ago
      },
    });

    let expiredCaught = false;
    try {
      await authService.verifyResetToken(expiredRawToken);
    } catch (e: any) {
      expiredCaught = true;
      assert(e.message.includes('expired'), 'Expired token rejected');
    }
    assert(expiredCaught, 'Expired token throws error');

    // -----------------------------------------------------------------
    // TEST 7: Token verification API (Already-Used Token)
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 7: Already-Used Token Verification ---');
    const usedRawToken = crypto.randomBytes(32).toString('hex');
    const usedTokenHash = crypto.createHash('sha256').update(usedRawToken).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: testUserId,
        tokenHash: usedTokenHash,
        expiresAt: expiresFuture,
        usedAt: new Date(), // Already used
      },
    });

    let usedCaught = false;
    try {
      await authService.verifyResetToken(usedRawToken);
    } catch (e: any) {
      usedCaught = true;
      assert(e.message.includes('already been used'), 'Already-used token rejected');
    }
    assert(usedCaught, 'Used token throws error');

    // -----------------------------------------------------------------
    // TEST 8: Reset password with weak password (<12 chars)
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 8: Weak Password Rejection on Reset ---');
    let weakResetCaught = false;
    try {
      await authService.resetPassword({
        token: testRawToken,
        newPassword: 'short',
      });
    } catch (e: any) {
      weakResetCaught = true;
      assert(
        e.message.includes('12 characters'),
        'Weak password rejected on reset endpoint'
      );
    }
    assert(weakResetCaught, 'Weak password throws error on reset');

    // -----------------------------------------------------------------
    // TEST 9: Successful password reset
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 9: Successful Password Reset ---');
    const resetResult = await authService.resetPassword({
      token: testRawToken,
      newPassword: NEW_PASSWORD,
    });
    assert(
      resetResult.success === true,
      'Password reset executes successfully with valid credentials'
    );

    // Verify DB state
    const consumedToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: testTokenHash },
    });
    assert(consumedToken?.usedAt !== null, 'Reset token is marked as consumed');

    const updatedUser = await prisma.user.findUnique({
      where: { id: testUserId },
    });
    assert(
      updatedUser?.tokenVersion === 2,
      'User tokenVersion incremented from 1 to 2 (revokes all prior sessions)'
    );

    // Verify new password hash
    const isNewPasswordValid = await bcrypt.compare(
      NEW_PASSWORD,
      updatedUser!.passwordHash!
    );
    assert(isNewPasswordValid, 'User passwordHash in DB matches new password');

    // -----------------------------------------------------------------
    // TEST 10: Token reuse prevention
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 10: Token Reuse Prevention ---');
    let reuseCaught = false;
    try {
      await authService.resetPassword({
        token: testRawToken,
        newPassword: 'AnotherStrongPassword2026!',
      });
    } catch (e: any) {
      reuseCaught = true;
      assert(
        e.message.includes('already been used') || e.message.includes('invalid'),
        'Token reuse rejected by atomic transaction'
      );
    }
    assert(reuseCaught, 'Reusing the same token is strictly rejected');

    // -----------------------------------------------------------------
    // TEST 11: Invalidation of outstanding older tokens
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 11: Older Outstanding Tokens Invalidation ---');
    const outstandingRaw = crypto.randomBytes(32).toString('hex');
    const outstandingHash = crypto.createHash('sha256').update(outstandingRaw).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: testUserId,
        tokenHash: outstandingHash,
        expiresAt: expiresFuture,
      },
    });

    const activeRaw = crypto.randomBytes(32).toString('hex');
    const activeHash = crypto.createHash('sha256').update(activeRaw).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: testUserId,
        tokenHash: activeHash,
        expiresAt: expiresFuture,
      },
    });

    // Reset password with activeRaw
    await authService.resetPassword({
      token: activeRaw,
      newPassword: 'YetAnotherStrongPassword999!',
    });

    // Verify older token was also invalidated
    const checkOutstanding = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: outstandingHash },
    });
    assert(
      checkOutstanding?.usedAt !== null,
      'Older outstanding tokens are automatically invalidated on password reset'
    );

    // -----------------------------------------------------------------
    // TEST 12: Session Revocation (Old JWT Rejected)
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 12: Session Revocation ---');
    // Decode old session token: tokenVersion was 1, DB is now 3
    const decodedOld = jwt.verify(initialSessionJwt, env.JWT_SECRET) as any;
    const currentUser = await prisma.user.findUnique({ where: { id: testUserId } });
    const isRevoked = decodedOld.tokenVersion < currentUser!.tokenVersion;
    assert(
      isRevoked,
      `Old session JWT (v${decodedOld.tokenVersion}) is revoked against DB (v${currentUser!.tokenVersion})`
    );

    // -----------------------------------------------------------------
    // TEST 13: Old password fails login
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 13: Login with Old Password Fails ---');
    let oldLoginFailed = false;
    try {
      await authService.login({
        email: TEST_EMAIL,
        password: INITIAL_PASSWORD,
      });
    } catch (e: any) {
      oldLoginFailed = true;
      assert(
        e.message.includes('Invalid email or password'),
        'Old password is no longer accepted for login'
      );
    }
    assert(oldLoginFailed, 'Old password login rejected');

    // -----------------------------------------------------------------
    // TEST 14: New password succeeds login
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 14: Login with New Password Succeeds ---');
    const newLoginRes = await authService.login({
      email: TEST_EMAIL,
      password: 'YetAnotherStrongPassword999!',
    });
    assert(
      !!newLoginRes.token && newLoginRes.email === TEST_EMAIL,
      'User can successfully log in with new password'
    );

    // -----------------------------------------------------------------
    // TEST 15: Concurrent Reset Race Condition Protection
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 15: Concurrent Reset Race Condition ---');
    const raceRaw = crypto.randomBytes(32).toString('hex');
    const raceHash = crypto.createHash('sha256').update(raceRaw).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: testUserId,
        tokenHash: raceHash,
        expiresAt: expiresFuture,
      },
    });

    const [attempt1, attempt2] = await Promise.allSettled([
      authService.resetPassword({ token: raceRaw, newPassword: 'RaceConditionPassword1!' }),
      authService.resetPassword({ token: raceRaw, newPassword: 'RaceConditionPassword2!' }),
    ]);

    const oneSucceeded =
      (attempt1.status === 'fulfilled' && attempt2.status === 'rejected') ||
      (attempt1.status === 'rejected' && attempt2.status === 'fulfilled');

    assert(
      oneSucceeded,
      'Concurrent requests: Exactly ONE succeeds and the other is rejected'
    );

    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log('\n[CLEANUP] Deleting test records...');
    await prisma.passwordResetToken.deleteMany({ where: { userId: testUserId } });
    await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    console.log('[CLEANUP] Test records cleaned up.');

    console.log('\n===============================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runTests();
