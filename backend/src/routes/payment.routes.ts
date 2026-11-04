import { Router } from 'express';
import {
  getPaymentConfig,
  createPaymentOrder,
  capturePaymentOrder,
  processRefund,
  requestCancellation,
} from '../controllers/payment.controller';
import { handlePayPalWebhook } from '../webhooks/paypal.webhook';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  createPaymentOrderSchema,
  capturePaymentOrderSchema,
  refundPaymentSchema,
} from '../validators/payment.validator';
import { UserRole } from '../types';

const router = Router();

// 1. Client-safe configuration endpoint for PayPal smart buttons & currency conversion
router.get('/config', getPaymentConfig);

// 2. Authenticated booking order creation & server capture
router.post('/create-order', authenticate, validate(createPaymentOrderSchema), createPaymentOrder);
router.post('/capture-order', authenticate, validate(capturePaymentOrderSchema), capturePaymentOrder);

// 3. Administrator-controlled refund workflow (Part D)
router.post(
  '/refund',
  authenticate,
  requireRoles([UserRole.ADMIN]),
  validate(refundPaymentSchema),
  processRefund
);

// 4. Traveler cancellation request (Part D - flags for escrow review, does not auto-refund)
router.post('/cancel-request/:id', authenticate, requestCancellation);
router.post('/cancel-request', authenticate, requestCancellation);

// 5. PayPal Webhooks (Part C - cryptographically verified with idempotency)
router.post('/webhook', handlePayPalWebhook);

export default router;
