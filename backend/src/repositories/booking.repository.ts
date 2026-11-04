import { prisma } from '../config/db';
import { Booking, BookingStatus, BookingItemType, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';

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
   * 1. Prevents duplicate booking submissions for the same user and itinerary.
   * 2. Retrieves current inventory and validates live availability.
   * 3. Looks up official server prices for all items and computes the true total server-side.
   * 4. Creates the Booking and BookingItems in a single ACID transaction.
   */
  async createBookingWithVerifiedPrices(params: {
    userId: string;
    itineraryId?: string;
    items?: CreateBookingItemInput[];
    specialRequests?: string;
    currency?: string;
  }): Promise<Booking> {
    const { userId, itineraryId, items = [], specialRequests, currency = 'INR' } = params;

    return prisma.$transaction(async (tx) => {
      // 1. Prevent duplicate booking submissions
      if (itineraryId) {
        const existing = await tx.booking.findFirst({
          where: {
            userId,
            itineraryId,
            status: { in: [BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED, BookingStatus.ESCROW_HOLD] },
          },
        });
        if (existing) {
          throw new ConflictError(
            `A booking already exists for this itinerary (Reference: ${existing.bookingReference}, Status: ${existing.status}). Duplicate booking submission prevented.`
          );
        }
      }

      let serverCalculatedTotal = new Prisma.Decimal(0);
      const verifiedItems: {
        itemType: BookingItemType;
        referenceId?: string;
        title: string;
        unitPrice: Prisma.Decimal;
        quantity: number;
        totalPrice: Prisma.Decimal;
        notes?: string;
      }[] = [];

      // If items provided, validate each item and its live inventory
      if (items.length > 0) {
        for (const item of items) {
          let unitPrice = new Prisma.Decimal(0);
          let title = '';

          if (item.itemType === 'HOTEL') {
            const hotel = await tx.hotel.findUnique({ where: { id: item.referenceId } });
            if (!hotel) throw new NotFoundError(`Hotel not found with id: ${item.referenceId}`);
            if (hotel.availableRooms < item.quantity) {
              throw new BadRequestError(
                `Insufficient room availability for "${hotel.name}". Requested: ${item.quantity}, available: ${hotel.availableRooms}`
              );
            }
            unitPrice = hotel.pricePerNight;
            title = `Hotel Stay: ${hotel.name} (${hotel.stars}★)`;
          } else if (item.itemType === 'ACTIVITY') {
            const activity = await tx.activity.findUnique({ where: { id: item.referenceId } });
            if (!activity) throw new NotFoundError(`Activity not found with id: ${item.referenceId}`);
            if (activity.availableSlots < item.quantity) {
              throw new BadRequestError(
                `Insufficient slots for activity "${activity.title}". Requested: ${item.quantity}, available: ${activity.availableSlots}`
              );
            }
            unitPrice = activity.pricePerPerson;
            title = `Activity: ${activity.title}`;
          } else if (item.itemType === 'PACKAGE') {
            const pkg = await tx.travelPackage.findUnique({ where: { id: item.referenceId } });
            if (!pkg) throw new NotFoundError(`Package not found with id: ${item.referenceId}`);
            if (pkg.availableSeats < item.quantity) {
              throw new BadRequestError(
                `Insufficient seats for package "${pkg.title}". Requested: ${item.quantity}, available: ${pkg.availableSeats}`
              );
            }
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
      } else if (itineraryId) {
        // Fallback: derive verified line items from Itinerary record
        const itin = await tx.itinerary.findUnique({
          where: { id: itineraryId },
          include: { destination: true },
        });
        if (!itin) throw new NotFoundError(`Itinerary not found with id: ${itineraryId}`);

        serverCalculatedTotal = itin.totalEstimatedCost;
        verifiedItems.push({
          itemType: BookingItemType.CUSTOM,
          title: itin.title || `${itin.destination?.name || 'Custom'} Travel Itinerary`,
          unitPrice: itin.totalEstimatedCost,
          quantity: 1,
          totalPrice: itin.totalEstimatedCost,
          notes: `Complete bespoke travel plan (${itin.numberOfDays} days, ${itin.travelersCount} travelers)`,
        });
      } else {
        throw new BadRequestError('Booking must contain at least one valid item or itinerary reference.');
      }

      // Generate unique human-readable booking reference e.g. WR-2026-AB12CD
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const bookingReference = `WR-2026-${randomCode}`;

      // Create Booking record with server-calculated total
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
          itinerary: true,
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
            itemCount: verifiedItems.length,
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
