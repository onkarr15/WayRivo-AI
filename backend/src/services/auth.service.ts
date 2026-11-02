import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { env } from '../config/env';
import { UnauthorizedError, ConflictError } from '../utils/errors';
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

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    const user = await userRepository.create({
      email,
      passwordHash,
      name,
      phone,
      role,
    });

    const token = this.generateToken(user.id, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    };
  }

  async login(params: { email: string; password: string }) {
    const { email, password } = params;

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedError('Account is suspended');
    }

    const token = this.generateToken(user.id, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  private generateToken(userId: string, role: UserRole): string {
    return jwt.sign({ userId, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }
}

export const authService = new AuthService();
