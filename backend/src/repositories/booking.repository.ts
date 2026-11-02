import { prisma } from '../config/db';
import { Booking, BookingStatus, BookingItemType, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

export interface CreateBookingItemInput {
  itemType: BookingItemType;
  referenceId: string;
  quantity: number;
  notes?: string;
}

export class BookingRepository {
  async findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        itinerary: {
          include: { days: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findByReference(bookingReference: string) {
    return prisma.booking.findUnique({
      where: { bookingReference },
      include: {
        items: true,
        payment: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findByUser(userId: string) {
    return prisma.booking.findMany({
      where: { userId },
      include: {
        items: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Atomic Booking Creation:
   * Looks up official server prices for all items, computes the true total,
   * creates the Booking and BookingItems in a single ACID transaction.
   */
  async createBookingWithVerifiedPrices(params: {
    userId: string;
    itineraryId?: string;
    items: CreateBookingItemInput[];
    specialRequests?: string;
    currency?: string;
  }): Promise<Booking> {
    const { userId, itineraryId, items, specialRequests, currency = 'INR' } = params;

    return prisma.$transaction(async (tx) => {
      let serverCalculatedTotal = new Prisma.Decimal(0);
      const verifiedItems: {
        itemType: BookingItemType;
        referenceId: string;
        title: string;
        unitPrice: Prisma.Decimal;
        quantity: number;
        totalPrice: Prisma.Decimal;
        notes?: string;
      }[] = [];

      for (const item of items) {
        let unitPrice = new Prisma.Decimal(0);
        let title = '';

        if (item.itemType === 'HOTEL') {
          const hotel = await tx.hotel.findUnique({ where: { id: item.referenceId } });
          if (!hotel) throw new NotFoundError(`Hotel not found with id: ${item.referenceId}`);
          unitPrice = hotel.pricePerNight;
          title = `Hotel Stay: ${hotel.name} (${hotel.stars}★)`;
        } else if (item.itemType === 'ACTIVITY') {
          const activity = await tx.activity.findUnique({ where: { id: item.referenceId } });
          if (!activity) throw new NotFoundError(`Activity not found with id: ${item.referenceId}`);
          unitPrice = activity.pricePerPerson;
          title = `Activity: ${activity.title}`;
        } else if (item.itemType === 'PACKAGE') {
          const pkg = await tx.travelPackage.findUnique({ where: { id: item.referenceId } });
          if (!pkg) throw new NotFoundError(`Package not found with id: ${item.referenceId}`);
          unitPrice = pkg.totalPrice;
          title = `Curated Package: ${pkg.title}`;
        } else {
          throw new BadRequestError(`Unsupported booking item type: ${item.itemType}`);
        }

        const itemTotal = unitPrice.mul(item.quantity);
        serverCalculatedTotal = serverCalculatedTotal.add(itemTotal);

        verifiedItems.push({
          itemType: item.itemType,
          referenceId: item.referenceId,
          title,
          unitPrice,
          quantity: item.quantity,
          totalPrice: itemTotal,
          notes: item.notes,
        });
      }

      // Generate unique human-readable booking reference e.g. WR-2026-AB12CD
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const bookingReference = `WR-2026-${randomCode}`;

      // Create Booking record
      const booking = await tx.booking.create({
        data: {
          bookingReference,
          userId,
          itineraryId,
          totalAmount: serverCalculatedTotal,
          currency,
          specialRequests,
          status: BookingStatus.PENDING_PAYMENT,
          items: {
            create: verifiedItems,
          },
        },
        include: {
          items: true,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_BOOKING',
          entityType: 'Booking',
          entityId: booking.id,
          details: {
            bookingReference,
            totalAmount: serverCalculatedTotal.toString(),
            itemCount: items.length,
          },
        },
      });

      return booking;
    });
  }

  async updateStatus(bookingId: string, status: BookingStatus, confirmedAt?: Date) {
    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        ...(confirmedAt && { confirmedAt }),
      },
    });
  }
}

export const bookingRepository = new BookingRepository();
