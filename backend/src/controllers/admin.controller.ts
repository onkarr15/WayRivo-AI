import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { inventoryService } from '../services/inventory.service';
import { UserRole, BookingStatus, PaymentStatus, EscrowStatus } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

export const getAdminStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [userCount, bookingCount, destinationCount, packageCount, totalEscrow, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.destination.count(),
      prisma.travelPackage.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { escrowStatus: EscrowStatus.HELD },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.CAPTURED },
      }),
    ]);

    sendSuccess(res, {
      totalUsers: userCount,
      totalBookings: bookingCount,
      totalDestinations: destinationCount,
      totalPackages: packageCount,
      totalEscrowHeld: totalEscrow._sum.amount ? Number(totalEscrow._sum.amount) : 0,
      totalRevenue: totalRevenue._sum.amount ? Number(totalRevenue._sum.amount) : 0,
      systemHealth: 'OPERATIONAL',
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminAnalytics = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalBookings,
      successfulPayments,
      pendingPayments,
      revenueAgg,
      escrowAgg,
      refundAgg,
      destinations,
      packages,
      agentActions,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.payment.count({ where: { status: PaymentStatus.CAPTURED } }),
      prisma.booking.count({ where: { status: BookingStatus.PENDING_PAYMENT } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.CAPTURED },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { escrowStatus: EscrowStatus.HELD },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.REFUNDED },
      }),
      prisma.destination.findMany({
        take: 10,
        select: {
          id: true,
          name: true,
          state: true,
          imageUrl: true,
          itineraries: {
            select: {
              id: true,
              booking: {
                select: { totalAmount: true, status: true },
              },
            },
          },
        },
      }),
      prisma.travelPackage.findMany({
        take: 8,
        select: {
          id: true,
          title: true,
          totalPrice: true,
          pricePerPerson: true,
          durationDays: true,
          availableSeats: true,
          destination: { select: { name: true } },
        },
      }),
      prisma.agentAction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          createdAt: true,
          totalAmount: true,
          status: true,
        },
      }),
    ]);

    // 1. Popular Destinations Aggregation
    const popularDestinations = destinations.map((d) => {
      let bookingCount = 0;
      let revenue = 0;
      d.itineraries.forEach((itin) => {
        if (itin.booking) {
          bookingCount += 1;
          revenue += Number(itin.booking.totalAmount);
        }
      });
      return {
        id: d.id,
        name: d.name,
        state: d.state,
        bookingCount,
        revenue,
      };
    }).sort((a, b) => b.bookingCount - a.bookingCount);

    // 2. Booking Trends Timeline (Group by date or month)
    const trendsMap: Record<string, { date: string; bookings: number; revenue: number }> = {};
    recentBookings.forEach((b) => {
      const dateKey = new Date(b.createdAt).toISOString().split('T')[0];
      if (!trendsMap[dateKey]) {
        trendsMap[dateKey] = { date: dateKey, bookings: 0, revenue: 0 };
      }
      trendsMap[dateKey].bookings += 1;
      if (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.ESCROW_HOLD) {
        trendsMap[dateKey].revenue += Number(b.totalAmount);
      }
    });

    const bookingTrends = Object.values(trendsMap).sort((a, b) => a.date.localeCompare(b.date));
    // Provide baseline timeline if empty
    if (bookingTrends.length === 0) {
      bookingTrends.push({
        date: new Date().toISOString().split('T')[0],
        bookings: totalBookings,
        revenue: revenueAgg._sum.amount ? Number(revenueAgg._sum.amount) : 0,
      });
    }

    // 3. Package Performance
    const packagePerformance = packages.map((p) => ({
      id: p.id,
      title: p.title,
      destination: p.destination?.name || 'India',
      price: Number(p.totalPrice || p.pricePerPerson),
      durationDays: p.durationDays,
      availableSeats: p.availableSeats,
    }));

    // 4. AI Usage Analytics
    const toolCounts: Record<string, number> = {};
    let totalLatency = 0;
    agentActions.forEach((action) => {
      const type = action.actionType || 'TOOL_CALL';
      toolCounts[type] = (toolCounts[type] || 0) + 1;
      totalLatency += action.executionMs || 0;
    });

    const averageLatencyMs = agentActions.length > 0 ? Math.round(totalLatency / agentActions.length) : 120;
    const toolBreakdown = Object.entries(toolCounts).map(([tool, count]) => ({
      tool,
      count,
    }));

    sendSuccess(res, {
      totalBookings,
      successfulPayments,
      pendingPayments,
      totalRevenue: revenueAgg._sum.amount ? Number(revenueAgg._sum.amount) : 0,
      totalEscrowHeld: escrowAgg._sum.amount ? Number(escrowAgg._sum.amount) : 0,
      totalRefunded: refundAgg._sum.amount ? Number(refundAgg._sum.amount) : 0,
      popularDestinations,
      bookingTrends,
      packagePerformance,
      aiAnalytics: {
        totalToolCalls: agentActions.length,
        averageLatencyMs,
        toolBreakdown,
        recentActions: agentActions.slice(0, 15).map((a) => ({
          id: a.id,
          actionType: a.actionType,
          executionMs: a.executionMs,
          status: a.status,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 0;
    const size = parseInt(req.query.size as string, 10) || 10;
    const search = (req.query.search as string) || '';
    const role = (req.query.role as string) || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      where.role = role as UserRole;
    }

    const [totalElements, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: page * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEmailVerified: true,
          preferredCurrency: true,
          createdAt: true,
          _count: {
            select: { bookings: true, conversations: true },
          },
          bookings: {
            select: { totalAmount: true, status: true },
          },
        },
      }),
    ]);

    const formatted = users.map((u) => {
      const totalSpent = u.bookings
        .filter((b) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.ESCROW_HOLD)
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isEmailVerified: u.isEmailVerified,
        preferredCurrency: u.preferredCurrency,
        createdAt: u.createdAt,
        totalBookings: u._count.bookings,
        totalConversations: u._count.conversations,
        totalSpent,
      };
    });

    sendSuccess(res, {
      content: formatted,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      page,
      size,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(UserRole).includes(role)) {
      throw new BadRequestError('Invalid user role specified');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_USER_ROLE',
        entityType: 'User',
        entityId: id,
        details: { newRole: role, targetEmail: updated.email },
      },
    });

    sendSuccess(res, updated, `User role updated to ${role}`);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const statusParam = req.query.status as string;
    const isEmailVerified = statusParam === 'VERIFIED' || statusParam === 'true';

    const updated = await prisma.user.update({
      where: { id },
      data: { isEmailVerified },
      select: { id: true, name: true, email: true, isEmailVerified: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_USER_STATUS',
        entityType: 'User',
        entityId: id,
        details: { isEmailVerified },
      },
    });

    sendSuccess(res, updated, 'User status updated');
  } catch (error) {
    next(error);
  }
};

