import { bookingRepository, CreateBookingItemInput } from '../repositories/booking.repository';
import { prisma } from '../config/db';
import { NotFoundError } from '../utils/errors';

export class BookingService {
  async createBooking(params: {
    userId: string;
    itineraryId?: string;
    items?: CreateBookingItemInput[];
    specialRequests?: string;
    currency?: string;
  }) {
    return bookingRepository.createBookingWithVerifiedPrices(params);
  }

  async getBookingById(id: string, userId?: string) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError(`Booking not found with id: ${id}`);
    }
    // If user provided, ensure they own it or are admin
    if (userId && booking.userId !== userId) {
      // Safe adoption for proposal-generated escrow bookings
      if (booking.specialRequests?.includes('[PROP_ID:')) {
        await prisma.booking.update({
          where: { id },
          data: { userId },
        });
        if (booking.itineraryId) {
          await prisma.itinerary.update({
            where: { id: booking.itineraryId },
            data: { userId },
          }).catch(() => {});
        }
        booking.userId = userId;
      } else {
        throw new NotFoundError(`Booking not found with id: ${id}`);
      }
    }
    return booking;
  }

  async getBookingByReference(reference: string, userId?: string) {
    const booking = await bookingRepository.findByReference(reference);
    if (!booking) {
      throw new NotFoundError(`Booking not found with reference: ${reference}`);
    }
    if (userId && booking.userId !== userId) {
      throw new NotFoundError(`Booking not found with reference: ${reference}`);
    }
    return booking;
  }

  async getUserBookings(userId: string) {
    return bookingRepository.findByUser(userId);
  }
}

export const bookingService = new BookingService();
