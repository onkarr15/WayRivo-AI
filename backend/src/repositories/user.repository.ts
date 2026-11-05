import { prisma } from '../config/db';
import { User, UserRole, UserStatus } from '@prisma/client';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async create(data: {
    email: string;
    passwordHash?: string | null;
    name: string;
    phone?: string;
    role?: UserRole;
    avatarUrl?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase().trim(),
        role: data.role || UserRole.TRAVELER,
        status: UserStatus.ACTIVE,
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }
}

export const userRepository = new UserRepository();
