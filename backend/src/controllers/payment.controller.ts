import { Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { sendCreated, sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const createPaymentOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.createPaymentOrder({
      bookingId: req.body.bookingId,
      userId: req.user!.id,
      returnUrl: req.body.returnUrl,
      cancelUrl: req.body.cancelUrl,
    });
    sendCreated(res, result, 'PayPal order initialized successfully');
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
    });
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};
