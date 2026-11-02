import { Router } from 'express';
import {
  createPaymentOrder,
  capturePaymentOrder,
} from '../controllers/payment.controller';
import { handlePayPalWebhook } from '../webhooks/paypal.webhook';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  createPaymentOrderSchema,
  capturePaymentOrderSchema,
} from '../validators/payment.validator';

const router = Router();

router.post('/create-order', authenticate, validate(createPaymentOrderSchema), createPaymentOrder);
router.post('/capture-order', authenticate, validate(capturePaymentOrderSchema), capturePaymentOrder);
router.post('/webhook', handlePayPalWebhook);

export default router;
