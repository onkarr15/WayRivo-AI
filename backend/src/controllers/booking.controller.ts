import { Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { prisma } from '../config/db';
import { BookingStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.createBooking({
      userId: req.user!.id,
      itineraryId: req.body.itineraryId,
      items: req.body.items,
      specialRequests: req.body.specialRequests,
      currency: req.body.currency,
    });
    sendCreated(res, booking, 'Booking created successfully with verified server pricing');
  } catch (error) {
    next(error);
  }
};

export const enrichBookingMeta = (b: any) => {
  if (!b) return b;
  const reqText = b.specialRequests || '';
  const fromMatch = reqText.match(/\[FROM:(.*?)\]/);
  const destMatch = reqText.match(/\[DEST:(.*?)\]/);
  const locMatch = reqText.match(/\[LOC:(.*?)\]/);
  const expertMatch = reqText.match(/\[EXPERT:(.*?)\]/);

  b.departureLocation = fromMatch ? fromMatch[1] : (b.departureLocation || 'Mumbai');
  b.tripDestination = destMatch ? destMatch[1] : (b.itinerary?.title || b.itinerary?.destination?.name || 'Kerala Backwaters');
  b.destinationLocation = locMatch ? locMatch[1] : (
    b.itinerary?.destination
      ? `${b.itinerary.destination.name}, ${b.itinerary.destination.state ? `${b.itinerary.destination.state}, ` : ''}${b.itinerary.destination.country || 'India'}`
      : 'Kerala, India'
  );
  b.expertDetails = expertMatch ? expertMatch[1] : undefined;
  return b;
};

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const booking = await bookingService.getBookingById(req.params.id, isAdmin ? undefined : req.user?.id);
    sendSuccess(res, enrichBookingMeta(booking));
  } catch (error) {
    next(error);
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user!.id);
    if (Array.isArray(bookings)) {
      bookings.forEach(enrichBookingMeta);
    }
    sendSuccess(res, bookings);
  } catch (error) {
    next(error);
  }
};

export const cancelUnpaidBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.userId !== req.user!.id && req.user?.role !== 'ADMIN') {
      throw new ForbiddenError('Unauthorized to cancel this booking');
    }
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestError(
        'Only unpaid pending bookings can be directly cancelled. For confirmed bookings, please submit an escrow cancellation request.'
      );
    }
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: BookingStatus.CANCELLED },
    });
    sendSuccess(res, enrichBookingMeta(updated), 'Unpaid booking cancelled successfully');
  } catch (error) {
    next(error);
  }
};
