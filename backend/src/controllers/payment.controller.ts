import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { ForbiddenError } from '../utils/errors';

export const getPaymentConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = paymentService.getPaymentConfig();
    sendSuccess(res, config, 'PayPal client configuration retrieved');
  } catch (error) {
    next(error);
  }
};

export const createPaymentOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.createPaymentOrder({
      bookingId: req.body.bookingId,
      userId: req.user!.id,
      returnUrl: req.body.returnUrl,
      cancelUrl: req.body.cancelUrl,
    });
    sendCreated(res, result, 'PayPal order initialized successfully with verified server pricing');
  } catch (error) {
    next(error);
  }
};

export const capturePaymentOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.capturePaymentOrder({
      bookingId: req.body.bookingId,
      paypalOrderId: req.body.paypalOrderId,
      userId: req.user!.id,
      idempotencyKey: req.body.idempotencyKey || (req.headers['x-idempotency-key'] as string),
      payerEmail: req.body.payerEmail,
      payerName: req.body.payerName,
      cardDetails: req.body.cardDetails,
    });
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Administrator-controlled refund workflow (Part D)
 * Requires ADMIN role.
 */
export const processRefund = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenError('Administrative authorization required to execute refunds.');
    }

    const result = await paymentService.processAdminRefund({
      bookingId: req.body.bookingId,
      paymentId: req.body.paymentId,
      amount: req.body.amount,
      reason: req.body.reason,
      adminUserId: req.user.id,
    });
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Traveler cancellation request (Part D)
 * Does not auto-refund; queues for admin escrow review.
 */
export const requestCancellation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.submitCancellationRequest(
      req.params.id || req.body.bookingId,
      req.user!.id,
      req.body.reason
    );
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const result = await paymentService.getPaymentDetails(req.params.paymentId, req.user!.id, isAdmin);
    sendSuccess(res, result, 'Verified PayPal payment details retrieved');
  } catch (error) {
    next(error);
  }
};
