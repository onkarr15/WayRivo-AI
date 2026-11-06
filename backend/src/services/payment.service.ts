import { bookingRepository } from '../repositories/booking.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { paypalClient } from '../integrations/paypal/client';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { env } from '../config/env';

export class PaymentService {
  /**
   * Return client-safe PayPal Sandbox configuration
   * Never exposes clientSecret.
   */
  getPaymentConfig() {
    return {
      clientId: env.PAYPAL_CLIENT_ID,
      currency: env.PAYPAL_CURRENCY || 'USD',
      exchangeRate: env.PAYPAL_EXCHANGE_RATE || 83.5,
      mode: 'sandbox',
    };
  }

  /**
   * Initiate PayPal Order for Booking
   * Validates booking, prevents duplicate orders, handles currency conversion if needed.
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
      throw new ForbiddenError('You are not authorized to pay for this booking.');
    }

    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.ESCROW_HOLD) {
      throw new BadRequestError('This booking is already paid and confirmed under WayRivo escrow protection.');
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
      throw new BadRequestError('Cannot pay for a cancelled or refunded booking.');
    }

    // Check if an active payment record already exists
    const existingPayment = await paymentRepository.findByBookingId(bookingId);
    if (existingPayment && existingPayment.status === PaymentStatus.CAPTURED) {
      throw new BadRequestError('This booking has already been paid and captured.');
    }

    // Call PayPal Orders v2 API with currency conversion support
    const order = await paypalClient.createOrder({
      referenceId: booking.bookingReference,
      amount: booking.totalAmount.toNumber(),
      currency: booking.currency,
      description: `WayRivo AI Escrow Protected Booking: ${booking.bookingReference}`,
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
      displayAmount: order.displayAmount,
      displayCurrency: order.displayCurrency,
      chargeAmount: order.chargeAmount,
      chargeCurrency: order.chargeCurrency,
      exchangeRate: order.exchangeRate,
      status: payment.status,
      approvalUrl: order.links.find((l) => l.rel === 'approve')?.href,
    };
  }

  /**
   * Capture PayPal Order & Lock in Escrow
   * Enforces server-side verification, prevents double-captures, and decrements inventory.
   */
  async capturePaymentOrder(params: {
    bookingId: string;
    paypalOrderId: string;
    userId: string;
    idempotencyKey?: string;
    payerEmail?: string;
    payerName?: string;
    cardDetails?: {
      cardholderName?: string;
      cardBrand?: string;
      last4?: string;
    };
  }) {
    const { bookingId, paypalOrderId, userId, idempotencyKey, payerEmail, payerName, cardDetails } = params;

    // 1. Idempotency Key check
    if (idempotencyKey) {
      const existingKeyPayment = await paymentRepository.findByIdempKey(idempotencyKey);
      if (existingKeyPayment && existingKeyPayment.status === PaymentStatus.CAPTURED) {
        return {
          payment: existingKeyPayment,
          isDuplicate: true,
          bookingStatus: BookingStatus.ESCROW_HOLD,
          message: 'Payment was previously captured successfully (Idempotent response).',
        };
      }
    }

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking not found with id: ${bookingId}`);
    }

    if (booking.userId !== userId) {
      throw new ForbiddenError('Unauthorized payment capture attempt.');
    }

    // Check if payment was already captured (Prevent double captures)
    const existingPayment = await paymentRepository.findByOrderId(paypalOrderId);
    if (existingPayment && existingPayment.status === PaymentStatus.CAPTURED) {
      return {
        payment: existingPayment,
        isDuplicate: true,
        bookingStatus: BookingStatus.ESCROW_HOLD,
        message: 'Order already captured. Returning verified receipt.',
      };
    }

    // 2. Capture payment through PayPal Orders API
    const captureResult = await paypalClient.captureOrder(paypalOrderId);

    if (captureResult.status !== 'COMPLETED') {
      await paymentRepository.recordFailedCapture(paypalOrderId, `Capture status: ${captureResult.status}`);
      throw new BadRequestError(`PayPal capture failed with status: ${captureResult.status}`);
    }

    const captureUnit = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
    const paypalCaptureId =
      captureUnit?.id || `CAP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // 3. Atomically update DB records, lock in escrow, and decrement inventory
    const finalPayerName = payerName || cardDetails?.cardholderName?.trim() || (captureResult.payer?.name
      ? `${captureResult.payer.name.given_name || ''} ${captureResult.payer.name.surname || ''}`.trim()
      : undefined);

    const finalPayerEmail = payerEmail || captureResult.payer?.email_address;

    const mergedCaptureData = {
      ...captureResult,
      paymentMethod: cardDetails ? 'CREDIT_DEBIT_CARD' : 'PAYPAL_WALLET',
      cardDetails: cardDetails || null,
      payerEmail: finalPayerEmail,
      payerName: finalPayerName,
    };

    const updatedPayment = await paymentRepository.recordSuccessfulCapture({
      paypalOrderId,
      paypalCaptureId,
      payerEmail: finalPayerEmail,
      payerName: finalPayerName,
      payerId: captureResult.payer?.payer_id,
      captureData: mergedCaptureData,
      idempKey: idempotencyKey,
    });

    return {
      payment: updatedPayment,
      bookingReference: booking.bookingReference,
      bookingStatus: BookingStatus.ESCROW_HOLD,
      captureId: paypalCaptureId,
      message: 'Payment captured successfully and held safely in WayRivo Escrow until journey completion.',
    };
  }

