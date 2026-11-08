import { prisma } from './src/config/db';
import { BookingStatus, BookingItemType, PaymentStatus, EscrowStatus, Prisma } from '@prisma/client';

export async function seedPendingBookings() {
  console.log('Seeding pending payment bookings for travelers...');

  // 1. Find or create demo travelers
  let arjun = await prisma.user.findUnique({ where: { email: 'arjun@example.com' } });
  let priya = await prisma.user.findUnique({ where: { email: 'priya@example.com' } });

  if (!arjun) {
    arjun = await prisma.user.findFirst({ where: { role: 'TRAVELER' } });
  }

  // 2. Fetch Destinations
  const kerala = await prisma.destination.findFirst({ where: { name: 'Kerala' } });
  const rajasthan = await prisma.destination.findFirst({ where: { name: 'Rajasthan' } });
  const manali = await prisma.destination.findFirst({ where: { name: 'Manali' } });

  if (!kerala || !rajasthan || !manali) {
    console.error('Core destinations missing in DB. Cannot seed bookings.');
    return;
  }

  const targetUsers = [arjun, priya].filter(Boolean);

  for (const user of targetUsers) {
    if (!user) continue;

    console.log(`Processing user: ${user.name} (${user.email}) [ID: ${user.id}]`);

    // Definition of 3 realistic pending payment bookings
    const pendingSpecs = [
      {
        ref: `WR-2026-KL${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Kerala Backwaters & Munnar Spice Plantations Retreat',
        destinationId: kerala.id,
        destName: 'Kerala',
        state: 'Kerala',
        departureCity: 'Mumbai',
        expertName: 'Kerala Travel Collective',
        agencyName: 'Kerala Travel Collective',
        durationDays: 5,
        travelersCount: 2,
        totalAmount: 58000,
        daysOffset: 15,
        hotelTitle: 'Kumarakom Lake Luxury Resort',
        hotelCost: 43500,
        activityTitle: 'Private Vembanad Lake Sunset Cruise & Organic Spice Walk',
        activityCost: 14500,
        notes: '[FROM:Mumbai][DEST:Kerala Backwaters & Munnar][EXPERT:Kerala Travel Collective] Premium lakeview cottage, private boat pickup at Vembanad Lake. Non-smoking room, vegetarian meal preference.',
      },
      {
        ref: `WR-2026-RJ${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Royal Rajasthan Desert Safari & Heritage Palaces Expedition',
        destinationId: rajasthan.id,
        destName: 'Rajasthan',
        state: 'Rajasthan',
        departureCity: 'New Delhi',
        expertName: 'Vikram Singh Rathore',
        agencyName: 'Royal Rajasthan Journeys',
        durationDays: 6,
        travelersCount: 2,
        totalAmount: 75000,
        daysOffset: 25,
        hotelTitle: 'Fateh Garh Heritage Palace',
        hotelCost: 50000,
        activityTitle: 'Vintage Car Chauffeur, Lake Pichola Sunset Cruise & Thar Desert Camp',
        activityCost: 25000,
        notes: '[FROM:New Delhi][DEST:Royal Rajasthan & Udaipur][EXPERT:Vikram Singh Rathore • Royal Rajasthan Journeys] High floor lakeview palace room, desert camel safari for sunset photography.',
      },
      {
        ref: `WR-2026-MN${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Manali & Solang Valley Snow & Alpine Adventure',
        destinationId: manali.id,
        destName: 'Manali',
        state: 'Himachal Pradesh',
        departureCity: 'Chandigarh',
        expertName: 'Himalayan Mountain Guides',
        agencyName: 'Himalayan Mountain Guides',
        durationDays: 5,
        travelersCount: 2,
        totalAmount: 44000,
        daysOffset: 35,
        hotelTitle: 'The Himalayan Castle & Luxury Spa',
        hotelCost: 33000,
        activityTitle: 'Solang Valley Ski Pass, Rohtang Snow Excursion & Riverside Bonfire',
        activityCost: 11000,
        notes: '[FROM:Chandigarh][DEST:Manali & Solang Valley][EXPERT:Himalayan Mountain Guides] Snow chains equipped 4x4 transfer, heated room with balcony facing snow peaks.',
      },
    ];

    for (const spec of pendingSpecs) {
      // Check if user already has this specific title as pending
      const existing = await prisma.booking.findFirst({
        where: {
          userId: user.id,
          status: BookingStatus.PENDING_PAYMENT,
          itinerary: { title: spec.title },
        },
      });

      if (existing) {
        console.log(`- Booking already exists for ${user.email}: ${existing.bookingReference} (${spec.title})`);
        continue;
      }

      const startDate = new Date(Date.now() + spec.daysOffset * 86400000);
      const endDate = new Date(startDate.getTime() + spec.durationDays * 86400000);
      const totalAmount = new Prisma.Decimal(spec.totalAmount);

      // Create Itinerary
      const itinerary = await prisma.itinerary.create({
        data: {
          userId: user.id,
          destinationId: spec.destinationId,
          title: spec.title,
          travelStyle: 'Bespoke Escrow',
          startDate,
          endDate,
          numberOfDays: spec.durationDays,
          travelersCount: spec.travelersCount,
          budget: totalAmount,
          currency: 'INR',
          status: 'PROPOSED',
          totalEstimatedCost: totalAmount,
          days: {
            create: [
              {
                dayNumber: 1,
                title: `Day 1: Departure from ${spec.departureCity} & Arrival in ${spec.destName}`,
                description: `Private pickup at airport/railway station, scenic chauffeured transfer to ${spec.hotelTitle}, welcome refreshments, and leisure evening.`,
                estimatedDayCost: totalAmount.mul(0.25),
              },
              {
                dayNumber: 2,
                title: `Day 2: Curated Guided Specialist Excursion in ${spec.destName}`,
                description: spec.activityTitle,
                estimatedDayCost: totalAmount.mul(0.4),
              },
              {
                dayNumber: 3,
                title: `Day 3: Cultural Immersion, Local Gastronomy & Relaxed Return`,
                description: `Local artisanal craft visits, authentic regional cuisine lunch, and transfer for departure back to ${spec.departureCity}.`,
                estimatedDayCost: totalAmount.mul(0.35),
              },
            ],
          },
        },
      });

      // Create Pending Booking with Line Items
      const booking = await prisma.booking.create({
        data: {
          bookingReference: spec.ref,
          userId: user.id,
          itineraryId: itinerary.id,
          status: BookingStatus.PENDING_PAYMENT,
          totalAmount,
          currency: 'INR',
          specialRequests: spec.notes,
          items: {
            create: [
              {
                itemType: BookingItemType.HOTEL,
                title: `${spec.hotelTitle} (${spec.destName})`,
                unitPrice: new Prisma.Decimal(spec.hotelCost),
                quantity: 1,
                totalPrice: new Prisma.Decimal(spec.hotelCost),
                notes: `3-4 Nights luxury stay, complimentary breakfast, lake/mountain view.`,
              },
              {
                itemType: BookingItemType.CUSTOM,
                title: spec.activityTitle,
                unitPrice: new Prisma.Decimal(spec.activityCost),
                quantity: 1,
                totalPrice: new Prisma.Decimal(spec.activityCost),
                notes: `Guided specialist tour by ${spec.expertName} (${spec.agencyName}).`,
              },
            ],
          },
        },
      });

      console.log(`✅ Created Pending Booking: ${booking.bookingReference} | ₹${spec.totalAmount.toLocaleString()} | ${spec.title}`);
    }
  }

  console.log('Finished seeding pending payment bookings.');
}

if (require.main === module || process.argv[1]?.includes('seed-pending-bookings')) {
  seedPendingBookings()
    .catch(console.error)
    .finally(async () => {
      await prisma.$disconnect();
    });
}

