import { itineraryRepository } from '../repositories/itinerary.repository';
import { destinationRepository } from '../repositories/destination.repository';
import { NotFoundError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export class ItineraryService {
  async getItineraryById(id: string) {
    const itinerary = await itineraryRepository.findById(id);
    if (!itinerary) {
      throw new NotFoundError(`Itinerary not found with id: ${id}`);
    }
    return itinerary;
  }

  async getUserItineraries(userId: string) {
    return itineraryRepository.findByUser(userId);
  }

  async saveItinerary(params: {
    userId: string;
    destinationId: string;
    title: string;
    travelStyle?: string;
    startDate?: string;
    endDate?: string;
    numberOfDays: number;
    travelersCount: number;
    budget: number;
    currency?: string;
    days: {
      dayNumber: number;
      title: string;
      description: string;
      mealsIncluded: string[];
      accommodationNotes?: string;
      activitiesNotes?: string;
      estimatedDayCost: number;
    }[];
  }) {
    const { userId, destinationId, title, travelStyle, startDate, endDate, numberOfDays, travelersCount, budget, currency = 'INR', days } = params;

    const destination = await destinationRepository.findById(destinationId);
    if (!destination) {
      throw new NotFoundError(`Destination not found with id: ${destinationId}`);
    }

    return itineraryRepository.createItineraryWithDays({
      userId,
      destinationId,
      title,
      travelStyle,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      numberOfDays,
      travelersCount,
      budget: new Prisma.Decimal(budget),
      currency,
      days: days.map((d) => ({
        ...d,
        estimatedDayCost: new Prisma.Decimal(d.estimatedDayCost),
      })),
    });
  }
}

export const itineraryService = new ItineraryService();
