import { prisma } from '../config/db';
import { Payment, PaymentStatus, EscrowStatus, BookingStatus, Prisma } from '@prisma/client';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors';

export class PaymentRepository {
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
      if (existing.paypalOrderId === paypalOrderId) {
        return existing;
      }
      throw new ConflictError('A payment has already been initiated for this booking.');
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
}

export const paymentRepository = new PaymentRepository();
