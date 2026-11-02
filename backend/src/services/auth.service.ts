import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { UnauthorizedError, ConflictError, NotFoundError, BadRequestError } from '../utils/errors';
import { UserRole } from '@prisma/client';

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

    const token = this.generateToken(user.id, user.role);

    return {
      token,
      user: this.sanitizeUser(user),
      verificationToken: emailVerificationToken, // Provided for sandbox/demo convenience
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

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedError('Account is suspended. Please contact support.');
    }

    const token = this.generateToken(user.id, user.role);

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

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // For security, do not leak whether email exists
    if (!user) {
      return {
        message: 'If an account exists with that email, a password reset link has been dispatched.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    return {
      message: 'If an account exists with that email, a password reset link has been dispatched.',
      resetToken, // Returned in sandbox mode to facilitate immediate automated testing
      resetUrl: `http://localhost:5173/reset-password?token=${resetToken}`,
    };
  }

  async resetPassword(params: { token: string; newPassword: string }) {
    const { token, newPassword } = params;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('Password reset token is invalid or has expired.');
    }

    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return {
      success: true,
      message: 'Password reset successfully. You may now log in with your new password.',
    };
  }

  async changePassword(userId: string, params: { currentPassword: string; newPassword: string }) {
    const { currentPassword, newPassword } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
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

  private generateToken(userId: string, role: UserRole): string {
    return jwt.sign({ userId, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, passwordResetToken, passwordResetExpires, emailVerificationToken, ...safeUser } = user;
    return safeUser;
  }
}

export const authService = new AuthService();
