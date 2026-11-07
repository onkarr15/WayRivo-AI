import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { UnauthorizedError, ConflictError, NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { UserRole, UserStatus, BookingStatus, PaymentStatus } from '@prisma/client';
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
    agencyName?: string;
    organizationName?: string;
  }) {
    const { email, password, name, phone, role, agencyName, organizationName } = params;
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
        agencyName: agencyName || organizationName || null,
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
      // 1. Atomically claim the token to prevent concurrent race conditions
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (claimed.count === 0) {
        const existing = await tx.passwordResetToken.findUnique({
          where: { tokenHash },
        });
        if (!existing) {
          throw new BadRequestError('This password reset link is invalid or has expired.');
        }
        if (existing.usedAt !== null) {
          throw new BadRequestError('This password reset link has already been used. Please request a new one.');
        }
        throw new BadRequestError('This password reset link has expired. Please request a new one.');
      }

      const resetToken = await tx.passwordResetToken.findUniqueOrThrow({
        where: { tokenHash },
        include: { user: true },
      });

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

  async updateProfile(userId: string, data: any) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const {
      name,
      email,
      phone,
      avatarUrl,
      preferredDestinations,
      travelInterests,
      budgetPreference,
      preferredCurrency,
      country,
      state,
      city,
      address,
      postalCode,
      bio,
      description,
      dateOfBirth,
      gender,
      organizationName,
      agencyName,
      websiteUrl,
      specializations,
      yearsOfExperience,
      languages,
      verificationStatus,
    } = data;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (preferredDestinations !== undefined) {
      updateData.preferredDestinations = Array.isArray(preferredDestinations)
        ? preferredDestinations
        : typeof preferredDestinations === 'string'
          ? (preferredDestinations as string).split(',').map((d) => d.trim()).filter(Boolean)
          : [];
    }
    if (travelInterests !== undefined) {
      updateData.travelInterests = Array.isArray(travelInterests)
        ? travelInterests
        : typeof travelInterests === 'string'
          ? (travelInterests as string).split(',').map((i) => i.trim()).filter(Boolean)
          : [];
    }
    if (budgetPreference !== undefined) updateData.budgetPreference = budgetPreference;
    if (preferredCurrency !== undefined) updateData.preferredCurrency = preferredCurrency;
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (bio !== undefined || description !== undefined) updateData.bio = bio || description;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (organizationName !== undefined || agencyName !== undefined) {
      updateData.agencyName = organizationName || agencyName;
    }
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
    if (specializations !== undefined) {
      updateData.specializations = Array.isArray(specializations)
        ? specializations.join(', ')
        : String(specializations || '');
    }
    if (yearsOfExperience !== undefined) {
      updateData.yearsOfExperience = Number(yearsOfExperience) || 0;
    }
    if (languages !== undefined) {
      updateData.languages = Array.isArray(languages)
        ? languages
        : typeof languages === 'string'
          ? (languages as string).split(',').map((l) => l.trim()).filter(Boolean)
          : [];
    }
    if (verificationStatus !== undefined) {
      updateData.verificationStatus = verificationStatus;
    }

    // Handle email update safely if provided and different
    if (email && email.toLowerCase().trim() !== user.email.toLowerCase()) {
      const normalizedNewEmail = email.toLowerCase().trim();
      const existingWithEmail = await prisma.user.findUnique({ where: { email: normalizedNewEmail } });
      if (existingWithEmail) {
        throw new ConflictError('The requested email address is already in use by another account.');
      }
      updateData.email = normalizedNewEmail;
      updateData.isEmailVerified = false; // requires verification
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.sanitizeUser(updated);
  }

  /**
   * Delete Account with Financial Record Retention and PII Anonymization
   * - Enforces reauthentication via password (or OAuth check)
   * - Validates explicit 'DELETE' confirmation text
   * - Checks active bookings, escrow holds, and pending payments
   * - Anonymizes personal identifiable information
   * - Retains financial transactions, PayPal capture IDs and receipts for audit
   * - Invalidates active sessions and prevents future logins
   */
  async deleteAccount(userId: string, data: { confirmation: string; password?: string; reason?: string }) {
    if (!data.confirmation || data.confirmation.trim().toUpperCase() !== 'DELETE') {
      throw new BadRequestError("You must explicitly type 'DELETE' to confirm account deletion.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        oauthAccounts: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Account not found.');
    }

    // Role safety: Never allow deleting ADMIN accounts through this standard endpoint
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenError('Administrator accounts cannot be deleted through this interface.');
    }

    // Reauthentication
    if (user.passwordHash) {
      if (!data.password) {
        throw new UnauthorizedError('Current password is required to confirm account deletion.');
      }
      const isMatch = await bcrypt.compare(data.password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedError('Incorrect password. Account deletion denied.');
      }
    }

    // Check Active Obligations
    // 1. Check for Active Bookings (Traveler or Expert)
    const activeBookings = await prisma.booking.findMany({
      where: {
        userId,
        status: {
          in: [
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.ESCROW_HOLD,
          ],
        },
      },
      select: {
        id: true,
        bookingReference: true,
        status: true,
        totalAmount: true,
      },
    });

    if (activeBookings.length > 0) {
      const refs = activeBookings.map((b) => `${b.bookingReference} (${b.status})`).join(', ');
      throw new BadRequestError(
        `Cannot delete account with active or pending bookings: ${refs}. Please complete, cancel, or resolve all journeys before deleting your account.`
      );
    }

    // 2. Check for active/locked payments
    const activePayments = await prisma.payment.findMany({
      where: {
        booking: { userId },
        status: {
          in: [
            PaymentStatus.CREATED,
            PaymentStatus.APPROVED,
            PaymentStatus.ESCROW_LOCKED,
          ],
        },
      },
      select: {
        id: true,
        status: true,
        amount: true,
      },
    });

    if (activePayments.length > 0) {
      throw new BadRequestError(
        'Cannot delete account with active or escrow-locked payment transactions. Please wait for transactions to settle.'
      );
    }

    // 3. Data Retention & Anonymization
    // Preserve financial & transaction records, anonymize personal PII, invalidate sessions
    const anonymizedEmail = `deleted_${user.id}_${Date.now()}@deleted.wayrivo.local`;

    await prisma.$transaction(async (tx) => {
      // Remove OAuth connections
      await tx.oAuthAccount.deleteMany({ where: { userId } });

      // Anonymize user record
      await tx.user.update({
        where: { id: userId },
        data: {
          name: 'Deleted Account',
          email: anonymizedEmail,
          phone: null,
          avatarUrl: null,
          bio: null,
          address: null,
          city: null,
          state: null,
          country: null,
          postalCode: null,
          dateOfBirth: null,
          gender: null,
          passwordHash: null,
          status: UserStatus.SUSPENDED,
          tokenVersion: user.tokenVersion + 10,
          isEmailVerified: false,
          preferredDestinations: [],
          travelInterests: [],
          agencyName: null,
          websiteUrl: null,
          specializations: null,
          yearsOfExperience: 0,
          languages: [],
        },
      });

      // Record audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_DELETED',
          entityType: 'User',
          entityId: userId,
          details: {
            reason: data.reason || 'User requested account deletion',
            originalRole: user.role,
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    return {
      success: true,
      message: 'Your WayRivo account has been successfully deleted.',
    };
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
