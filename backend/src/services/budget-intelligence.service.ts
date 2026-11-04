import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export interface DayActivitySlot {
  timeWindow: string;
  activityTitle: string;
  attractionDescription: string;
  travelTimeEstimate: string;
  estimatedCost: number;
  activityId?: string;
  category?: string;
}

export interface DaySchedule {
  dayNumber: number;
  date: string; // ISO date YYYY-MM-DD
  dayOfWeek: string;
  title: string;
  morning: DayActivitySlot;
  afternoon: DayActivitySlot;
  evening: DayActivitySlot;
  suggestedMealBreaks: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  practicalTravelNotes: string;
  estimatedDayCost: number;
  hotelStayName?: string;
}

export interface BudgetBreakdown {
  accommodation: {
    amount: number;
    hotelName: string;
    nightlyRate: number;
    nights: number;
    roomsCount: number;
    assumptions: string;
  };
  activities: {
    amount: number;
    itemsCount: number;
    items: Array<{ id: string; title: string; pricePerPerson: number; total: number }>;
    assumptions: string;
  };
  travelPackages: {
    amount: number;
    packageName?: string;
    assumptions: string;
  };
  transportation: {
    amount: number;
    mode: string;
    dailyRate: number;
    daysCount: number;
    assumptions: string;
  };
  mealsAndDining: {
    amount: number;
    dailyPerPerson: number;
    daysCount: number;
    assumptions: string;
  };
  otherServices: {
    amount: number;
    items: Array<{ name: string; amount: number }>;
    assumptions: string;
  };
  taxesAndFees: {
    amount: number;
    gstRatePercent: number;
    assumptions: string;
  };
  totalEstimatedExpenditure: number;
  perPersonExpenditure: number;
  userBudget: number;
  remainingBudget: number;
  budgetStatus: 'OPTIMAL' | 'TIGHT' | 'EXCEEDED' | 'LUXURY_SURPLUS';
}

export interface BudgetOptimizationResult {
  isOverBudget: boolean;
  originalEstimate: number;
  optimizedEstimate: number;
  totalSavings: number;
  savingsPerPerson: number;
  userBudget: number;
  expensiveComponents: Array<{
    category: string;
    itemTitle: string;
    originalCost: number;
    percentageOfTotal: number;
    reason: string;
  }>;
  suggestedAlternatives: {
    hotel?: {
      original: { id: string; name: string; stars: number; nightlyRate: number; totalStay: number };
      suggested: { id: string; name: string; stars: number; nightlyRate: number; totalStay: number; availableRooms: number };
      savings: number;
    };
    activities?: Array<{
      original: { id: string; title: string; pricePerPerson: number; total: number };
      suggested: { id: string; title: string; pricePerPerson: number; total: number; availableSlots: number };
      savings: number;
    }>;
  };
  recalculatedBudget: BudgetBreakdown;
  optimizedItineraryDays: DaySchedule[];
  explanation: string;
}

