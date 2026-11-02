import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const getAdminStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [userCount, bookingCount, destinationCount, packageCount, totalEscrow] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.destination.count(),
      prisma.travelPackage.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { escrowStatus: 'HELD' },
      }),
    ]);

    sendSuccess(res, {
      totalUsers: userCount,
      totalBookings: bookingCount,
      totalDestinations: destinationCount,
      totalPackages: packageCount,
      totalEscrowHeld: totalEscrow._sum.amount || 0,
      systemHealth: 'OPERATIONAL',
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    sendSuccess(res, logs);
  } catch (error) {
    next(error);
  }
};
