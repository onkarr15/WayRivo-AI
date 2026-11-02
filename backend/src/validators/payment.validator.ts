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
