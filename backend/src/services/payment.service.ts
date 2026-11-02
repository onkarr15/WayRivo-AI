import { bookingRepository } from '../repositories/booking.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { paypalClient } from '../integrations/paypal/client';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { BookingStatus, PaymentStatus } from '@prisma/client';

export class PaymentService {
  /**
   * Initiate PayPal Order for Booking
   */
  async createPaymentOrder(params: {
    bookingId: string;
    userId: string;
    returnUrl?: string;
    cancelUrl?: string;
  }) {
    const { bookingId, userId, returnUrl, cancelUrl } = params;

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking not found with id: ${bookingId}`);
    }

    if (booking.userId !== userId) {
      throw new BadRequestError('You are not authorized to pay for this booking');
    }

    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.ESCROW_HOLD) {
      throw new BadRequestError('This booking is already paid and confirmed in escrow.');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError('Cannot pay for a cancelled booking.');
    }

    // Call PayPal Orders API
    const order = await paypalClient.createOrder({
      referenceId: booking.bookingReference,
      amount: booking.totalAmount.toFixed(2),
      currency: booking.currency,
      description: `WayRivo AI Escrow Booking ${booking.bookingReference}`,
      returnUrl,
      cancelUrl,
    });

    // Record payment initialization in DB
    const payment = await paymentRepository.createPaymentRecord({
      bookingId: booking.id,
      paypalOrderId: order.id,
      amount: booking.totalAmount,
      currency: booking.currency,
    });

    return {
      orderId: order.id,
      bookingReference: booking.bookingReference,
      amount: booking.totalAmount.toFixed(2),
      currency: booking.currency,
      status: payment.status,
      approvalUrl: order.links.find((l) => l.rel === 'approve')?.href,
    };
  }

  /**
   * Capture PayPal Order & Lock in Escrow
   */
  async capturePaymentOrder(params: {
    bookingId: string;
    paypalOrderId: string;
    userId: string;
    idempotencyKey?: string;
  }) {
    const { bookingId, paypalOrderId, userId, idempotencyKey } = params;

    // Check idempotency key if provided
    if (idempotencyKey) {
      const existingKeyPayment = await paymentRepository.findByIdempKey(idempotencyKey);
      if (existingKeyPayment && existingKeyPayment.status === PaymentStatus.CAPTURED) {
        return {
          payment: existingKeyPayment,
          isDuplicate: true,
          message: 'Payment was previously captured successfully (Idempotent response).',
        };
      }
    }

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking not found with id: ${bookingId}`);
    }

    if (booking.userId !== userId) {
      throw new BadRequestError('Unauthorized payment capture attempt.');
    }

    // Capture payment from PayPal
    const captureResult = await paypalClient.captureOrder(paypalOrderId);

    const captureUnit = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
    const paypalCaptureId = captureUnit?.id || `CAP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Atomically update DB records in transaction
    const updatedPayment = await paymentRepository.recordSuccessfulCapture({
      paypalOrderId,
      paypalCaptureId,
      payerEmail: captureResult.payer?.email_address,
      payerName: captureResult.payer?.name ? `${captureResult.payer.name.given_name || ''} ${captureResult.payer.name.surname || ''}`.trim() : undefined,
      payerId: captureResult.payer?.payer_id,
      captureData: captureResult,
      idempKey: idempotencyKey,
    });

    return {
      payment: updatedPayment,
      bookingStatus: BookingStatus.ESCROW_HOLD,
      message: 'Payment captured successfully and held safely in WayRivo Escrow until journey completion.',
    };
  }
}

export const paymentService = new PaymentService();
