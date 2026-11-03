import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../types';
import { budgetIntelligenceService } from '../services/budget-intelligence.service';
import { itineraryService } from '../services/itinerary.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { prisma } from '../config/db';

export const generateAdvancedItinerary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { destinationId, destinationName, numberOfDays, startDate, travelersCount, interests, budget, hotelId, activityIds, travelStyle } = req.body;

    if (!destinationId && !destinationName) {
      throw new BadRequestError('Either destinationId or destinationName is required');
    }

    const result = await budgetIntelligenceService.generateCompleteItinerary({
      destinationId,
      destinationName,
      numberOfDays: numberOfDays ? parseInt(numberOfDays.toString(), 10) : 5,
      startDate,
      travelersCount: travelersCount ? parseInt(travelersCount.toString(), 10) : 2,
      interests,
      budget: budget ? parseFloat(budget.toString()) : 30000,
      hotelId,
      activityIds,
      travelStyle,
    });

    sendSuccess(res, result, 'Advanced itinerary generated successfully');
  } catch (error) {
    next(error);
  }
};

export const calculateDetailedBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { destinationName, numberOfDays, travelersCount, userBudget, selectedHotel, selectedActivities, selectedPackage, travelStyle, transportMode } = req.body;

    const result = budgetIntelligenceService.calculateDetailedBudget({
      destinationName: destinationName || 'Destination',
      numberOfDays: numberOfDays ? parseInt(numberOfDays.toString(), 10) : 5,
      travelersCount: travelersCount ? parseInt(travelersCount.toString(), 10) : 2,
      userBudget: userBudget ? parseFloat(userBudget.toString()) : 30000,
      selectedHotel,
      selectedActivities,
      selectedPackage,
      travelStyle,
      transportMode,
    });

    sendSuccess(res, result, 'Detailed budget breakdown calculated');
  } catch (error) {
    next(error);
  }
};

export const optimizeItineraryBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { destinationId, destinationName, numberOfDays, travelersCount, userBudget, currentHotelId, currentActivityIds, travelStyle, startDate } = req.body;

    if (!userBudget || isNaN(parseFloat(userBudget.toString()))) {
      throw new BadRequestError('User target budget is required for optimization analysis');
    }

    const result = await budgetIntelligenceService.optimizeBudget({
      destinationId,
      destinationName,
      numberOfDays: numberOfDays ? parseInt(numberOfDays.toString(), 10) : 5,
      travelersCount: travelersCount ? parseInt(travelersCount.toString(), 10) : 2,
      userBudget: parseFloat(userBudget.toString()),
      currentHotelId,
      currentActivityIds,
      travelStyle,
      startDate,
    });

    sendSuccess(res, result, 'Budget intelligence analysis completed');
  } catch (error) {
    next(error);
  }
};

export const saveCompleteItinerary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User authentication required to save an itinerary');
    }

    const itinerary = await itineraryService.saveItinerary({
      userId,
      ...req.body,
    });

    sendCreated(res, itinerary, 'Itinerary saved successfully to your profile');
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing itinerary with strict safety guard against modifying confirmed bookings
 */
export const updateItineraryWithSafetyCheck = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.itinerary.findUnique({
      where: { id },
      include: {
        booking: true,
      },
    });

    if (!existing) {
      throw new NotFoundError(`Itinerary not found with id: ${id}`);
    }

    // AI Safety Guard: Never permit modification of itineraries tied to confirmed bookings
    if (existing.booking && (existing.booking.status === 'CONFIRMED' || existing.booking.status === 'ESCROW_HOLD')) {
      throw new ForbiddenError(
        'Modification Blocked: This itinerary is locked to an active confirmed booking with PayPal escrow protection. Modification requires an explicit agency change request and traveler approval.'
      );
    }

    const { title, travelStyle, budget, totalEstimatedCost, days } = req.body;

    // Delete existing days and recreate updated schedule
    if (Array.isArray(days)) {
      await prisma.itineraryDay.deleteMany({
        where: { itineraryId: id },
      });

      await prisma.itineraryDay.createMany({
        data: days.map((d: any, idx: number) => ({
          itineraryId: id,
          dayNumber: d.dayNumber || idx + 1,
          date: d.date ? new Date(d.date) : undefined,
          title: d.title || `Day ${idx + 1}`,
          description: d.description || JSON.stringify({ morning: d.morning, afternoon: d.afternoon, evening: d.evening }),
          mealsIncluded: d.mealsIncluded || ['Breakfast'],
          accommodationNotes: d.accommodationNotes,
          activitiesNotes: d.activitiesNotes,
          estimatedDayCost: new Prisma.Decimal(d.estimatedDayCost || 0),
        })),
      });
    }

    const updated = await prisma.itinerary.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(travelStyle && { travelStyle }),
        ...(budget !== undefined && { budget: new Prisma.Decimal(budget) }),
        ...(totalEstimatedCost !== undefined && { totalEstimatedCost: new Prisma.Decimal(totalEstimatedCost) }),
      },
      include: {
        days: { orderBy: { dayNumber: 'asc' } },
        destination: true,
      },
    });

    sendSuccess(res, updated, 'Itinerary updated successfully');
  } catch (error) {
    next(error);
  }
};
