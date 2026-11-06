import { prisma } from '../config/db';
import { Payment, PaymentStatus, EscrowStatus, BookingStatus, Prisma } from '@prisma/client';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors';

export class PaymentRepository {
  async findById(paymentId: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: {
        OR: [
          { id: paymentId },
          { paypalOrderId: paymentId },
          { paypalCaptureId: paymentId },
          { bookingId: paymentId },
        ],
      },
      include: {
        booking: {
          include: {
            items: true,
            itinerary: {
              include: { destination: true, days: true },
            },
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
  }

  async findByOrderId(paypalOrderId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { paypalOrderId },
      include: { booking: true },
    });
  }

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true },
    });
  }

  async findByIdempKey(idempKey: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { idempKey },
      include: { booking: true },
    });
  }

  /**
   * Idempotent Order Creation Record
   */
  async createPaymentRecord(params: {
    bookingId: string;
    paypalOrderId: string;
    amount: Prisma.Decimal;
    currency: string;
    idempKey?: string;
  }): Promise<Payment> {
    const { bookingId, paypalOrderId, amount, currency, idempKey } = params;

    // Check if payment already exists for this booking
    const existing = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existing) {
      if (existing.status === PaymentStatus.CAPTURED) {
        throw new ConflictError('A payment has already been captured and escrowed for this booking.');
      }
      // Re-use and update existing pending payment record with new PayPal order ID
      return prisma.payment.update({
        where: { id: existing.id },
        data: {
          paypalOrderId,
          amount,
          currency,
          status: PaymentStatus.CREATED,
          ...(idempKey && { idempKey }),
        },
      });
    }

    return prisma.payment.create({
      data: {
        bookingId,
        paypalOrderId,
        amount,
        currency,
        idempKey,
        status: PaymentStatus.CREATED,
        escrowStatus: EscrowStatus.HELD,
      },
    });
  }

  /**
   * Atomic Payment Capture & Escrow Lock Transaction:
   * 1. Updates Payment status to CAPTURED / ESCROW_LOCKED
   * 2. Stores paypalCaptureId
   * 3. Transitions Booking status to ESCROW_HOLD or CONFIRMED
   * 4. Logs audit event
   */
  async recordSuccessfulCapture(params: {
    paypalOrderId: string;
    paypalCaptureId: string;
    payerEmail?: string;
    payerName?: string;
    payerId?: string;
    captureData?: any;
    idempKey?: string;
  }) {
    const { paypalOrderId, paypalCaptureId, payerEmail, payerName, payerId, captureData, idempKey } = params;

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { paypalOrderId },
        include: { booking: true },
      });

      if (!payment) {
        throw new NotFoundError(`Payment record not found for PayPal Order: ${paypalOrderId}`);
      }

      // Check if already captured (Idempotency)
      if (payment.status === PaymentStatus.CAPTURED && payment.paypalCaptureId === paypalCaptureId) {
        return payment;
      }

      if (payment.status === PaymentStatus.CAPTURED) {
        throw new BadRequestError('Payment is already marked as captured with a different capture ID.');
      }

      // Update Payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          paypalCaptureId,
          status: PaymentStatus.CAPTURED,
          escrowStatus: EscrowStatus.HELD,
          payerEmail,
          payerName,
          payerId,
          captureData,
          ...(idempKey && { idempKey }),
        },
      });

      // Advance Booking status from PENDING_PAYMENT to CONFIRMED (in ESCROW_HOLD)
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.ESCROW_HOLD,
          confirmedAt: new Date(),
          escrowReleaseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Escrow locks until trip completion
        },
      });

      // Atomically decrement inventory availability for booked items
      const bookingWithItems = await tx.booking.findUnique({
        where: { id: payment.bookingId },
        include: { items: true },
      });
      if (bookingWithItems?.items) {
        for (const item of bookingWithItems.items) {
          if (item.referenceId) {
            if (item.itemType === 'HOTEL') {
              await tx.hotel.update({
                where: { id: item.referenceId },
                data: { availableRooms: { decrement: item.quantity } },
              }).catch(() => {});
            } else if (item.itemType === 'ACTIVITY') {
              await tx.activity.update({
                where: { id: item.referenceId },
                data: { availableSlots: { decrement: item.quantity } },
              }).catch(() => {});
            } else if (item.itemType === 'PACKAGE') {
              await tx.travelPackage.update({
                where: { id: item.referenceId },
                data: { availableSeats: { decrement: item.quantity } },
              }).catch(() => {});
            }
          }
        }
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: payment.booking.userId,
          action: 'PAYMENT_CAPTURED_ESCROW_LOCKED',
          entityType: 'Payment',
          entityId: payment.id,
          details: {
            paypalOrderId,
            paypalCaptureId,
            amount: payment.amount.toString(),
            escrowStatus: EscrowStatus.HELD,
          },
        },
      });

      return updatedPayment;
    });
  }

  /**
   * Record Administrative Refund (Supported PayPal Refund Workflow)
   */
  async recordRefund(params: {
    paymentId: string;
    refundId: string;
    refundAmount: Prisma.Decimal;
    reason?: string;
    adminUserId?: string;
  }) {
    const { paymentId, refundId, refundAmount, reason, adminUserId } = params;

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { booking: { include: { items: true } } },
      });

      if (!payment) {
        throw new NotFoundError(`Payment record not found with id: ${paymentId}`);
      }

      if (payment.status !== PaymentStatus.CAPTURED) {
        throw new BadRequestError(
          `Cannot refund payment in status: ${payment.status}. Only captured payments can be refunded.`
        );
      }

      // Update Payment
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          escrowStatus: EscrowStatus.REFUNDED,
          captureData: {
            ...(typeof payment.captureData === 'object' && payment.captureData !== null ? payment.captureData : {}),
            refund: {
              refundId,
              amount: refundAmount.toString(),
              reason,
              refundedAt: new Date().toISOString(),
              adminUserId,
            },
          },
        },
      });

      // Transition Booking status to REFUNDED
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.REFUNDED,
        },
      });

      // Restore inventory counts
      for (const item of payment.booking.items) {
        if (item.referenceId) {
          if (item.itemType === 'HOTEL') {
            await tx.hotel.update({
              where: { id: item.referenceId },
              data: { availableRooms: { increment: item.quantity } },
            }).catch(() => {});
          } else if (item.itemType === 'ACTIVITY') {
            await tx.activity.update({
              where: { id: item.referenceId },
              data: { availableSlots: { increment: item.quantity } },
            }).catch(() => {});
          } else if (item.itemType === 'PACKAGE') {
            await tx.travelPackage.update({
              where: { id: item.referenceId },
              data: { availableSeats: { increment: item.quantity } },
            }).catch(() => {});
          }
        }
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminUserId || payment.booking.userId,
          action: 'PAYMENT_REFUNDED_BY_ADMIN',
          entityType: 'Payment',
          entityId: payment.id,
          details: {
            bookingId: payment.bookingId,
            bookingReference: payment.booking.bookingReference,
            paypalCaptureId: payment.paypalCaptureId,
            refundId,
            refundAmount: refundAmount.toString(),
            reason,
            adminUserId,
          },
        },
      });

      return updatedPayment;
    });
  }

  /**
   * Record Failed Payment Capture
   */
  async recordFailedCapture(paypalOrderId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { paypalOrderId },
        include: { booking: true },
      });

      if (!payment) return null;

      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          captureData: {
            failureReason: reason || 'Payment capture was denied by PayPal.',
            failedAt: new Date().toISOString(),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: payment.booking.userId,
          action: 'PAYMENT_CAPTURE_FAILED',
          entityType: 'Payment',
          entityId: payment.id,
          details: {
            paypalOrderId,
            reason,
          },
        },
      });

      return updated;
    });
  }
}

export const paymentRepository = new PaymentRepository();
