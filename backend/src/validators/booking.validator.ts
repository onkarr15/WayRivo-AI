import { z } from 'zod';
import { BookingItemType } from '@prisma/client';

export const createBookingItemSchema = z.object({
  itemType: z.nativeEnum(BookingItemType),
  referenceId: z.string().min(1, 'referenceId is required'),
  quantity: z.number().int().positive().default(1),
  notes: z.string().optional(),
});

export const createBookingSchema = z.object({
  itineraryId: z.string().optional(),
  items: z.array(createBookingItemSchema).min(1, 'Booking must contain at least one item'),
  specialRequests: z.string().optional(),
  currency: z.string().default('INR'),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'REFUNDED']),
  reason: z.string().optional(),
});