export const getAdminBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 0;
    const size = parseInt(req.query.size as string, 10) || 10;
    const status = (req.query.status as string) || '';
    const search = (req.query.search as string) || '';

    const where: any = {};
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      where.status = status as BookingStatus;
    }
    if (search) {
      where.OR = [
        { bookingReference: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [totalElements, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        skip: page * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          payment: true,
          items: true,
          itinerary: {
            include: { destination: { select: { id: true, name: true, state: true } } },
          },
        },
      }),
    ]);

    sendSuccess(res, {
      bookings,
      content: bookings,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      page,
      size,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminPayments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 0;
    const size = parseInt(req.query.size as string, 10) || 10;
    const escrowStatus = (req.query.escrowStatus as string) || '';

    const where: any = {};
    if (escrowStatus && Object.values(EscrowStatus).includes(escrowStatus as EscrowStatus)) {
      where.escrowStatus = escrowStatus as EscrowStatus;
    }

    const [totalElements, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip: page * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              itinerary: { select: { title: true } },
            },
          },
        },
      }),
    ]);

    sendSuccess(res, {
      content: payments,
      payments,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      page,
      size,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminCancellations = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cancellations = await prisma.booking.findMany({
      where: {
        OR: [
          { status: BookingStatus.CANCELLED },
          { specialRequests: { contains: 'cancellation', mode: 'insensitive' } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        payment: true,
        items: true,
        itinerary: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    sendSuccess(res, cancellations);
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
    sendSuccess(res, { content: logs, logs });
  } catch (error) {
    next(error);
  }
};

export const getInventoryOverview = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const overview = await inventoryService.getInventoryOverview();
    sendSuccess(res, overview);
  } catch (error) {
    next(error);
  }
};
