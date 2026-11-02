import { prisma } from '../config/db';
import { Destination, Hotel, Activity, TravelPackage } from '@prisma/client';

export class DestinationRepository {
  async findAll(): Promise<Destination[]> {
    return prisma.destination.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.destination.findUnique({
      where: { id },
      include: {
        hotels: { where: { isActive: true } },
        activities: { where: { isActive: true } },
        packages: { where: { isActive: true } },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.destination.findUnique({
      where: { slug },
      include: {
        hotels: { where: { isActive: true } },
        activities: { where: { isActive: true } },
        packages: { where: { isActive: true } },
      },
    });
  }

  async findHotels(destinationId?: string): Promise<Hotel[]> {
    return prisma.hotel.findMany({
      where: {
        isActive: true,
        ...(destinationId && { destinationId }),
      },
      orderBy: { stars: 'desc' },
    });
  }

  async findActivities(destinationId?: string, category?: string): Promise<Activity[]> {
    return prisma.activity.findMany({
      where: {
        isActive: true,
        ...(destinationId && { destinationId }),
        ...(category && { category }),
      },
      orderBy: { title: 'asc' },
    });
  }

  async findPackages(destinationId?: string, isRecommended?: boolean): Promise<TravelPackage[]> {
    return prisma.travelPackage.findMany({
      where: {
        isActive: true,
        ...(destinationId && { destinationId }),
        ...(isRecommended !== undefined && { isRecommended }),
      },
      orderBy: { expertRating: 'desc' },
    });
  }
}

export const destinationRepository = new DestinationRepository();
