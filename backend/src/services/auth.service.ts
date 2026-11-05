import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { UnauthorizedError, ConflictError, NotFoundError, BadRequestError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import { emailService } from './email.service';
import { validatePasswordStrength } from '../utils/password-policy';
import { logger } from '../utils/logger';

export class AuthService {
  async register(params: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: UserRole;
  }) {
    const { email, password, name, phone, role } = params;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name,
        phone,
        role: role || UserRole.USER,
        emailVerificationToken,
        isEmailVerified: false,
      },
    });

    const token = this.generateToken(user.id, user.role, user.tokenVersion);

    return {
      token,
      user: this.sanitizeUser(user),
      verificationToken: emailVerificationToken,
      message: 'Registration successful. Please verify your email address.',
    };
  }

  async login(params: { email: string; password: string }) {
    const { email, password } = params;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError(
        'This account was created with Google Sign-In. Please click "Continue with Google" or use Forgot Password to set a password.'
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedError('Account is suspended. Please contact support.');
    }

    const token = this.generateToken(user.id, user.role, user.tokenVersion);

    return {
      token,
      user: this.sanitizeUser(user),
      // Legacy compatibility fields
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired email verification token.');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });

    return {
      success: true,
      message: 'Email address verified successfully.',
      user: this.sanitizeUser(updatedUser),
    };
  }

  /**
   * Request Password Reset
   * - Normalizes and verifies user presence
   * - Generates cryptographically secure 32-byte token
   * - Stores ONLY the SHA-256 hash in PasswordResetToken model
   * - Sets 15-minute expiration
   * - Dispatches email with reset URL containing unhashed token
   * - Always returns a generic, anti-enumeration response
   */
  async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const genericResponse = {
      success: true,
      message:
        'If an account exists with this email address, you will receive password reset instructions shortly.',
    };

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Anti-enumeration: Return same generic response if user not found or suspended
    if (!user || user.status === 'SUSPENDED') {
      return genericResponse;
    }

    // 1. Generate 32 bytes cryptographically secure random token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // 2. Compute SHA-256 hash for secure storage
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 3. Expiration: 15 minutes UTC
    const expiryMinutes = env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // 4. Invalidate any existing unused reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // 5. Store ONLY tokenHash in the dedicated PasswordResetToken table
    const tokenRecord = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 6. Build the secure frontend reset URL
    const frontendOrigin = (env.FRONTEND_URL ? env.FRONTEND_URL.trim().replace(/\/+$/, '') : 'http://localhost:5173');
    const resetUrl = `${frontendOrigin}/reset-password?token=${rawToken}`;

    // 7. Dispatch actual transactional email via Resend
    const emailResult = await emailService.sendPasswordResetEmail(user.email, resetUrl, user.name);

    if (!emailResult.success) {
      logger.warn(
        `[AUTH] Password reset email delivery failed or skipped for user: ${user.id}. Invalidating generated token.`
      );
      // Invalidate the token so an undelivered token does not remain valid
      await prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });
    }

    // 8. Return strict generic response (Never return rawToken or resetUrl)
    return genericResponse;
  }

  /**
   * Secure Token Verification
   * Verifies existence, expiration, and single-use status without consuming the token
   */
  async verifyResetToken(token: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestError('Password reset token is required.');
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!resetToken) {
      throw new BadRequestError('This password reset link is invalid or has expired.');
    }

    if (resetToken.usedAt !== null) {
      throw new BadRequestError('This password reset link has already been used. Please request a new one.');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestError('This password reset link has expired. Please request a new one.');
    }

    if (resetToken.user.status === 'SUSPENDED') {
      throw new BadRequestError('This account is suspended. Please contact customer support.');
    }

    return {
      success: true,
      valid: true,
      message: 'Password reset link is valid.',
    };
  }

  /**
   * Reset Password
   * - Validates new password length (12-128 chars) & checks blocklist
   * - Verifies token hash
   * - Updates user password and increments tokenVersion to revoke active sessions
   * - Consumes the token and invalidates all other outstanding tokens atomically in a transaction
   */
  async resetPassword(params: { token: string; newPassword: string }) {
    const { token, newPassword } = params;

    if (!token || typeof token !== 'string') {
      throw new BadRequestError('Password reset token is required.');
    }

    // Validate password policy (12-128 chars, non-compromised)
    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      throw new BadRequestError(strength.error || 'Password does not meet security requirements.');
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // Atomic transaction for token verification, consumption, password update, and session revocation
    await prisma.$transaction(async (tx) => {
      const resetToken = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!resetToken) {
        throw new BadRequestError('This password reset link is invalid or has expired.');
      }

      if (resetToken.usedAt !== null) {
        throw new BadRequestError('This password reset link has already been used. Please request a new one.');
      }

      if (resetToken.expiresAt < new Date()) {
        throw new BadRequestError('This password reset link has expired. Please request a new one.');
      }

      if (resetToken.user.status === 'SUSPENDED') {
        throw new BadRequestError('This account is suspended. Please contact customer support.');
      }

      // Hash the new password using bcrypt
      const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

      // Update user password and increment tokenVersion (revoking all active JWT sessions across devices)
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      // Mark the current token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Invalidate any other outstanding password reset tokens for this user
      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          userId: resetToken.userId,
          action: 'PASSWORD_RESET',
          entityType: 'User',
          entityId: resetToken.userId,
          details: {
            method: 'EMAIL_TOKEN_RESET',
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    return {
      success: true,
      message: 'Password reset successfully. You may now log in with your new password.',
    };
  }

  async changePassword(userId: string, params: { currentPassword: string; newPassword: string }) {
    const { currentPassword, newPassword } = params;

    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      throw new BadRequestError(strength.error || 'Password does not meet security requirements.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (!user.passwordHash) {
      throw new BadRequestError('This account does not have a password configured.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    preferredDestinations?: string[];
    travelInterests?: string[];
    budgetPreference?: string;
    preferredCurrency?: string;
  }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.sanitizeUser(updated);
  }

  private generateToken(userId: string, role: UserRole, tokenVersion: number = 0): string {
    return jwt.sign({ userId, role, tokenVersion }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, passwordResetToken, passwordResetExpires, emailVerificationToken, ...safeUser } = user;
    return safeUser;
  }
}

export const authService = new AuthService();
