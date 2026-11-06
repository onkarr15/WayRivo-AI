import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
  currency: z.string().default('INR'),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const capturePaymentOrderSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
  paypalOrderId: z.string().min(1, 'paypalOrderId is required'),
  idempotencyKey: z.string().min(8, 'idempotencyKey must be at least 8 characters').optional(),
  payerEmail: z.string().email().optional(),
  payerName: z.string().optional(),
  cardDetails: z
    .object({
      cardholderName: z.string().optional(),
      cardBrand: z.string().optional(),
      last4: z.string().optional(),
    })
    .optional(),
}).passthrough();

export const refundPaymentSchema = z.object({
  bookingId: z.string().optional(),
  paymentId: z.string().optional(),
  amount: z.number().positive().optional(),
  reason: z.string().min(3, 'Refund reason is required').optional(),
});

export const createPaymentSessionSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
});

export const expirePaymentSessionSchema = z.object({
  sessionId: z.string().optional(),
  bookingId: z.string().optional(),
});
