import { Request, Response, NextFunction } from 'express';
import { paymentRepository } from '../repositories/payment.repository';
import { logger } from '../utils/logger';

export const handlePayPalWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = req.body;
    logger.info(`Received PayPal webhook event: ${event.event_type}`, { id: event.id });

    // Handle payment capture completed event
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = event.resource;
      const paypalOrderId = capture.supplementary_data?.related_ids?.order_id;
      const paypalCaptureId = capture.id;

      if (paypalOrderId && paypalCaptureId) {
        await paymentRepository.recordSuccessfulCapture({
          paypalOrderId,
          paypalCaptureId,
          payerEmail: capture.payer?.email_address,
          payerId: capture.payer?.payer_id,
          captureData: capture,
        });
        logger.info(`Webhook successfully processed capture for order: ${paypalOrderId}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing PayPal webhook:', error);
    next(error);
  }
};