export class BudgetIntelligenceService {
  /**
   * Helper to format a date to YYYY-MM-DD
   */
  private formatDate(baseDate: Date, dayOffset: number): { dateStr: string; dayOfWeek: string } {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + dayOffset);
    const dateStr = d.toISOString().split('T')[0];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return { dateStr, dayOfWeek: days[d.getDay()] };
  }

  /**
   * 1. ITINERARY GENERATOR
   * Generates a complete day-wise itinerary grounded in actual database records.
   */
  async generateCompleteItinerary(params: {
    destinationId?: string;
    destinationName?: string;
    numberOfDays: number;
    startDate?: string;
    travelersCount: number;
    interests?: string[];
    budget?: number;
    hotelId?: string;
    activityIds?: string[];
    travelStyle?: string;
  }): Promise<{
    destination: any;
    numberOfDays: number;
    startDate: string;
    travelersCount: number;
    travelStyle: string;
    selectedHotel: any;
    selectedActivities: any[];
    days: DaySchedule[];
    budget: BudgetBreakdown;
  }> {
    const daysCount = Math.max(1, params.numberOfDays || 5);
    const travelers = Math.max(1, params.travelersCount || 2);
    const baseDate = params.startDate ? new Date(params.startDate) : new Date(Date.now() + 86400000 * 7);
    const style = params.travelStyle || 'Curated Exploration';
    const targetBudget = params.budget || 30000;

    // 1. Resolve Destination
    let destination = null;
    if (params.destinationId) {
      destination = await prisma.destination.findUnique({
        where: { id: params.destinationId },
        include: { hotels: { where: { isActive: true } }, activities: { where: { isActive: true } } },
      });
    } else if (params.destinationName) {
      destination = await prisma.destination.findFirst({
        where: {
          OR: [
            { name: { contains: params.destinationName, mode: 'insensitive' } },
            { slug: { contains: params.destinationName.toLowerCase() } },
          ],
          isActive: true,
        },
        include: { hotels: { where: { isActive: true } }, activities: { where: { isActive: true } } },
      });
    }

    if (!destination) {
      destination = await prisma.destination.findFirst({
        where: { isActive: true },
        include: { hotels: { where: { isActive: true } }, activities: { where: { isActive: true } } },
      });
    }

    const destName = destination?.name || 'India';
    const attractions = destination?.popularAttractions || [
      'Scenic Waterfront Promenade',
      'Historic Heritage Quarter',
      'Local Artisan Spice Market',
      'Sunset Panoramic Viewpoint',
    ];
    const travelTips = destination?.travelTips || [
      'Keep hydrated and dress in breathable layers.',
      'Pre-book adventure excursions to guarantee slots.',
    ];

    // 2. Resolve Selected Hotel (or pick best match)
    let hotel: any = null;
    if (params.hotelId) {
      hotel = await prisma.hotel.findUnique({ where: { id: params.hotelId } });
    } else if (destination?.hotels && destination.hotels.length > 0) {
      // Pick matching hotel based on style or budget
      hotel = style.toLowerCase().includes('luxury')
        ? destination.hotels.sort((a, b) => Number(b.pricePerNight) - Number(a.pricePerNight))[0]
        : destination.hotels.sort((a, b) => Number(a.pricePerNight) - Number(b.pricePerNight))[0];
    }

    // 3. Resolve Activities
    let activities: any[] = [];
    if (params.activityIds && params.activityIds.length > 0) {
      activities = await prisma.activity.findMany({
        where: { id: { in: params.activityIds }, isActive: true },
      });
    } else if (destination?.activities && destination.activities.length > 0) {
      // Filter activities by interests if provided
      if (params.interests && params.interests.length > 0) {
        activities = destination.activities.filter((act) =>
          params.interests!.some((int) =>
            act.title.toLowerCase().includes(int.toLowerCase()) ||
            act.category.toLowerCase().includes(int.toLowerCase())
          )
        );
      }
      if (activities.length === 0) {
        activities = destination.activities.slice(0, Math.min(daysCount, 5));
      }
    }

    // 4. Construct Day-by-Day Itinerary Schedule
    const days: DaySchedule[] = [];
    for (let i = 1; i <= daysCount; i++) {
      const { dateStr, dayOfWeek } = this.formatDate(baseDate, i - 1);
      const isArrival = i === 1;
      const isDeparture = i === daysCount;

      let dayTitle = `${destName} Exploration - Day ${i}`;
      let morningSlot: DayActivitySlot;
      let afternoonSlot: DayActivitySlot;
      let eveningSlot: DayActivitySlot;
      let notes = travelTips[i % travelTips.length] || 'Carry water and camera.';

      if (isArrival) {
        dayTitle = `Arrival & Check-in at ${destName}`;
        morningSlot = {
          timeWindow: '09:00 AM - 12:30 PM',
          activityTitle: `Airport/Station Arrival & Transfer to ${hotel?.name || 'Hotel'}`,
          attractionDescription: `Private transfer to accommodation. Check-in, refresh, and unpack luggage.`,
          travelTimeEstimate: '35 mins via chauffeured vehicle',
          estimatedCost: 600,
        };
        afternoonSlot = {
          timeWindow: '01:30 PM - 04:30 PM',
          activityTitle: `Neighborhood Orientation & Local Refreshment`,
          attractionDescription: `Leisurely walking stroll through the immediate surroundings. Savor local seasonal tea and street refreshments.`,
          travelTimeEstimate: '10 mins walking',
          estimatedCost: 400,
        };
        eveningSlot = {
          timeWindow: '05:30 PM - 09:00 PM',
          activityTitle: `Sunset at ${attractions[0] || 'Scenic Promenade'} & Welcome Dinner`,
          attractionDescription: `Watch the vibrant twilight sunset from ${attractions[0] || 'the viewpoint'}, followed by an authentic regional welcome meal.`,
          travelTimeEstimate: '20 mins via local cab',
          estimatedCost: 800,
        };
        notes = 'Keep identity documents ready for hotel check-in. Evening temperatures cool down pleasantly.';
      } else if (isDeparture) {
        dayTitle = `Souvenirs & Departure from ${destName}`;
        morningSlot = {
          timeWindow: '09:00 AM - 12:00 PM',
          activityTitle: `Morning Breakfast & Artisan Souvenir Shopping`,
          attractionDescription: `Leisurely breakfast at ${hotel?.name || 'hotel'}. Visit local heritage bazaar for handloom, spices, and souvenirs.`,
          travelTimeEstimate: '15 mins walking',
          estimatedCost: 500,
        };
        afternoonSlot = {
          timeWindow: '12:30 PM - 03:30 PM',
          activityTitle: `Hotel Check-Out & Farewell Luncheon`,
          attractionDescription: `Complete hotel check-out. Savor a relaxed farewell lunch at a renowned regional culinary spot.`,
          travelTimeEstimate: '15 mins cab',
          estimatedCost: 700,
        };
        eveningSlot = {
          timeWindow: '04:30 PM - 07:30 PM',
          activityTitle: `Transfer to Airport/Station for Onward Journey`,
          attractionDescription: `Comfortable private transfer to departure terminal with packed memories of ${destName}.`,
          travelTimeEstimate: '40 mins via chauffeured vehicle',
          estimatedCost: 600,
        };
        notes = 'Ensure all hotel incidentals are settled and belongings packed 2 hours prior to flight/train.';
      } else {
        // Mid-journey days: map real activities from database
        const activityIndex = (i - 2) % (activities.length || 1);
        const assignedActivity = activities[activityIndex];

        if (assignedActivity) {
          dayTitle = `${assignedActivity.title} & Cultural Highlights`;
          morningSlot = {
            timeWindow: '08:30 AM - 12:30 PM',
            activityTitle: assignedActivity.title,
            attractionDescription: assignedActivity.description || `Signature excursion in ${destName}. Guided by certified local experts.`,
            travelTimeEstimate: '25 mins scenic drive',
            estimatedCost: Number(assignedActivity.pricePerPerson) * travelers,
            activityId: assignedActivity.id,
            category: assignedActivity.category,
          };
        } else {
          const attr = attractions[i % attractions.length];
          dayTitle = `Heritage & Exploration of ${attr}`;
          morningSlot = {
            timeWindow: '09:00 AM - 12:30 PM',
            activityTitle: `Guided Heritage Tour of ${attr}`,
            attractionDescription: `Explore centuries of architecture, panoramic photography vantage points, and cultural stories at ${attr}.`,
            travelTimeEstimate: '20 mins local drive',
            estimatedCost: 450 * travelers,
          };
        }

        afternoonSlot = {
          timeWindow: '01:30 PM - 04:30 PM',
          activityTitle: `Authentic Culinary Experience & Artisan Workshop`,
          attractionDescription: `Traditional luncheon followed by a visit to a local handicraft workshop or plantation trail.`,
          travelTimeEstimate: '15 mins',
          estimatedCost: 600 * travelers,
        };

        const eveAttr = attractions[(i + 1) % attractions.length] || 'Lakeside / Beach Promenade';
        eveningSlot = {
          timeWindow: '05:30 PM - 09:30 PM',
          activityTitle: `Twilight Vista at ${eveAttr} & Fine Dining`,
          attractionDescription: `Relaxing sunset stroll followed by dinner featuring fresh regional ingredients and cultural folk ambiance.`,
          travelTimeEstimate: '20 mins',
          estimatedCost: 900 * travelers,
        };
      }

      const estimatedDayCost = morningSlot.estimatedCost + afternoonSlot.estimatedCost + eveningSlot.estimatedCost;

      days.push({
        dayNumber: i,
        date: dateStr,
        dayOfWeek,
        title: dayTitle,
        morning: morningSlot,
        afternoon: afternoonSlot,
        evening: eveningSlot,
        suggestedMealBreaks: {
          breakfast: 'Regional specialty buffet at resort / local cafe (e.g. Appam/Poha/Idli)',
          lunch: 'Traditional Thali or Coastal Seafood platter with local herbs',
          dinner: 'Chef-curated candlelit dinner featuring regional curries and tandoor bread',
        },
        practicalTravelNotes: notes,
        estimatedDayCost,
        hotelStayName: hotel?.name,
      });
    }

    // 5. Calculate Detailed Budget Breakdown
    const budgetBreakdown = this.calculateDetailedBudget({
      destinationName: destName,
      numberOfDays: daysCount,
      travelersCount: travelers,
      userBudget: targetBudget,
      selectedHotel: hotel,
      selectedActivities: activities,
      travelStyle: style,
    });

    return {
      destination,
      numberOfDays: daysCount,
      startDate: baseDate.toISOString().split('T')[0],
      travelersCount: travelers,
      travelStyle: style,
      selectedHotel: hotel,
      selectedActivities: activities,
      days,
      budget: budgetBreakdown,
    };
  }

  /**
   * 2. BUDGET OPTIMIZER
   * Itemizes Accommodation, Activities, Packages, Transport, Other services, Taxes & Fees.
   */
  calculateDetailedBudget(params: {
    destinationName: string;
    numberOfDays: number;
    travelersCount: number;
    userBudget: number;
    selectedHotel?: any;
    selectedActivities?: any[];
    selectedPackage?: any;
    travelStyle?: string;
    transportMode?: 'AC_SEDAN' | 'AC_INNOVA' | 'LUXURY_SUV' | 'PUBLIC';
  }): BudgetBreakdown {
    const days = Math.max(1, params.numberOfDays);
    const travelers = Math.max(1, params.travelersCount);
    const nights = Math.max(1, days - 1);
    const rooms = Math.ceil(travelers / 2);
    const style = params.travelStyle?.toLowerCase() || 'moderate';

    // 1. Accommodation
    const nightlyRate = params.selectedHotel
      ? Number(params.selectedHotel.pricePerNight)
      : style.includes('luxury') ? 8500 : style.includes('budget') ? 2200 : 4200;
    const accommodationTotal = nightlyRate * nights * rooms;
    const hotelName = params.selectedHotel?.name || 'Selected Verified Hotel';

    // 2. Activities
    const activityItems = (params.selectedActivities || []).map((a) => ({
      id: a.id,
      title: a.title,
      pricePerPerson: Number(a.pricePerPerson),
      total: Number(a.pricePerPerson) * travelers,
    }));
    const activitiesTotal = activityItems.reduce((sum, item) => sum + item.total, 0);

    // 3. Travel Packages (if package chosen instead of piecemeal)
    const packageTotal = params.selectedPackage ? Number(params.selectedPackage.totalPrice) : 0;

    // 4. Transportation
    let dailyTransportRate = 1800; // standard AC Sedan / Taxi
    let transportMode = params.transportMode || 'AC_SEDAN';
    if (transportMode === 'AC_INNOVA' || travelers >= 4) {
      dailyTransportRate = 2600;
    } else if (style.includes('luxury')) {
      dailyTransportRate = 4200;
    } else if (style.includes('budget')) {
      dailyTransportRate = 1000;
    }
    const transportTotal = dailyTransportRate * days;

    // 5. Meals & Dining
    let dailyMealPerPerson = 1200;
    if (style.includes('luxury')) dailyMealPerPerson = 2800;
    else if (style.includes('budget')) dailyMealPerPerson = 600;
    const mealsTotal = dailyMealPerPerson * days * travelers;

    // 6. Other Services (monument permits, guide allowances, parking)
    const otherServicesItems = [
      { name: 'Monuments & Sanctuary Environmental Permits', amount: 350 * travelers },
      { name: 'Certified Local Destination Guide (2 Days)', amount: 2000 },
    ];
    const otherServicesTotal = otherServicesItems.reduce((s, i) => s + i.amount, 0);

    // 7. Taxes & Fees (Standard 5% GST on hospitality + verified escrow protection)
    const subtotal = accommodationTotal + activitiesTotal + packageTotal + transportTotal + otherServicesTotal;
    const gstRatePercent = 5;
    const taxesAndFeesTotal = Math.round(subtotal * (gstRatePercent / 100));

    // Grand Total
    const totalEstimatedExpenditure = subtotal + mealsTotal + taxesAndFeesTotal;
    const perPersonExpenditure = Math.round(totalEstimatedExpenditure / travelers);
    const remainingBudget = params.userBudget - totalEstimatedExpenditure;

    let budgetStatus: 'OPTIMAL' | 'TIGHT' | 'EXCEEDED' | 'LUXURY_SURPLUS' = 'OPTIMAL';
    if (remainingBudget < 0) {
      budgetStatus = 'EXCEEDED';
    } else if (remainingBudget <= params.userBudget * 0.1) {
      budgetStatus = 'TIGHT';
    } else if (remainingBudget >= params.userBudget * 0.3) {
      budgetStatus = 'LUXURY_SURPLUS';
    }

    return {
      accommodation: {
        amount: accommodationTotal,
        hotelName,
        nightlyRate,
        nights,
        roomsCount: rooms,
        assumptions: `₹${nightlyRate.toLocaleString('en-IN')}/night × ${nights} nights × ${rooms} room(s) for ${travelers} guest(s)`,
      },
      activities: {
        amount: activitiesTotal,
        itemsCount: activityItems.length,
        items: activityItems,
        assumptions: `${activityItems.length} curated excursion(s) calculated per traveler`,
      },
      travelPackages: {
        amount: packageTotal,
        packageName: params.selectedPackage?.title,
        assumptions: packageTotal > 0 ? 'Verified package rate inclusive of agency guarantee' : 'Custom modular itinerary',
      },
      transportation: {
        amount: transportTotal,
        mode: transportMode,
        dailyRate: dailyTransportRate,
        daysCount: days,
        assumptions: `₹${dailyTransportRate.toLocaleString('en-IN')}/day dedicated vehicle for ${days} days`,
      },
      mealsAndDining: {
        amount: mealsTotal,
        dailyPerPerson: dailyMealPerPerson,
        daysCount: days,
        assumptions: `₹${dailyMealPerPerson.toLocaleString('en-IN')}/day/person (Breakfast, Lunch & Dinner) for ${days} days`,
      },
      otherServices: {
        amount: otherServicesTotal,
        items: otherServicesItems,
        assumptions: 'State entry passes, eco-levies, and verified specialist guide',
      },
      taxesAndFees: {
        amount: taxesAndFeesTotal,
        gstRatePercent,
        assumptions: `Standard ${gstRatePercent}% GST on hospitality and escrow booking protection`,
      },
      totalEstimatedExpenditure,
      perPersonExpenditure,
      userBudget: params.userBudget,
      remainingBudget,
      budgetStatus,
    };
  }

  /**
   * 3. BUDGET INTELLIGENCE & OPTIMIZATION
   * If expenditure exceeds budget:
   * 1. Identifies expensive components
   * 2. Finds real alternative hotels in DB
   * 3. Finds alternative activities
   * 4. Recalculates itinerary & compares budgets
   * 5. Explains savings in clear natural language
   */
  async optimizeBudget(params: {
    destinationId?: string;
    destinationName?: string;
    numberOfDays: number;
    travelersCount: number;
    userBudget: number;
    currentHotelId?: string;
    currentActivityIds?: string[];
    travelStyle?: string;
    startDate?: string;
  }): Promise<BudgetOptimizationResult> {
    const days = Math.max(1, params.numberOfDays);
    const travelers = Math.max(1, params.travelersCount);
    const nights = Math.max(1, days - 1);
    const rooms = Math.ceil(travelers / 2);

    // 1. Resolve current destination
    let dest = null;
    if (params.destinationId) {
      dest = await prisma.destination.findUnique({ where: { id: params.destinationId } });
    } else if (params.destinationName) {
      dest = await prisma.destination.findFirst({
        where: {
          OR: [
            { name: { contains: params.destinationName, mode: 'insensitive' } },
            { slug: { contains: params.destinationName.toLowerCase() } },
          ],
          isActive: true,
        },
      });
    }

    // 2. Fetch current hotel
    let currentHotel = null;
    if (params.currentHotelId) {
      currentHotel = await prisma.hotel.findUnique({ where: { id: params.currentHotelId } });
    } else if (dest) {
      currentHotel = await prisma.hotel.findFirst({
        where: { destinationId: dest.id, isActive: true },
        orderBy: { pricePerNight: 'desc' }, // default to highest to demonstrate optimization
      });
    }

    // 3. Fetch current activities
    let currentActivities: any[] = [];
    if (params.currentActivityIds && params.currentActivityIds.length > 0) {
      currentActivities = await prisma.activity.findMany({
        where: { id: { in: params.currentActivityIds }, isActive: true },
      });
    } else if (dest) {
      currentActivities = await prisma.activity.findMany({
        where: { destinationId: dest.id, isActive: true },
        take: 3,
      });
    }

    // 4. Calculate Original Budget
    const originalBudget = this.calculateDetailedBudget({
      destinationName: dest?.name || 'Destination',
      numberOfDays: days,
      travelersCount: travelers,
      userBudget: params.userBudget,
      selectedHotel: currentHotel,
      selectedActivities: currentActivities,
      travelStyle: params.travelStyle,
    });

    const isOverBudget = originalBudget.totalEstimatedExpenditure > params.userBudget;

    // 5. Identify Expensive Components
    const expensiveComponents: Array<{
      category: string;
      itemTitle: string;
      originalCost: number;
      percentageOfTotal: number;
      reason: string;
    }> = [];

    const stayCost = originalBudget.accommodation.amount;
    const stayPct = Math.round((stayCost / originalBudget.totalEstimatedExpenditure) * 100);
    if (stayPct > 35 && currentHotel) {
      expensiveComponents.push({
        category: 'ACCOMMODATION',
        itemTitle: currentHotel.name,
        originalCost: stayCost,
        percentageOfTotal: stayPct,
        reason: `${currentHotel.name} represents ${stayPct}% of total expenditure (₹${Number(currentHotel.pricePerNight).toLocaleString('en-IN')}/night).`,
      });
    }

    for (const act of currentActivities) {
      const actCost = Number(act.pricePerPerson) * travelers;
      const actPct = Math.round((actCost / originalBudget.totalEstimatedExpenditure) * 100);
      if (actPct >= 10) {
        expensiveComponents.push({
          category: 'ACTIVITY',
          itemTitle: act.title,
          originalCost: actCost,
          percentageOfTotal: actPct,
          reason: `High excursion price: ₹${Number(act.pricePerPerson).toLocaleString('en-IN')}/person (${actPct}% of total).`,
        });
      }
    }

    // 6. Find Real Database Alternatives
    let suggestedHotelResult = undefined;
    let alternativeHotel = null;

    if (currentHotel && dest) {
      // Find cheaper alternative hotel in the same destination
      alternativeHotel = await prisma.hotel.findFirst({
        where: {
          destinationId: dest.id,
          isActive: true,
          id: { not: currentHotel.id },
          pricePerNight: { lt: currentHotel.pricePerNight },
          availableRooms: { gte: rooms },
        },
        orderBy: { pricePerNight: 'asc' },
      });

      if (alternativeHotel) {
        const origStay = Number(currentHotel.pricePerNight) * nights * rooms;
        const altStay = Number(alternativeHotel.pricePerNight) * nights * rooms;
        const hotelSavings = origStay - altStay;

        if (hotelSavings > 0) {
          suggestedHotelResult = {
            original: {
              id: currentHotel.id,
              name: currentHotel.name,
              stars: currentHotel.stars,
              nightlyRate: Number(currentHotel.pricePerNight),
              totalStay: origStay,
            },
            suggested: {
              id: alternativeHotel.id,
              name: alternativeHotel.name,
              stars: alternativeHotel.stars,
              nightlyRate: Number(alternativeHotel.pricePerNight),
              totalStay: altStay,
              availableRooms: alternativeHotel.availableRooms,
            },
            savings: hotelSavings,
          };
        }
      }
    }

    // 7. Find Real Database Activity Alternatives
    const suggestedActivitiesResult: any[] = [];
    let optimizedActivitiesList = [...currentActivities];

    if (currentActivities.length > 0 && dest) {
      for (let idx = 0; idx < currentActivities.length; idx++) {
        const expensiveAct = currentActivities[idx];
        if (Number(expensiveAct.pricePerPerson) > 1500) {
          const alternativeAct = await prisma.activity.findFirst({
            where: {
              destinationId: dest.id,
              isActive: true,
              id: { notIn: currentActivities.map((a) => a.id) },
              pricePerPerson: { lt: expensiveAct.pricePerPerson },
              availableSlots: { gte: travelers },
            },
            orderBy: { pricePerPerson: 'asc' },
          });

          if (alternativeAct) {
            const origTotal = Number(expensiveAct.pricePerPerson) * travelers;
            const altTotal = Number(alternativeAct.pricePerPerson) * travelers;
            const actSavings = origTotal - altTotal;

            if (actSavings > 0) {
              suggestedActivitiesResult.push({
                original: {
                  id: expensiveAct.id,
                  title: expensiveAct.title,
                  pricePerPerson: Number(expensiveAct.pricePerPerson),
                  total: origTotal,
                },
                suggested: {
                  id: alternativeAct.id,
                  title: alternativeAct.title,
                  pricePerPerson: Number(alternativeAct.pricePerPerson),
                  total: altTotal,
                  availableSlots: alternativeAct.availableSlots,
                },
                savings: actSavings,
              });

              // Swap in the optimized list
              optimizedActivitiesList[idx] = alternativeAct;
              break; // Optimize one activity at a time to prevent over-trimming
            }
          }
        }
      }
    }

    // 8. Recalculate Itinerary & Budget with Chosen Alternatives
    const effectiveHotel = alternativeHotel || currentHotel;
    const recalculatedBudget = this.calculateDetailedBudget({
      destinationName: dest?.name || 'Destination',
      numberOfDays: days,
      travelersCount: travelers,
      userBudget: params.userBudget,
      selectedHotel: effectiveHotel,
      selectedActivities: optimizedActivitiesList,
      travelStyle: params.travelStyle,
    });

    // 9. Regenerate Day-by-Day Schedule with Optimized Inventory
    const fullItinerary = await this.generateCompleteItinerary({
      destinationId: dest?.id,
      numberOfDays: days,
      startDate: params.startDate,
      travelersCount: travelers,
      budget: recalculatedBudget.totalEstimatedExpenditure,
      hotelId: effectiveHotel?.id,
      activityIds: optimizedActivitiesList.map((a) => a.id),
      travelStyle: params.travelStyle,
    });

    const totalSavings = originalBudget.totalEstimatedExpenditure - recalculatedBudget.totalEstimatedExpenditure;
    const savingsPerPerson = Math.round(totalSavings / travelers);

    // 10. Natural Language AI Explanation of Savings
    let explanation = '';
    if (isOverBudget && totalSavings > 0) {
      const hotelChangeNote = suggestedHotelResult
        ? `Replaced ${suggestedHotelResult.original.name} (₹${suggestedHotelResult.original.nightlyRate.toLocaleString('en-IN')}/night) with ${suggestedHotelResult.suggested.name} (₹${suggestedHotelResult.suggested.nightlyRate.toLocaleString('en-IN')}/night, saving ₹${suggestedHotelResult.savings.toLocaleString('en-IN')}).`
        : '';
      const actChangeNote = suggestedActivitiesResult.length > 0
        ? `Swapped ${suggestedActivitiesResult[0].original.title} with verified alternative ${suggestedActivitiesResult[0].suggested.title} (saving ₹${suggestedActivitiesResult[0].savings.toLocaleString('en-IN')}).`
        : '';

      explanation = `Selected plan (₹${originalBudget.totalEstimatedExpenditure.toLocaleString('en-IN')}) exceeded your target budget of ₹${params.userBudget.toLocaleString('en-IN')} by ₹${Math.abs(originalBudget.remainingBudget).toLocaleString('en-IN')}. AI Budget Intelligence identified cost drivers and optimized your itinerary: ${hotelChangeNote} ${actChangeNote} Optimized estimate is now ₹${recalculatedBudget.totalEstimatedExpenditure.toLocaleString('en-IN')}, achieving ₹${totalSavings.toLocaleString('en-IN')} total savings (₹${savingsPerPerson.toLocaleString('en-IN')}/person) while maintaining all primary sightseeing highlights.`;
    } else if (isOverBudget) {
      explanation = `Your selected itinerary costs ₹${originalBudget.totalEstimatedExpenditure.toLocaleString('en-IN')}, which exceeds your ₹${params.userBudget.toLocaleString('en-IN')} budget by ₹${Math.abs(originalBudget.remainingBudget).toLocaleString('en-IN')}. Consider reducing trip duration or selecting a budget homestay.`;
    } else {
      explanation = `Your selected plan of ₹${originalBudget.totalEstimatedExpenditure.toLocaleString('en-IN')} is fully within your ₹${params.userBudget.toLocaleString('en-IN')} budget, maintaining a ₹${originalBudget.remainingBudget.toLocaleString('en-IN')} contingency cushion.`;
    }

    return {
      isOverBudget,
      originalEstimate: originalBudget.totalEstimatedExpenditure,
      optimizedEstimate: recalculatedBudget.totalEstimatedExpenditure,
      totalSavings: Math.max(0, totalSavings),
      savingsPerPerson: Math.max(0, savingsPerPerson),
      userBudget: params.userBudget,
      expensiveComponents,
      suggestedAlternatives: {
        hotel: suggestedHotelResult,
        activities: suggestedActivitiesResult.length > 0 ? suggestedActivitiesResult : undefined,
      },
      recalculatedBudget,
      optimizedItineraryDays: fullItinerary.days,
      explanation,
    };
  }
}

export const budgetIntelligenceService = new BudgetIntelligenceService();

