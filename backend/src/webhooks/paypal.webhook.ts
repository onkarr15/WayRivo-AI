import { Request, Response, NextFunction } from 'express';
import { paymentRepository } from '../repositories/payment.repository';
import { paypalClient } from '../integrations/paypal/client';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

// In-memory LRU set to track processed webhook event IDs and ensure strict idempotency
const processedEvents = new Set<string>();

export const handlePayPalWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = req.body;
    const eventId = event?.id || `WH-${Date.now()}`;
    const eventType = event?.event_type;

    logger.info(`[PayPal Webhook] Processing event: ${eventType} (ID: ${eventId})`);

    // 1. Verify Webhook Signature via PayPal v1 Notifications API
    const isSignatureValid = await paypalClient.verifyWebhookSignature({
      headers: req.headers as Record<string, string>,
      rawBody: req.body,
    });

    if (!isSignatureValid) {
      logger.warn(`[PayPal Webhook] Invalid signature verification for event ID: ${eventId}`);
      res.status(400).json({ success: false, error: 'Invalid webhook signature' });
      return;
    }

    // 2. Prevent duplicate event processing (Idempotency)
    if (processedEvents.has(eventId)) {
      logger.info(`[PayPal Webhook] Idempotent hit: Event ${eventId} was already processed.`);
      res.status(200).json({ received: true, alreadyProcessed: true });
      return;
    }
    processedEvents.add(eventId);
    if (processedEvents.size > 1000) {
      // Keep memory bounded
      const first = processedEvents.values().next().value;
      if (first) processedEvents.delete(first);
    }

    // 3. Reconcile Payment & Booking Status by Event Type
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const capture = event.resource;
        const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id;
        const paypalCaptureId = capture?.id;

        if (paypalOrderId && paypalCaptureId) {
          await paymentRepository.recordSuccessfulCapture({
            paypalOrderId,
            paypalCaptureId,
            payerEmail: capture?.payer?.email_address,
            payerId: capture?.payer?.payer_id,
            captureData: capture,
          });
          logger.info(`[PayPal Webhook] Capture completed for order: ${paypalOrderId}`);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        const capture = event.resource;
        const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id;
        if (paypalOrderId) {
          await paymentRepository.recordFailedCapture(
            paypalOrderId,
            capture?.status_details?.reason || 'Payment capture was denied by PayPal.'
          );
          logger.warn(`[PayPal Webhook] Capture denied for order: ${paypalOrderId}`);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const refund = event.resource;
        const captureId = refund?.links?.find((l: any) => l.rel === 'up')?.href?.split('/').pop();
        const refundId = refund?.id;
        const refundAmount = refund?.amount?.value ? new Prisma.Decimal(refund?.amount?.value) : new Prisma.Decimal(0);

        if (captureId) {
          const payment = await paymentRepository.findByOrderId(captureId);
          if (payment) {
            await paymentRepository.recordRefund({
              paymentId: payment.id,
              refundId: refundId || `REF-${Date.now()}`,
              refundAmount,
              reason: 'Reconciled via PayPal Webhook PAYMENT.CAPTURE.REFUNDED',
            });
            logger.info(`[PayPal Webhook] Refund reconciled for capture: ${captureId}`);
          }
        }
        break;
      }

      default:
        logger.info(`[PayPal Webhook] Unhandled event type acknowledged: ${eventType}`);
        break;
    }

    res.status(200).json({ received: true, eventId, eventType });
  } catch (error) {
    logger.error('[PayPal Webhook] Processing error:', error);
    next(error);
  }
};
