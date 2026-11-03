import { prisma } from '../config/db';
import { AgentActionType, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export interface ToolExecutionResult {
  tool: string;
  input: any;
  output: any;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export class AgentToolsService {
  /**
   * Helper to log tool execution to AgentAction in PostgreSQL
   */
  private async logAction(
    conversationId: string | undefined,
    actionType: AgentActionType,
    toolInput: any,
    toolOutput: any,
    executionMs: number,
    status: 'SUCCESS' | 'FAILED' = 'SUCCESS'
  ) {
    if (!conversationId) return;
    try {
      await prisma.agentAction.create({
        data: {
          conversationId,
          actionType,
          toolInput: toolInput || {},
          toolOutput: toolOutput || {},
          executionMs,
          status,
        },
      });
    } catch (err) {
      logger.warn('Failed to record agent action log:', err);
    }
  }

  // -------------------------------------------------------------
  // TOOL 1: search_destinations
  // -------------------------------------------------------------
  async searchDestinations(
    args: { query?: string; state?: string; minBudget?: number; maxBudget?: number },
    conversationId?: string
  ) {
    const startTime = Date.now();
    try {
      const where: Prisma.DestinationWhereInput = {
        isActive: true,
        ...(args.state && args.state !== 'All' && { state: args.state }),
        ...(args.minBudget && { averageBudget: { gte: new Prisma.Decimal(args.minBudget) } }),
        ...(args.maxBudget && { averageBudget: { lte: new Prisma.Decimal(args.maxBudget) } }),
        ...(args.query && {
          OR: [
            { name: { contains: args.query, mode: 'insensitive' } },
            { state: { contains: args.query, mode: 'insensitive' } },
            { description: { contains: args.query, mode: 'insensitive' } },
          ],
        }),
      };

      const destinations = await prisma.destination.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          state: true,
          country: true,
          description: true,
          imageUrl: true,
          bestTimeToVisit: true,
          averageBudget: true,
          currency: true,
          popularAttractions: true,
          travelTips: true,
          highlights: true,
        },
        take: 8,
      });

      const formatted = destinations.map((d) => ({
        ...d,
        averageBudget: Number(d.averageBudget),
      }));

      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { count: formatted.length }, latencyMs);

      return {
        success: true,
        count: formatted.length,
        destinations: formatted,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { error: err.message }, latencyMs, 'FAILED');
      return { success: false, error: err.message, destinations: [] };
    }
  }

  // -------------------------------------------------------------
  // TOOL 2: search_hotels
  // -------------------------------------------------------------
  async searchHotels(
    args: { destinationId?: string; destinationName?: string; minStars?: number; maxPrice?: number; sortBy?: string },
    conversationId?: string
  ) {
    const startTime = Date.now();
    try {
      let destId = args.destinationId;
      if (!destId && args.destinationName) {
        const d = await prisma.destination.findFirst({
          where: {
            OR: [
              { name: { contains: args.destinationName, mode: 'insensitive' } },
              { slug: { contains: args.destinationName.toLowerCase() } },
            ],
            isActive: true,
          },
        });
        if (d) destId = d.id;
      }

      const where: Prisma.HotelWhereInput = {
        isActive: true,
        ...(destId && { destinationId: destId }),
        ...(args.minStars && { stars: { gte: args.minStars } }),
        ...(args.maxPrice && { pricePerNight: { lte: new Prisma.Decimal(args.maxPrice) } }),
      };

      let orderBy: Prisma.HotelOrderByWithRelationInput = { stars: 'desc' };
      if (args.sortBy === 'price_asc') orderBy = { pricePerNight: 'asc' };
      if (args.sortBy === 'price_desc') orderBy = { pricePerNight: 'desc' };

      const hotels = await prisma.hotel.findMany({
        where,
        include: {
          destination: { select: { id: true, name: true, state: true } },
        },
        orderBy,
        take: 10,
      });

      const formatted = hotels.map((h) => ({
        id: h.id,
        name: h.name,
        city: h.city,
        stars: h.stars,
        pricePerNight: Number(h.pricePerNight),
        currency: h.currency,
        amenities: h.amenities,
        imageUrls: h.imageUrls,
        totalRooms: h.totalRooms,
        availableRooms: h.availableRooms,
        destinationName: h.destination.name,
      }));

      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { count: formatted.length }, latencyMs);

      return {
        success: true,
        count: formatted.length,
        hotels: formatted,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { error: err.message }, latencyMs, 'FAILED');
      return { success: false, error: err.message, hotels: [] };
    }
  }

  // -------------------------------------------------------------
  // TOOL 3: search_activities
  // -------------------------------------------------------------
  async searchActivities(
    args: { destinationId?: string; destinationName?: string; category?: string; maxPrice?: number },
    conversationId?: string
  ) {
    const startTime = Date.now();
    try {
      let destId = args.destinationId;
      if (!destId && args.destinationName) {
        const d = await prisma.destination.findFirst({
          where: {
            OR: [
              { name: { contains: args.destinationName, mode: 'insensitive' } },
              { slug: { contains: args.destinationName.toLowerCase() } },
            ],
            isActive: true,
          },
        });
        if (d) destId = d.id;
      }

      const where: Prisma.ActivityWhereInput = {
        isActive: true,
        ...(destId && { destinationId: destId }),
        ...(args.category && args.category !== 'All' && { category: args.category }),
        ...(args.maxPrice && { pricePerPerson: { lte: new Prisma.Decimal(args.maxPrice) } }),
      };

      const activities = await prisma.activity.findMany({
        where,
        include: {
          destination: { select: { id: true, name: true, state: true } },
        },
        orderBy: { pricePerPerson: 'asc' },
        take: 10,
      });

      const formatted = activities.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        category: a.category,
        durationHours: a.durationHours,
        pricePerPerson: Number(a.pricePerPerson),
        currency: a.currency,
        location: a.location,
        difficultyLevel: a.difficultyLevel,
        maxSlots: a.maxSlots,
        availableSlots: a.availableSlots,
        includedItems: a.includedItems,
        imageUrls: a.imageUrls,
        destinationName: a.destination.name,
      }));

      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { count: formatted.length }, latencyMs);

      return {
        success: true,
        count: formatted.length,
        activities: formatted,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { error: err.message }, latencyMs, 'FAILED');
      return { success: false, error: err.message, activities: [] };
    }
  }

  // -------------------------------------------------------------
  // TOOL 4: search_packages
  // -------------------------------------------------------------
  async searchPackages(
    args: { destinationId?: string; destinationName?: string; maxPrice?: number; isRecommended?: boolean },
    conversationId?: string
  ) {
    const startTime = Date.now();
    try {
      let destId = args.destinationId;
      if (!destId && args.destinationName) {
        const d = await prisma.destination.findFirst({
          where: {
            OR: [
              { name: { contains: args.destinationName, mode: 'insensitive' } },
              { slug: { contains: args.destinationName.toLowerCase() } },
            ],
            isActive: true,
          },
        });
        if (d) destId = d.id;
      }

      const where: Prisma.TravelPackageWhereInput = {
        isActive: true,
        ...(destId && { destinationId: destId }),
        ...(args.maxPrice && { totalPrice: { lte: new Prisma.Decimal(args.maxPrice) } }),
        ...(args.isRecommended !== undefined && { isRecommended: args.isRecommended }),
      };

      const packages = await prisma.travelPackage.findMany({
        where,
        include: {
          destination: { select: { id: true, name: true, state: true } },
        },
        orderBy: { expertRating: 'desc' },
        take: 8,
      });

      const formatted = packages.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        durationDays: p.durationDays,
        totalPrice: Number(p.totalPrice),
        pricePerPerson: Number(p.pricePerPerson),
        currency: p.currency,
        inclusions: p.inclusions,
        exclusions: p.exclusions,
        highlights: p.highlights,
        cancellationPolicy: p.cancellationPolicy,
        isRecommended: p.isRecommended,
        availableSeats: p.availableSeats,
        expertName: p.expertName,
        organizationName: p.organizationName,
        expertRating: Number(p.expertRating),
        imageUrl: p.imageUrl,
        destinationName: p.destination.name,
      }));

      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { count: formatted.length }, latencyMs);

      return {
        success: true,
        count: formatted.length,
        packages: formatted,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { error: err.message }, latencyMs, 'FAILED');
      return { success: false, error: err.message, packages: [] };
    }
  }

  // -------------------------------------------------------------
  // TOOL 5: get_hotel_details
  // -------------------------------------------------------------
  async getHotelDetails(args: { hotelId: string }, conversationId?: string) {
    const startTime = Date.now();
    try {
      const hotel = await prisma.hotel.findUnique({
        where: { id: args.hotelId },
        include: {
          destination: true,
        },
      });

      if (!hotel) {
        return { success: false, error: `Hotel with ID ${args.hotelId} not found` };
      }

      const formatted = {
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        address: hotel.address,
        stars: hotel.stars,
        pricePerNight: Number(hotel.pricePerNight),
        currency: hotel.currency,
        amenities: hotel.amenities,
        imageUrls: hotel.imageUrls,
        roomTypes: hotel.roomTypes,
        totalRooms: hotel.totalRooms,
        availableRooms: hotel.availableRooms,
        contactEmail: hotel.contactEmail,
        contactPhone: hotel.contactPhone,
        destination: {
          id: hotel.destination.id,
          name: hotel.destination.name,
          state: hotel.destination.state,
        },
      };

      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { hotelName: hotel.name }, latencyMs);

      return { success: true, hotel: formatted };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { error: err.message }, latencyMs, 'FAILED');
      return { success: false, error: err.message };
    }
  }

  // -------------------------------------------------------------
  // TOOL 6: check_inventory_availability
  // -------------------------------------------------------------
  async checkInventoryAvailability(
    args: {
      itemType: 'HOTEL' | 'ACTIVITY' | 'PACKAGE';
      itemId: string;
      requestedQuantity: number;
      dates?: string;
    },
    conversationId?: string
  ) {
    const startTime = Date.now();
    try {
      const qty = Math.max(1, args.requestedQuantity || 1);

      if (args.itemType === 'HOTEL') {
        const hotel = await prisma.hotel.findUnique({ where: { id: args.itemId } });
        if (!hotel) return { success: false, error: 'Hotel not found' };

        const isAvailable = hotel.availableRooms >= qty;
        const result = {
          success: true,
          itemId: hotel.id,
          itemType: 'HOTEL',
          title: hotel.name,
          isAvailable,
          requestedQuantity: qty,
          availableQuantity: hotel.availableRooms,
          unitPrice: Number(hotel.pricePerNight),
          currency: hotel.currency,
          message: isAvailable
            ? `Verified: ${qty} room(s) available at ${hotel.name} (Live availability: ${hotel.availableRooms} rooms remaining).`
            : `Insufficient rooms: only ${hotel.availableRooms} room(s) remaining at ${hotel.name}.`,
        };

        const latencyMs = Date.now() - startTime;
        await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, result, latencyMs);
        return result;
      }

      if (args.itemType === 'ACTIVITY') {
        const activity = await prisma.activity.findUnique({ where: { id: args.itemId } });
        if (!activity) return { success: false, error: 'Activity not found' };

        const isAvailable = activity.availableSlots >= qty;
        const result = {
          success: true,
          itemId: activity.id,
          itemType: 'ACTIVITY',
          title: activity.title,
          isAvailable,
          requestedQuantity: qty,
          availableQuantity: activity.availableSlots,
          unitPrice: Number(activity.pricePerPerson),
          currency: activity.currency,
          message: isAvailable
            ? `Verified: ${qty} slot(s) available for "${activity.title}" (Live capacity: ${activity.availableSlots} slots remaining).`
            : `Insufficient capacity: only ${activity.availableSlots} slots remaining for "${activity.title}".`,
        };

        const latencyMs = Date.now() - startTime;
        await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, result, latencyMs);
        return result;
      }

      if (args.itemType === 'PACKAGE') {
        const pkg = await prisma.travelPackage.findUnique({ where: { id: args.itemId } });
        if (!pkg) return { success: false, error: 'Package not found' };

        const isAvailable = pkg.availableSeats >= qty;
        const result = {
          success: true,
          itemId: pkg.id,
          itemType: 'PACKAGE',
          title: pkg.title,
          isAvailable,
          requestedQuantity: qty,
          availableQuantity: pkg.availableSeats,
          unitPrice: Number(pkg.totalPrice),
          currency: pkg.currency,
          message: isAvailable
            ? `Verified: ${qty} seat(s) available for package "${pkg.title}" (Live seats: ${pkg.availableSeats} remaining).`
            : `Insufficient seats: only ${pkg.availableSeats} seat(s) available for "${pkg.title}".`,
        };

        const latencyMs = Date.now() - startTime;
        await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, result, latencyMs);
        return result;
      }

      return { success: false, error: `Invalid itemType: ${args.itemType}` };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.SEARCH_INVENTORY, args, { error: err.message }, latencyMs, 'FAILED');
      return { success: false, error: err.message };
    }
  }

  // -------------------------------------------------------------
  // TOOL 7: calculate_trip_budget
  // -------------------------------------------------------------
  async calculateTripBudget(
    args: {
      destinationId?: string;
      destinationName?: string;
      numberOfDays: number;
      travelersCount: number;
      hotelId?: string;
      activityIds?: string[];
      travelStyle?: string;
      totalUserBudget?: number;
    },
    conversationId?: string
  ) {
    const startTime = Date.now();
    try {
      const days = Math.max(1, args.numberOfDays || 5);
      const travelers = Math.max(1, args.travelersCount || 2);
      const nights = Math.max(1, days - 1);
      const rooms = Math.ceil(travelers / 2);
      const style = args.travelStyle?.toLowerCase() || 'moderate';

      // 1. Resolve destination
      let dest = null;
      if (args.destinationId) {
        dest = await prisma.destination.findUnique({ where: { id: args.destinationId } });
      } else if (args.destinationName) {
        dest = await prisma.destination.findFirst({
          where: {
            OR: [
              { name: { contains: args.destinationName, mode: 'insensitive' } },
              { slug: { contains: args.destinationName.toLowerCase() } },
            ],
            isActive: true,
          },
        });
      }

      // 2. Resolve Hotel pricing
      let selectedHotel = null;
      if (args.hotelId) {
        selectedHotel = await prisma.hotel.findUnique({ where: { id: args.hotelId } });
      } else if (dest) {
        // Pick best matching hotel for destination
        selectedHotel = await prisma.hotel.findFirst({
          where: { destinationId: dest.id, isActive: true },
          orderBy: style === 'luxury' ? { pricePerNight: 'desc' } : { pricePerNight: 'asc' },
        });
      }

      const nightlyRate = selectedHotel ? Number(selectedHotel.pricePerNight) : (style === 'luxury' ? 8500 : style === 'budget' ? 2200 : 4200);
      const totalAccommodation = nightlyRate * nights * rooms;

      // 3. Resolve Activities pricing
      let activitiesCost = 0;
      let selectedActivities: any[] = [];
      if (args.activityIds && args.activityIds.length > 0) {
        selectedActivities = await prisma.activity.findMany({
          where: { id: { in: args.activityIds }, isActive: true },
        });
        activitiesCost = selectedActivities.reduce((sum, a) => sum + Number(a.pricePerPerson) * travelers, 0);
      } else if (dest) {
        selectedActivities = await prisma.activity.findMany({
          where: { destinationId: dest.id, isActive: true },
          take: 2,
        });
        activitiesCost = selectedActivities.reduce((sum, a) => sum + Number(a.pricePerPerson) * travelers, 0);
      }

      // 4. Estimate Food & Local Transport
      let dailyMealPerPerson = 1200;
      let dailyTransportPerPerson = 600;

      if (style.includes('luxury')) {
        dailyMealPerPerson = 2800;
        dailyTransportPerPerson = 1500;
      } else if (style.includes('budget')) {
        dailyMealPerPerson = 600;
        dailyTransportPerPerson = 350;
      }

      const totalMeals = dailyMealPerPerson * days * travelers;
      const totalTransport = dailyTransportPerPerson * days * travelers;
      const totalCalculatedCost = totalAccommodation + activitiesCost + totalMeals + totalTransport;

      const userBudget = args.totalUserBudget || totalCalculatedCost;
      const remainingBalance = userBudget - totalCalculatedCost;

      let budgetStatus: 'OPTIMAL' | 'TIGHT' | 'EXCEEDED' | 'LUXURY_SURPLUS' = 'OPTIMAL';
      if (remainingBalance < 0) {
        budgetStatus = 'EXCEEDED';
      } else if (remainingBalance <= userBudget * 0.1) {
        budgetStatus = 'TIGHT';
      } else if (remainingBalance >= userBudget * 0.3) {
        budgetStatus = 'LUXURY_SURPLUS';
      }

      const breakdown = {
        accommodation: totalAccommodation,
        activities: activitiesCost,
        mealsAndDining: totalMeals,
        localTransport: totalTransport,
      };

      const breakdownPercentage = {
        accommodation: Math.round((totalAccommodation / totalCalculatedCost) * 100),
        activities: Math.round((activitiesCost / totalCalculatedCost) * 100),
        mealsAndDining: Math.round((totalMeals / totalCalculatedCost) * 100),
        localTransport: Math.round((totalTransport / totalCalculatedCost) * 100),
      };

      const result = {
        success: true,
        destination: dest?.name || args.destinationName || 'Curated Journey',
        numberOfDays: days,
        travelersCount: travelers,
        travelStyle: style,
        breakdown,
        breakdownPercentage,
        totalCalculatedCost,
        userBudget,
        remainingBalance,
        budgetStatus,
        hotelIncluded: selectedHotel ? { id: selectedHotel.id, name: selectedHotel.name, nightlyRate } : null,
        activitiesCount: selectedActivities.length,
        notes:
          budgetStatus === 'EXCEEDED'
            ? `Estimated cost exceeds budget by ₹${Math.abs(remainingBalance).toLocaleString('en-IN')}. Consider adjusting hotel tier or activity selection.`
            : `Trip budget is ${budgetStatus} with ₹${remainingBalance.toLocaleString('en-IN')} contingency buffer.`,
      };

      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.OPTIMIZE_BUDGET, args, result, latencyMs);

      return result;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.OPTIMIZE_BUDGET, args, { error: err.message }, latencyMs, 'FAILED');
      return { success: false, error: err.message };
    }
  }

  // -------------------------------------------------------------
  // TOOL 8: generate_itinerary
  // -------------------------------------------------------------
  async generateItinerary(
    args: {
      destinationId?: string;
      destinationName?: string;
      numberOfDays: number;
      travelersCount: number;
      hotelId?: string;
      activityIds?: string[];
      travelStyle?: string;
      budget?: number;
    },
    conversationId?: string
  ) {
    const startTime = Date.now();
    try {
      const days = Math.max(1, args.numberOfDays || 5);
      const travelers = Math.max(1, args.travelersCount || 2);
      const style = args.travelStyle || 'Curated Exploration';

      // 1. Fetch Destination details
      let dest = null;
      if (args.destinationId) {
        dest = await prisma.destination.findUnique({ where: { id: args.destinationId } });
      } else if (args.destinationName) {
        dest = await prisma.destination.findFirst({
          where: {
            OR: [
              { name: { contains: args.destinationName, mode: 'insensitive' } },
              { slug: { contains: args.destinationName.toLowerCase() } },
            ],
            isActive: true,
          },
        });
      }

      const destName = dest?.name || args.destinationName || 'India';
      const attractions = dest?.popularAttractions || ['Historic Center', 'Scenic Viewpoint', 'Local Artisan Market'];
      const tips = dest?.travelTips || ['Dress respectfully at cultural monuments', 'Keep hydration handy'];

      // 2. Fetch Selected Hotel
      let hotel = null;
      if (args.hotelId) {
        hotel = await prisma.hotel.findUnique({ where: { id: args.hotelId } });
      } else if (dest) {
        hotel = await prisma.hotel.findFirst({
          where: { destinationId: dest.id, isActive: true },
          orderBy: { stars: 'desc' },
        });
      }

      // 3. Fetch Selected or Recommended Activities
      let activities: any[] = [];
      if (args.activityIds && args.activityIds.length > 0) {
        activities = await prisma.activity.findMany({
          where: { id: { in: args.activityIds }, isActive: true },
        });
      } else if (dest) {
        activities = await prisma.activity.findMany({
          where: { destinationId: dest.id, isActive: true },
          take: Math.min(days, 4),
        });
      }

      // 4. Construct Day-by-Day schedule
      const generatedDays = [];
      const totalBudget = args.budget || (dest ? Number(dest.averageBudget) : 25000);
      const estimatedDayCost = Math.round(totalBudget / days);

      for (let i = 1; i <= days; i++) {
        let dayTitle = `Exploring ${destName} Highlights - Day ${i}`;
        let morning = 'Morning heritage walk and signature viewpoint visit.';
        let afternoon = 'Traditional regional dining and cultural exploration.';
        let evening = 'Sunset vista, evening bazaar walk, and chef dinner.';
        let activityNote = undefined;

        if (i === 1) {
          dayTitle = `Arrival & Check-in at ${destName}`;
          morning = `Arrival at airport/station, private transfer to ${hotel?.name || 'hotel'}. Check-in and refresh.`;
          afternoon = `Orientation walk around the nearby neighbourhood, savoring local tea and welcome refreshments.`;
          evening = `Scenic sunset viewpoint at ${attractions[0] || 'the promenade'}, followed by a welcome dinner.`;
        } else if (i === days) {
          dayTitle = `Souvenirs & Farewell ${destName}`;
          morning = `Leisurely breakfast at ${hotel?.name || 'hotel'} followed by last-minute souvenir shopping at the local market.`;
          afternoon = `Check-out, packaging memories, and departure transfer to airport/station.`;
          evening = `Safe journey onward with unforgettable memories of ${destName}.`;
        } else {
          // Mid-days: assign activity if available
          const actIndex = (i - 2) % (activities.length || 1);
          const act = activities[actIndex];

          if (act) {
            dayTitle = `${act.title} & Local Immersion`;
            morning = `Curated excursion: "${act.title}" with professional local guide (${act.durationHours} hours).`;
            afternoon = `Authentic luncheon nearby, relaxing and reviewing photography.`;
            evening = `Stroll through ${attractions[i % attractions.length] || 'the night bazaar'} and local dining.`;
            activityNote = `${act.title} (₹${Number(act.pricePerPerson).toLocaleString('en-IN')}/person)`;
          } else {
            const attr = attractions[i % attractions.length] || 'Heritage Landmark';
            dayTitle = `Immersion at ${attr}`;
            morning = `Guided morning excursion to ${attr}.`;
            afternoon = `Artisan workshop visit and authentic culinary tasting.`;
            evening = `Sunset boat ride or tranquil viewpoint stroll with dinner.`;
          }
        }

        generatedDays.push({
          dayNumber: i,
          title: dayTitle,
          morning,
          afternoon,
          evening,
          mealsIncluded: ['Breakfast', i === 1 ? 'Welcome Dinner' : 'Lunch & Dinner'],
          accommodationNotes: hotel ? `${hotel.name} (${hotel.stars}★) - Live Available` : 'Boutique Heritage Stay',
          activitiesNotes: activityNote,
          estimatedDayCost,
        });
      }

      const result = {
        success: true,
        destinationId: dest?.id,
        destinationName: destName,
        numberOfDays: days,
        travelersCount: travelers,
        travelStyle: style,
        hotel: hotel
          ? {
              id: hotel.id,
              name: hotel.name,
              stars: hotel.stars,
              pricePerNight: Number(hotel.pricePerNight),
              availableRooms: hotel.availableRooms,
            }
          : null,
        activitiesCount: activities.length,
        travelTips: tips,
        totalEstimatedCost: totalBudget,
        days: generatedDays,
      };

      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.GENERATE_ITINERARY, args, { daysCount: days }, latencyMs);

      return result;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.GENERATE_ITINERARY, args, { error: err.message }, latencyMs, 'FAILED');
      return { success: false, error: err.message };
    }
  }

  // -------------------------------------------------------------
  // TOOL 9: save_itinerary
  // -------------------------------------------------------------
  async saveItinerary(
    args: {
      userId: string;
      title: string;
      destinationId?: string;
      destinationName?: string;
      numberOfDays: number;
      travelersCount: number;
      budget: number;
      travelStyle?: string;
      days: Array<{
        dayNumber: number;
        title: string;
        description?: string;
        morning?: string;
        afternoon?: string;
        evening?: string;
        mealsIncluded?: string[];
        accommodationNotes?: string;
        activitiesNotes?: string;
        estimatedDayCost?: number;
      }>;
    },
    conversationId?: string
  ) {
    const startTime = Date.now();
    try {
      if (!args.userId) {
        return { success: false, error: 'User must be signed in to save an itinerary' };
      }

      // Resolve destination
      let destId = args.destinationId;
      if (!destId && args.destinationName) {
        const d = await prisma.destination.findFirst({
          where: {
            OR: [
              { name: { contains: args.destinationName, mode: 'insensitive' } },
              { slug: { contains: args.destinationName.toLowerCase() } },
            ],
            isActive: true,
          },
        });
        if (d) destId = d.id;
      }

      if (!destId) {
        // Fallback to first active destination
        const first = await prisma.destination.findFirst({ where: { isActive: true } });
        destId = first?.id || '';
      }

      // Create Itinerary record
      const itinerary = await prisma.itinerary.create({
        data: {
          userId: args.userId,
          destinationId: destId,
          title: args.title || `Personalized ${args.numberOfDays}-Day Trip`,
          travelStyle: args.travelStyle || 'Curated',
          numberOfDays: args.numberOfDays || 5,
          travelersCount: args.travelersCount || 2,
          budget: new Prisma.Decimal(args.budget || 25000),
          totalEstimatedCost: new Prisma.Decimal(args.budget || 25000),
          status: 'DRAFT',
          days: {
            create: (args.days || []).map((d) => ({
              dayNumber: d.dayNumber,
              title: d.title,
              description: d.description || [d.morning, d.afternoon, d.evening].filter(Boolean).join('\n\n') || 'Day itinerary',
              mealsIncluded: Array.isArray(d.mealsIncluded) ? d.mealsIncluded : ['Breakfast'],
              accommodationNotes: d.accommodationNotes,
              activitiesNotes: d.activitiesNotes,
              estimatedDayCost: new Prisma.Decimal(d.estimatedDayCost || Math.round((args.budget || 25000) / (args.numberOfDays || 5))),
            })),
          },
        },
        include: { days: true },
      });

      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.GENERATE_ITINERARY, args, { itineraryId: itinerary.id }, latencyMs);

      return {
        success: true,
        itineraryId: itinerary.id,
        title: itinerary.title,
        numberOfDays: itinerary.numberOfDays,
        status: itinerary.status,
        message: 'Itinerary saved successfully to your profile!',
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.GENERATE_ITINERARY, args, { error: err.message }, latencyMs, 'FAILED');
      return { success: false, error: err.message };
    }
  }

  // -------------------------------------------------------------
  // TOOL 10: create_booking_proposal
  // -------------------------------------------------------------
  async createBookingProposal(
    args: {
      userId: string;
      itineraryId?: string;
      hotelId?: string;
      activityIds?: string[];
      packageId?: string;
      specialRequests?: string;
      requestedNights?: number;
      travelersCount?: number;
    },
    conversationId?: string
  ) {
    const startTime = Date.now();
    try {
      if (!args.userId) {
        return { success: false, error: 'User must be signed in to generate a booking proposal' };
      }

      const travelers = Math.max(1, args.travelersCount || 2);
      const nights = Math.max(1, args.requestedNights || 4);
      const rooms = Math.ceil(travelers / 2);

      const itemsToCreate: Array<{
        itemType: 'HOTEL' | 'ACTIVITY' | 'PACKAGE' | 'CUSTOM';
        referenceId?: string;
        title: string;
        unitPrice: Prisma.Decimal;
        quantity: number;
        totalPrice: Prisma.Decimal;
        notes?: string;
      }> = [];

      let totalAmount = 0;

      // 1. Hotel Line Item
      if (args.hotelId) {
        const hotel = await prisma.hotel.findUnique({ where: { id: args.hotelId } });
        if (hotel) {
          const unitRate = Number(hotel.pricePerNight);
          const totalHotel = unitRate * nights * rooms;
          totalAmount += totalHotel;
          itemsToCreate.push({
            itemType: 'HOTEL',
            referenceId: hotel.id,
            title: `${hotel.name} (${rooms} Room, ${nights} Nights)`,
            unitPrice: new Prisma.Decimal(unitRate),
            quantity: nights * rooms,
            totalPrice: new Prisma.Decimal(totalHotel),
            notes: `Check-in with live availability verified (${hotel.availableRooms} rooms in inventory)`,
          });
        }
      }

      // 2. Activities Line Items
      if (args.activityIds && args.activityIds.length > 0) {
        const acts = await prisma.activity.findMany({
          where: { id: { in: args.activityIds } },
        });
        for (const act of acts) {
          const actPrice = Number(act.pricePerPerson);
          const totalAct = actPrice * travelers;
          totalAmount += totalAct;
          itemsToCreate.push({
            itemType: 'ACTIVITY',
            referenceId: act.id,
            title: `${act.title} (${travelers} Guests)`,
            unitPrice: new Prisma.Decimal(actPrice),
            quantity: travelers,
            totalPrice: new Prisma.Decimal(totalAct),
            notes: `Confirmed category: ${act.category}. Available slots: ${act.availableSlots}`,
          });
        }
      }

      // 3. Package Line Item
      if (args.packageId) {
        const pkg = await prisma.travelPackage.findUnique({ where: { id: args.packageId } });
        if (pkg) {
          const pkgPrice = Number(pkg.totalPrice);
          totalAmount += pkgPrice;
          itemsToCreate.push({
            itemType: 'PACKAGE',
            referenceId: pkg.id,
            title: pkg.title,
            unitPrice: new Prisma.Decimal(pkgPrice),
            quantity: 1,
            totalPrice: new Prisma.Decimal(pkgPrice),
            notes: `Verified specialist agency: ${pkg.organizationName}. ${pkg.durationDays} Days.`,
          });
        }
      }

      if (itemsToCreate.length === 0) {
        // Fallback custom proposal item
        totalAmount = 25000;
        itemsToCreate.push({
          itemType: 'CUSTOM',
          title: 'WayRivo Tailored Travel Package Proposal',
          unitPrice: new Prisma.Decimal(25000),
          quantity: 1,
          totalPrice: new Prisma.Decimal(25000),
          notes: 'Standard escrow proposal. Final line items confirmed upon agency dispatch.',
        });
      }

      // Generate human-readable booking reference: WR-2026-XXXX
      const refNumber = Math.floor(1000 + Math.random() * 9000);
      const bookingReference = `WR-2026-${refNumber}`;

      // Create Draft Booking
      const booking = await prisma.booking.create({
        data: {
          bookingReference,
          userId: args.userId,
          itineraryId: args.itineraryId,
          status: 'PENDING_PAYMENT',
          totalAmount: new Prisma.Decimal(totalAmount),
          currency: 'INR',
          specialRequests: args.specialRequests || 'Created via WayRivo AI Agent session',
          items: {
            create: itemsToCreate,
          },
        },
        include: { items: true },
      });

      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.CREATE_BOOKING, args, { bookingReference, totalAmount }, latencyMs);

      return {
        success: true,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        totalAmount,
        currency: 'INR',
        status: 'PENDING_PAYMENT',
        itemCount: booking.items.length,
        items: booking.items.map((i) => ({
          title: i.title,
          unitPrice: Number(i.unitPrice),
          quantity: i.quantity,
          totalPrice: Number(i.totalPrice),
        })),
        notice:
          'Booking proposal created successfully in PENDING_PAYMENT state. No funds have been charged. Explicit traveler review and PayPal Escrow checkout are required to confirm this booking.',
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      await this.logAction(conversationId, AgentActionType.CREATE_BOOKING, args, { error: err.message }, latencyMs, 'FAILED');
      return { success: false, error: err.message };
    }
  }
}

export const agentTools = new AgentToolsService();
