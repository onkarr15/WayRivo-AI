import { prisma } from '../config/db';
import { Destination, Hotel, Activity, TravelPackage, Prisma } from '@prisma/client';

export interface FilterOptions {
  search?: string;
  destinationId?: string;
  state?: string;
  category?: string;
  minStars?: number;
  minPrice?: number;
  maxPrice?: number;
  isRecommended?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class DestinationRepository {
  // -------------------------------------------------------------
  // DESTINATIONS
  // -------------------------------------------------------------
  async findAll(options?: FilterOptions): Promise<{ items: Destination[]; total: number }> {
    const where: Prisma.DestinationWhereInput = {
      isActive: true,
      ...(options?.state && options.state !== 'All' && { state: options.state }),
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { state: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.DestinationOrderByWithRelationInput = options?.sortBy === 'budget'
      ? { averageBudget: options.sortOrder || 'asc' }
      : { name: options?.sortOrder || 'asc' };

    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.destination.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.destination.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return prisma.destination.findUnique({
      where: { id },
      include: {
        hotels: { where: { isActive: true }, orderBy: { stars: 'desc' } },
        activities: { where: { isActive: true }, orderBy: { pricePerPerson: 'asc' } },
        packages: { where: { isActive: true }, orderBy: { expertRating: 'desc' } },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.destination.findUnique({
      where: { slug },
      include: {
        hotels: { where: { isActive: true }, orderBy: { stars: 'desc' } },
        activities: { where: { isActive: true }, orderBy: { pricePerPerson: 'asc' } },
        packages: { where: { isActive: true }, orderBy: { expertRating: 'desc' } },
      },
    });
  }

  async createDestination(data: any): Promise<Destination> {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return prisma.destination.create({
      data: {
        name: data.name,
        slug,
        country: data.country || 'India',
        state: data.state,
        description: data.description || '',
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        bestTimeToVisit: data.bestTimeToVisit,
        averageBudget: data.averageBudget ? new Prisma.Decimal(data.averageBudget) : new Prisma.Decimal(25000),
        currency: data.currency || 'INR',
        popularAttractions: Array.isArray(data.popularAttractions) ? data.popularAttractions : [],
        travelTips: Array.isArray(data.travelTips) ? data.travelTips : [],
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateDestination(id: string, data: any): Promise<Destination> {
    return prisma.destination.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.bestTimeToVisit !== undefined && { bestTimeToVisit: data.bestTimeToVisit }),
        ...(data.averageBudget !== undefined && { averageBudget: new Prisma.Decimal(data.averageBudget) }),
        ...(data.popularAttractions && { popularAttractions: data.popularAttractions }),
        ...(data.travelTips && { travelTips: data.travelTips }),
        ...(data.highlights && { highlights: data.highlights }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteDestination(id: string): Promise<Destination> {
    return prisma.destination.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // -------------------------------------------------------------
  // HOTELS
  // -------------------------------------------------------------
  async findHotels(options?: FilterOptions): Promise<{ items: Hotel[]; total: number }> {
    const where: Prisma.HotelWhereInput = {
      isActive: true,
      ...(options?.destinationId && { destinationId: options.destinationId }),
      ...(options?.minStars && { stars: { gte: options.minStars } }),
      ...(options?.minPrice && { pricePerNight: { gte: new Prisma.Decimal(options.minPrice) } }),
      ...(options?.maxPrice && { pricePerNight: { lte: new Prisma.Decimal(options.maxPrice) } }),
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { city: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    let orderBy: Prisma.HotelOrderByWithRelationInput = { stars: 'desc' };
    if (options?.sortBy === 'price_asc') orderBy = { pricePerNight: 'asc' };
    if (options?.sortBy === 'price_desc') orderBy = { pricePerNight: 'desc' };
    if (options?.sortBy === 'name') orderBy = { name: 'asc' };

    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        include: { destination: { select: { id: true, name: true, state: true, country: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.hotel.count({ where }),
    ]);

    return { items, total };
  }

  async findHotelById(id: string) {
    return prisma.hotel.findUnique({
      where: { id },
      include: {
        destination: true,
      },
    });
  }

  async createHotel(data: any): Promise<Hotel> {
    return prisma.hotel.create({
      data: {
        destinationId: data.destinationId,
        name: data.name,
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        stars: Number(data.stars) || 3,
        pricePerNight: new Prisma.Decimal(data.pricePerNight),
        currency: data.currency || 'INR',
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [data.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
        totalRooms: Number(data.totalRooms) || 15,
        availableRooms: Number(data.availableRooms) || 10,
        roomTypes: data.roomTypes || [
          { category: 'Deluxe Room', price: Number(data.pricePerNight), availableRooms: Number(data.availableRooms) || 5, bedType: 'Queen' },
        ],
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateHotel(id: string, data: any): Promise<Hotel> {
    return prisma.hotel.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.destinationId && { destinationId: data.destinationId }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.stars !== undefined && { stars: Number(data.stars) }),
        ...(data.pricePerNight !== undefined && { pricePerNight: new Prisma.Decimal(data.pricePerNight) }),
        ...(data.amenities && { amenities: data.amenities }),
        ...(data.imageUrls && { imageUrls: data.imageUrls }),
        ...(data.roomTypes !== undefined && { roomTypes: data.roomTypes }),
        ...(data.totalRooms !== undefined && { totalRooms: Number(data.totalRooms) }),
        ...(data.availableRooms !== undefined && { availableRooms: Number(data.availableRooms) }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteHotel(id: string): Promise<Hotel> {
    return prisma.hotel.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // -------------------------------------------------------------
  // ACTIVITIES
  // -------------------------------------------------------------
  async findActivities(options?: FilterOptions): Promise<{ items: Activity[]; total: number }> {
    const where: Prisma.ActivityWhereInput = {
      isActive: true,
      ...(options?.destinationId && { destinationId: options.destinationId }),
      ...(options?.category && options.category !== 'All' && { category: options.category }),
      ...(options?.maxPrice && { pricePerPerson: { lte: new Prisma.Decimal(options.maxPrice) } }),
      ...(options?.search && {
        OR: [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
          { location: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    let orderBy: Prisma.ActivityOrderByWithRelationInput = { pricePerPerson: 'asc' };
    if (options?.sortBy === 'price_desc') orderBy = { pricePerPerson: 'desc' };
    if (options?.sortBy === 'duration') orderBy = { durationHours: 'asc' };
    if (options?.sortBy === 'title') orderBy = { title: 'asc' };

    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: { destination: { select: { id: true, name: true, state: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    return { items, total };
  }

  async findActivityById(id: string) {
    return prisma.activity.findUnique({
      where: { id },
      include: { destination: true },
    });
  }

  async createActivity(data: any): Promise<Activity> {
    return prisma.activity.create({
      data: {
        destinationId: data.destinationId,
        title: data.title,
        description: data.description || '',
        category: data.category || 'Sightseeing',
        durationHours: new Prisma.Decimal(data.durationHours || 3.0),
        pricePerPerson: new Prisma.Decimal(data.pricePerPerson),
        currency: data.currency || 'INR',
        location: data.location || '',
        difficultyLevel: data.difficultyLevel || 'Moderate',
        maxSlots: Number(data.maxSlots) || 20,
        availableSlots: Number(data.availableSlots) || 12,
        includedItems: Array.isArray(data.includedItems) ? data.includedItems : [],
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [data.imageUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'],
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateActivity(id: string, data: any): Promise<Activity> {
    return prisma.activity.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.destinationId && { destinationId: data.destinationId }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.durationHours !== undefined && { durationHours: new Prisma.Decimal(data.durationHours) }),
        ...(data.pricePerPerson !== undefined && { pricePerPerson: new Prisma.Decimal(data.pricePerPerson) }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.difficultyLevel !== undefined && { difficultyLevel: data.difficultyLevel }),
        ...(data.maxSlots !== undefined && { maxSlots: Number(data.maxSlots) }),
        ...(data.availableSlots !== undefined && { availableSlots: Number(data.availableSlots) }),
        ...(data.includedItems && { includedItems: data.includedItems }),
        ...(data.imageUrls && { imageUrls: data.imageUrls }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteActivity(id: string): Promise<Activity> {
    return prisma.activity.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // -------------------------------------------------------------
  // PACKAGES
  // -------------------------------------------------------------
  async findPackages(options?: FilterOptions): Promise<{ items: TravelPackage[]; total: number }> {
    const where: Prisma.TravelPackageWhereInput = {
      isActive: true,
      ...(options?.destinationId && { destinationId: options.destinationId }),
      ...(options?.isRecommended !== undefined && { isRecommended: options.isRecommended }),
      ...(options?.maxPrice && { totalPrice: { lte: new Prisma.Decimal(options.maxPrice) } }),
      ...(options?.search && {
        OR: [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
          { expertName: { contains: options.search, mode: 'insensitive' } },
          { organizationName: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    let orderBy: Prisma.TravelPackageOrderByWithRelationInput = { expertRating: 'desc' };
    if (options?.sortBy === 'price_asc') orderBy = { totalPrice: 'asc' };
    if (options?.sortBy === 'price_desc') orderBy = { totalPrice: 'desc' };
    if (options?.sortBy === 'duration') orderBy = { durationDays: 'asc' };

    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.travelPackage.findMany({
        where,
        include: { destination: { select: { id: true, name: true, state: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.travelPackage.count({ where }),
    ]);

    return { items, total };
  }

  async findPackageById(id: string) {
    return prisma.travelPackage.findUnique({
      where: { id },
      include: { destination: true },
    });
  }

  async createPackage(data: any): Promise<TravelPackage> {
    return prisma.travelPackage.create({
      data: {
        destinationId: data.destinationId,
        title: data.title,
        description: data.description || '',
        durationDays: Number(data.durationDays) || 5,
        totalPrice: new Prisma.Decimal(data.totalPrice),
        pricePerPerson: new Prisma.Decimal(data.pricePerPerson || Number(data.totalPrice) / 2),
        currency: data.currency || 'INR',
        inclusions: Array.isArray(data.inclusions) ? data.inclusions : [],
        exclusions: Array.isArray(data.exclusions) ? data.exclusions : [],
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        cancellationPolicy: data.cancellationPolicy || 'Standard 7-day cancellation policy applies.',
        isRecommended: data.isRecommended !== undefined ? data.isRecommended : true,
        availableSeats: Number(data.availableSeats) || 15,
        expertName: data.expertName || 'WayRivo Verified Specialist',
        organizationName: data.organizationName || 'Certified Local Agency',
        expertRating: new Prisma.Decimal(data.expertRating || 4.8),
        expertReviews: Number(data.expertReviews) || 12,
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updatePackage(id: string, data: any): Promise<TravelPackage> {
    return prisma.travelPackage.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.destinationId && { destinationId: data.destinationId }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.durationDays !== undefined && { durationDays: Number(data.durationDays) }),
        ...(data.totalPrice !== undefined && { totalPrice: new Prisma.Decimal(data.totalPrice) }),
        ...(data.pricePerPerson !== undefined && { pricePerPerson: new Prisma.Decimal(data.pricePerPerson) }),
        ...(data.inclusions && { inclusions: data.inclusions }),
        ...(data.exclusions && { exclusions: data.exclusions }),
        ...(data.highlights && { highlights: data.highlights }),
        ...(data.cancellationPolicy !== undefined && { cancellationPolicy: data.cancellationPolicy }),
        ...(data.isRecommended !== undefined && { isRecommended: data.isRecommended }),
        ...(data.availableSeats !== undefined && { availableSeats: Number(data.availableSeats) }),
        ...(data.expertName !== undefined && { expertName: data.expertName }),
        ...(data.organizationName !== undefined && { organizationName: data.organizationName }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deletePackage(id: string): Promise<TravelPackage> {
    return prisma.travelPackage.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // -------------------------------------------------------------
  // ADMIN INVENTORY OVERVIEW
  // -------------------------------------------------------------
  async getInventoryOverview() {
    const [destinationsCount, hotelsCount, activitiesCount, packagesCount, lowRoomsHotels, lowSlotsActivities] = await Promise.all([
      prisma.destination.count({ where: { isActive: true } }),
      prisma.hotel.count({ where: { isActive: true } }),
      prisma.activity.count({ where: { isActive: true } }),
      prisma.travelPackage.count({ where: { isActive: true } }),
      prisma.hotel.findMany({
        where: { isActive: true, availableRooms: { lte: 5 } },
        select: { id: true, name: true, availableRooms: true, city: true },
        take: 5,
      }),
      prisma.activity.findMany({
        where: { isActive: true, availableSlots: { lte: 6 } },
        select: { id: true, title: true, availableSlots: true, location: true },
        take: 5,
      }),
    ]);

    return {
      destinations: destinationsCount,
      hotels: hotelsCount,
      activities: activitiesCount,
      packages: packagesCount,
      destinationsCount,
      hotelsCount,
      activitiesCount,
      packagesCount,
      lowInventoryAlerts: {
        hotels: lowRoomsHotels,
        activities: lowSlotsActivities,
      },
    };
  }
}

export const destinationRepository = new DestinationRepository();
