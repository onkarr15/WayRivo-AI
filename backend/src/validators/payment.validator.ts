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
});

export const refundPaymentSchema = z.object({
  bookingId: z.string().optional(),
  paymentId: z.string().optional(),
  amount: z.number().positive().optional(),
  reason: z.string().min(3, 'Refund reason is required').optional(),
});
