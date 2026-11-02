import { prisma } from '../config/db';
import { Itinerary, ItineraryStatus, Prisma } from '@prisma/client';

export class ItineraryRepository {
  async findById(id: string) {
    return prisma.itinerary.findUnique({
      where: { id },
      include: {
        destination: true,
        days: {
          orderBy: { dayNumber: 'asc' },
        },
        booking: true,
      },
    });
  }

  async findByUser(userId: string) {
    return prisma.itinerary.findMany({
      where: { userId },
      include: {
        destination: true,
        days: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createItineraryWithDays(params: {
    userId: string;
    destinationId: string;
    title: string;
    travelStyle?: string;
    startDate?: Date;
    endDate?: Date;
    numberOfDays: number;
    travelersCount: number;
    budget: Prisma.Decimal;
    currency?: string;
    days: {
      dayNumber: number;
      date?: Date;
      title: string;
      description: string;
      mealsIncluded: string[];
      accommodationNotes?: string;
      activitiesNotes?: string;
      estimatedDayCost: Prisma.Decimal;
    }[];
  }): Promise<Itinerary> {
    const { userId, destinationId, title, travelStyle, startDate, endDate, numberOfDays, travelersCount, budget, currency = 'INR', days } = params;

    const totalEstimatedCost = days.reduce(
      (acc, d) => acc.add(d.estimatedDayCost),
      new Prisma.Decimal(0)
    );

    return prisma.itinerary.create({
      data: {
        userId,
        destinationId,
        title,
        travelStyle,
        startDate,
        endDate,
        numberOfDays,
        travelersCount,
        budget,
        currency,
        status: ItineraryStatus.DRAFT,
        totalEstimatedCost,
        days: {
          create: days,
        },
      },
      include: {
        days: true,
      },
    });
  }
}

export const itineraryRepository = new ItineraryRepository();
