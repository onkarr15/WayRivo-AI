import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { AuthRequest, AuthenticatedUser, UserRole } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

interface JwtPayload {
  userId: string;
  role: UserRole;
  tokenVersion?: number;
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

    // 3. Fall back to query parameter token (for mobile / direct download links)
    if (!token && typeof req.query.token === 'string') {
      token = req.query.token;
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
        tokenVersion: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    // Session revocation check: reject if tokenVersion is older than current database tokenVersion
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion < user.tokenVersion) {
      throw new UnauthorizedError('Your session has been invalidated. Please sign in again.');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedError('Account has been deactivated or deleted.');
    }

    req.user = user as AuthenticatedUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.wayrivo_token) {
      token = req.cookies.wayrivo_token;
    }

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
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
          tokenVersion: true,
        },
      });

      if (user && user.status !== 'SUSPENDED') {
        if (decoded.tokenVersion === undefined || decoded.tokenVersion >= user.tokenVersion) {
          req.user = user as AuthenticatedUser;
        }
      }
    } catch {
      // Ignore token verification errors for optional authentication
    }

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
