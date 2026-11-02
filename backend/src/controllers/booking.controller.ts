import { Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

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

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const booking = await bookingService.getBookingById(req.params.id, isAdmin ? undefined : req.user?.id);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user!.id);
    sendSuccess(res, bookings);
  } catch (error) {
    next(error);
  }
};
