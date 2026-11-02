import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { AuthRequest, AuthenticatedUser, UserRole } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

interface JwtPayload {
  userId: string;
  role: UserRole;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies.wayrivo_token) {
      token = req.cookies.wayrivo_token;
    }

    // 2. Fall back to Authorization Header: Bearer <token>
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing or expired. Please sign in.');
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired authentication session');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isEmailVerified: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenError('Account is suspended. Please contact WayRivo security support.');
    }

    req.user = user as AuthenticatedUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    const userRole = req.user.role;
    // Transparent equivalence: USER matches TRAVELER and vice versa
    const isMatched =
      allowedRoles.includes(userRole) ||
      (allowedRoles.includes(UserRole.USER) && userRole === UserRole.TRAVELER) ||
      (allowedRoles.includes(UserRole.TRAVELER) && userRole === UserRole.USER);

    if (!isMatched) {
      next(new ForbiddenError(`Access denied. Requires one of roles: ${allowedRoles.join(', ')}`));
      return;
    }

    next();
  };
};
