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
    numberOfDays?: number;
    travelersCount?: number;
    budget: number;
    currency?: string;
    days: {
      dayNumber: number;
      date?: string | Date;
      title: string;
      description?: string;
      morning?: any;
      afternoon?: any;
      evening?: any;
      mealsIncluded?: string[];
      accommodationNotes?: string;
      activitiesNotes?: string;
      estimatedDayCost?: number;
    }[];
  }) {
    const { userId, destinationId, title, travelStyle, startDate, endDate, budget, currency = 'INR', days = [] } = params;
    const numberOfDays = params.numberOfDays || days.length || 5;
    const travelersCount = params.travelersCount || 2;

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
      budget: new Prisma.Decimal(budget || 0),
      currency,
      days: days.map((d, idx) => {
        let desc = d.description || '';
        if (!desc && (d.morning || d.afternoon || d.evening)) {
          const parts = [];
          if (d.morning?.activityTitle) parts.push(`Morning: ${d.morning.activityTitle}`);
          if (d.afternoon?.activityTitle) parts.push(`Afternoon: ${d.afternoon.activityTitle}`);
          if (d.evening?.activityTitle) parts.push(`Evening: ${d.evening.activityTitle}`);
          desc = parts.join(' | ');
        }
        return {
          dayNumber: d.dayNumber || idx + 1,
          date: d.date ? new Date(d.date) : undefined,
          title: d.title || `Day ${idx + 1}`,
          description: desc,
          mealsIncluded: d.mealsIncluded || ['Breakfast'],
          accommodationNotes: d.accommodationNotes,
          activitiesNotes: d.activitiesNotes,
          estimatedDayCost: new Prisma.Decimal(d.estimatedDayCost || 0),
        };
      }),
    });
  }
}

export const itineraryService = new ItineraryService();