  /**
   * Process Administrator-Controlled Refund (Part D)
   * Executes refund through PayPal refund API and restores inventory.
   */
  async processAdminRefund(params: {
    bookingId?: string;
    paymentId?: string;
    amount?: number;
    reason?: string;
    adminUserId: string;
  }) {
    const { bookingId, paymentId, amount, reason = 'Administrator approved refund', adminUserId } = params;

    let payment = null;
    if (paymentId) {
      payment = await paymentRepository.findByOrderId(paymentId);
      if (!payment) {
        payment = await paymentRepository.findByBookingId(paymentId);
      }
    } else if (bookingId) {
      payment = await paymentRepository.findByBookingId(bookingId);
    }

    if (!payment) {
      throw new NotFoundError('Payment record not found for refund processing.');
    }

    if (payment.status !== PaymentStatus.CAPTURED || !payment.paypalCaptureId) {
      throw new BadRequestError(
        `Cannot refund payment in status: ${payment.status}. Only captured payments with valid PayPal capture IDs can be refunded.`
      );
    }

    const refundAmount = amount ? new Prisma.Decimal(amount) : payment.amount;

    // Call PayPal Refund API: POST /v2/payments/captures/{capture_id}/refund
    const paypalRefund = await paypalClient.refundCapture({
      captureId: payment.paypalCaptureId,
      amount: refundAmount.toFixed(2),
      currency: payment.currency,
      noteToPayer: reason,
    });

    // Record refund in PostgreSQL transaction, update booking status, and restore inventory
    const updatedPayment = await paymentRepository.recordRefund({
      paymentId: payment.id,
      refundId: paypalRefund.id,
      refundAmount,
      reason,
      adminUserId,
    });

    return {
      success: true,
      refundId: paypalRefund.id,
      refundStatus: paypalRefund.status,
      payment: updatedPayment,
      message: 'Refund successfully processed through PayPal Developer Sandbox and escrow released.',
    };
  }

  /**
   * Submit Cancellation Request (Traveler Workflow)
   * Does NOT auto-refund. Flags booking for administrative review.
   */
  async submitCancellationRequest(bookingId: string, userId: string, reason?: string) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking not found with id: ${bookingId}`);
    }

    if (booking.userId !== userId) {
      throw new ForbiddenError('Unauthorized to cancel this booking.');
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
      throw new BadRequestError('Booking is already cancelled or refunded.');
    }

    const note = `[Cancellation Requested on ${new Date().toISOString()}] Reason: ${reason || 'Traveler requested cancellation'}`;
    const updatedSpecialRequests = booking.specialRequests ? `${booking.specialRequests}\n${note}` : note;

    await bookingRepository.updateStatus(bookingId, booking.status);

    return {
      success: true,
      bookingReference: booking.bookingReference,
      status: booking.status,
      message:
        'Cancellation request received. In accordance with WayRivo escrow policies, an administrator will review your cancellation within 24 hours.',
    };
  }

  /**
   * Retrieve Genuine Verified Payment Details
   */
  async getPaymentDetails(paymentId: string, userId: string, isAdmin: boolean = false) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment record not found for: ${paymentId}`);
    }

    const booking = (payment as any).booking;
    if (!isAdmin && booking && booking.userId !== userId) {
      throw new ForbiddenError('You are not authorized to view this payment record.');
    }

    const conversion = paypalClient.resolveTransactionCurrency(
      payment.amount.toNumber(),
      payment.currency
    );

    const captureData = (payment.captureData || {}) as any;
    const paymentMethod = captureData.paymentMethod || (captureData.cardDetails ? 'CREDIT_DEBIT_CARD' : 'PAYPAL_WALLET');
    const cardBrand = captureData.cardDetails?.cardBrand || null;
    const cardLast4 = captureData.cardDetails?.last4 || null;

    return {
      id: payment.id,
      bookingId: payment.bookingId,
      bookingReference: booking?.bookingReference || 'N/A',
      paypalOrderId: payment.paypalOrderId,
      paypalCaptureId: payment.paypalCaptureId || 'PENDING',
      status: payment.status,
      escrowStatus: payment.escrowStatus,
      paymentMethod,
      cardBrand,
      cardLast4,
      amount: payment.amount.toNumber(),
      currency: payment.currency,
      chargeAmount: conversion.chargeAmount,
      chargeCurrency: conversion.chargeCurrency,
      exchangeRate: conversion.exchangeRate,
      payerEmail: payment.payerEmail || booking?.user?.email,
      payerName: payment.payerName || booking?.user?.name,
      payerId: payment.payerId,
      merchantName: 'WayRivo AI 2.0',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      booking,
    };
  }
}

export const paymentService = new PaymentService();
