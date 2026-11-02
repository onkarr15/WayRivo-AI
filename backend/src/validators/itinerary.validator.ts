import { z } from 'zod';

export const generateItinerarySchema = z.object({
  destination: z.string().min(2, 'Destination is required'),
  fromLocation: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  numberOfDays: z.number().int().min(1).max(30).default(5),
  travelersCount: z.number().int().min(1).default(2),
  budget: z.coerce.number().positive().default(50000),
  currency: z.string().default('INR'),
  travelStyle: z.string().default('Family Retreat'),
  preferences: z.array(z.string()).optional(),
  specialRequirements: z.string().optional(),
});

export const saveItinerarySchema = z.object({
  destinationId: z.string().min(1, 'destinationId is required'),
  title: z.string().min(2, 'title is required'),
  travelStyle: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  numberOfDays: z.number().int().min(1).default(5),
  travelersCount: z.number().int().min(1).default(2),
  budget: z.coerce.number().positive().default(50000),
  currency: z.string().default('INR'),
  days: z.array(
    z.object({
      dayNumber: z.number().int().min(1),
      title: z.string(),
      description: z.string(),
      mealsIncluded: z.array(z.string()).default([]),
      accommodationNotes: z.string().optional(),
      activitiesNotes: z.string().optional(),
      estimatedDayCost: z.coerce.number().default(0),
    })
  ).min(1, 'Itinerary must include at least one day'),
});
