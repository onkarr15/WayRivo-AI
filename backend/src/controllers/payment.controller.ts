import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { receiptPdfService } from '../services/receipt-pdf.service';
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

export const createPaymentSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.createPaymentSession({
      bookingId: req.body.bookingId,
      userId: req.user!.id,
    });
    sendCreated(res, result, '6-minute payment session initialized successfully');
  } catch (error) {
    next(error);
  }
};

export const getPaymentSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId;
    const result = await paymentService.getPaymentSession(sessionId, req.user!.id);
    sendSuccess(res, result, 'Active payment session retrieved');
  } catch (error) {
    next(error);
  }
};

export const expirePaymentSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.expirePaymentSession({
      sessionId: req.body.sessionId || (req.params as any).sessionId,
      bookingId: req.body.bookingId,
      userId: req.user!.id,
    });
    sendSuccess(res, result, result.message);
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

export const getPaymentReceipt = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const result = await paymentService.getPaymentReceipt(req.params.paymentId, req.user!.id, isAdmin);

    const wantsPdf =
      req.query.format === 'pdf' ||
      req.query.download === 'true' ||
      req.headers.accept?.includes('application/pdf') ||
      req.path.endsWith('/pdf') ||
      req.path.endsWith('/download');

    if (wantsPdf) {
      const pdfBuffer = await receiptPdfService.generateReceiptPdf(result as any);
      const txId = result.wayrivoTransactionId || result.receiptNumber.replace(/^RCP-/, '') || 'Receipt';
      const filename = `WayRivo_Payment_Receipt_${txId}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      return res.status(200).send(pdfBuffer);
    }

    sendSuccess(res, result, 'Verified payment receipt retrieved successfully');
  } catch (error) {
    next(error);
  }
};
