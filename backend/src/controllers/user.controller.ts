import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { prisma } from '../config/db';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { enrichBookingMeta } from './booking.controller';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.user!.id);
    sendSuccess(res, profile, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await authService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, updated, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.changePassword(req.user!.id, req.body);
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.deleteAccount(req.user!.id, req.body);
    res.clearCookie('wayrivo_token');
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const getUserDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const [bookings, savedItineraries, conversations, payments, user] = await Promise.all([
      prisma.booking.findMany({
        where: { userId },
        include: {
          items: true,
          payment: true,
          itinerary: {
            include: { destination: { select: { id: true, name: true, state: true, imageUrl: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.itinerary.findMany({
        where: { userId },
        include: { destination: { select: { id: true, name: true, state: true, imageUrl: true } }, days: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.conversation.findMany({
        where: { userId },
        include: {
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      }),
      prisma.payment.findMany({
        where: { booking: { userId } },
        include: {
          booking: {
            select: {
              bookingReference: true,
              totalAmount: true,
              status: true,
              itinerary: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          country: true,
          state: true,
          city: true,
          address: true,
          postalCode: true,
          bio: true,
          dateOfBirth: true,
          gender: true,
          agencyName: true,
          websiteUrl: true,
          specializations: true,
          yearsOfExperience: true,
          languages: true,
          verificationStatus: true,
          preferredDestinations: true,
          travelInterests: true,
          budgetPreference: true,
          preferredCurrency: true,
          avatarUrl: true,
          isEmailVerified: true,
          createdAt: true,
        },
      }),
    ]);

    // Compute Overview KPIs
    const totalTrips = bookings.length;

    // Upcoming Trips: Confirmed or Escrow Held, and either startDate in future or confirmed
    const upcomingTrips = bookings.filter((b) => {
      if (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.ESCROW_HOLD) {
        if (b.itinerary?.startDate) {
          return new Date(b.itinerary.startDate) >= now;
        }
        return true;
      }
      return false;
    });

    // Completed Trips
    const completedTrips = bookings.filter((b) => {
      if (b.status === BookingStatus.CONFIRMED) {
        if (b.itinerary?.endDate) {
          return new Date(b.itinerary.endDate) < now;
        }
        return false;
      }
      return false;
    });

    // Pending Payments
    const pendingBookings = bookings.filter((b) => b.status === BookingStatus.PENDING_PAYMENT);

    // Total Expenditure
    const totalExpenditure = bookings
      .filter((b) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.ESCROW_HOLD || b.payment?.status === PaymentStatus.CAPTURED)
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);

    // Enrich all bookings with destination, departure and expert metadata
    bookings.forEach(enrichBookingMeta);

    sendSuccess(res, {
      overview: {
        totalTrips,
        upcomingBookingsCount: upcomingTrips.length,
        completedTripsCount: completedTrips.length,
        pendingPaymentsCount: pendingBookings.length,
        totalExpenditure,
        preferredCurrency: user?.preferredCurrency || 'INR',
      },
      upcomingTrips,
      completedTrips,
      pendingTrips: pendingBookings,
      bookings,
      savedItineraries,
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title || 'Trip Planning Session',
        messageCount: c._count.messages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      payments,
      user,
    });
  } catch (error) {
    next(error);
  }
};
