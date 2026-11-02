import { Request } from 'express';
import { UserRole, UserStatus, BookingStatus, PaymentStatus, EscrowStatus } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export { UserRole, UserStatus, BookingStatus, PaymentStatus, EscrowStatus };
