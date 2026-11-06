import { prisma } from '../config/db';
import { Payment, PaymentStatus, EscrowStatus, BookingStatus, Prisma } from '@prisma/client';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors';
import crypto from 'crypto';

export class PaymentRepository {
  async findById(paymentId: string): Promise<any> {
    return prisma.payment.findFirst({
      where: {
        OR: [
          { id: paymentId },
          { paypalOrderId: paymentId },
          { paypalCaptureId: paymentId },
          { bookingId: paymentId },
          { wayrivoTransactionId: paymentId },
          { paymentSessionId: paymentId },
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

  async findByOrderId(paypalOrderId: string): Promise<any> {
    return prisma.payment.findUnique({
      where: { paypalOrderId },
      include: { booking: true },
    });
  }

  async findByBookingId(bookingId: string): Promise<any> {
    return prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true },
    });
  }

  async findByIdempKey(idempKey: string): Promise<any> {
    return prisma.payment.findUnique({
      where: { idempKey },
      include: { booking: true },
    });
  }

  async findBySessionId(paymentSessionId: string): Promise<any> {
    return prisma.payment.findFirst({
      where: {
        OR: [
          { paymentSessionId },
          { id: paymentSessionId },
          { bookingId: paymentSessionId },
        ],
      },
      include: {
        booking: {
          include: {
            items: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  /**
   * Create or Retrieve 6-Minute Payment Session
   * Returns authoritative server start time, expiration time, and remaining seconds.
   */
  async createOrGetPaymentSession(params: {
    bookingId: string;
    amount: Prisma.Decimal;
    currency: string;
    sessionTtlMinutes?: number;
  }): Promise<{ payment: any; isExisting: boolean; remainingSeconds: number }> {
    const { bookingId, amount, currency, sessionTtlMinutes = 6 } = params;
    const now = new Date();

    const existing = await prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true },
    });

    // If an existing session is still active and not captured/completed/expired
    if (
      existing &&
      existing.status !== PaymentStatus.CAPTURED &&
      existing.status !== PaymentStatus.EXPIRED &&
      existing.expiresAt &&
      existing.expiresAt > now
    ) {
      const remainingSeconds = Math.max(
        0,
        Math.floor((existing.expiresAt.getTime() - now.getTime()) / 1000)
      );
      return {
        payment: existing,
        isExisting: true,
        remainingSeconds,
      };
    }

    // Otherwise, generate a fresh 6-minute session
    const paymentSessionId = `psess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const startedAt = now;
    const expiresAt = new Date(startedAt.getTime() + sessionTtlMinutes * 60 * 1000);
    const remainingSeconds = sessionTtlMinutes * 60;

    if (existing) {
      if (existing.status === PaymentStatus.CAPTURED) {
        throw new ConflictError('A payment has already been captured and escrowed for this booking.');
      }
      const updated = await prisma.payment.update({
        where: { id: existing.id },
        data: {
          paymentSessionId,
          startedAt,
          expiresAt,
          status: PaymentStatus.CREATED,
          amount,
          currency,
        },
        include: { booking: true },
      });
      return { payment: updated, isExisting: false, remainingSeconds };
    }

    const created = await prisma.payment.create({
      data: {
        bookingId,
        paymentSessionId,
        paypalOrderId: `PAYPAL-PENDING-${Date.now()}`,
        amount,
        currency,
        status: PaymentStatus.CREATED,
        escrowStatus: EscrowStatus.HELD,
        startedAt,
        expiresAt,
      },
      include: { booking: true },
    });

    return { payment: created, isExisting: false, remainingSeconds };
  }

  /**
   * Mark Payment Session as Expired
   * Completed payments are never expired.
   */
  async expirePaymentSession(params: {
    sessionId?: string;
    bookingId?: string;
  }): Promise<any> {
    const { sessionId, bookingId } = params;
    if (!sessionId && !bookingId) return null;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          ...(sessionId ? [{ paymentSessionId: sessionId }, { id: sessionId }] : []),
          ...(bookingId ? [{ bookingId }] : []),
        ],
      },
      include: { booking: true },
    });

    if (!payment) return null;

    // Completed or captured payments can NEVER transition to EXPIRED
    if (payment.status === PaymentStatus.CAPTURED) {
      return payment;
    }

    return prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.EXPIRED,
        expiresAt: new Date(),
      },
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
  }): Promise<any> {
    const { bookingId, paypalOrderId, amount, currency, idempKey } = params;

    // Check if payment already exists for this booking
    const existing = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existing) {
      if (existing.status === PaymentStatus.CAPTURED) {
        throw new ConflictError('A payment has already been captured and escrowed for this booking.');
      }
      // Re-use and update existing pending payment record with new PayPal order ID while preserving/initializing 6-minute session
      const now = new Date();
      const startedAt = existing.startedAt || now;
      const expiresAt = existing.expiresAt || new Date(now.getTime() + 6 * 60 * 1000);
      const paymentSessionId = existing.paymentSessionId || `psess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      return prisma.payment.update({
        where: { id: existing.id },
        data: {
          paypalOrderId,
          amount,
          currency,
          status: PaymentStatus.CREATED,
          paymentSessionId,
          startedAt,
          expiresAt,
          ...(idempKey && { idempKey }),
        },
      });
    }

    const now = new Date();
    const startedAt = now;
    const expiresAt = new Date(now.getTime() + 6 * 60 * 1000);
    const paymentSessionId = `psess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return prisma.payment.create({
      data: {
        bookingId,
        paymentSessionId,
        paypalOrderId,
        amount,
        currency,
        idempKey,
        startedAt,
        expiresAt,
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

      // Generate or preserve unique 12-digit numerical WayRivo Transaction ID (no leading zeros, purely digits)
      let wayrivoTransactionId = payment.wayrivoTransactionId;
      if (!wayrivoTransactionId) {
        let uniqueFound = false;
        let attempts = 0;
        while (!uniqueFound && attempts < 15) {
          attempts++;
          const candidate = crypto.randomInt(100_000_000_000, 1_000_000_000_000).toString();
          const existingWithId = await tx.payment.findUnique({
            where: { wayrivoTransactionId: candidate },
          });
          if (!existingWithId) {
            wayrivoTransactionId = candidate;
            uniqueFound = true;
          }
        }
        if (!wayrivoTransactionId) {
          wayrivoTransactionId = crypto.randomInt(100_000_000_000, 1_000_000_000_000).toString();
        }
      }

      const transactionCompletedAt = payment.transactionCompletedAt || new Date();

      // Update Payment with 12-digit WayRivo ID, completion timestamp and provider
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          wayrivoTransactionId,
          paypalCaptureId,
          status: PaymentStatus.CAPTURED,
          escrowStatus: EscrowStatus.HELD,
          payerEmail,
          payerName,
          payerId,
          paymentProvider: 'PayPal Sandbox',
          transactionCompletedAt,
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
          userId: payment.booking?.userId || null,
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
      if (payment.booking?.items) {
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
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminUserId || payment.booking?.userId || null,
          action: 'PAYMENT_REFUNDED_BY_ADMIN',
          entityType: 'Payment',
          entityId: payment.id,
          details: {
            bookingId: payment.bookingId,
            bookingReference: payment.booking?.bookingReference || 'N/A',
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
          userId: payment.booking?.userId || null,
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
