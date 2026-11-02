import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { UserRole, UserStatus, Prisma } from '@prisma/client';

async function seed() {
  console.log('🌱 Starting WayRivo AI 2.0 database seeding...');

  // Hash standard password for seed accounts
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Users
  console.log('👤 Seeding users...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wayrivo.com' },
    update: {},
    create: {
      email: 'admin@wayrivo.com',
      passwordHash,
      name: 'WayRivo Global Admin',
      phone: '+91 90000 00001',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const traveler1 = await prisma.user.upsert({
    where: { email: 'arjun@example.com' },
    update: {},
    create: {
      email: 'arjun@example.com',
      passwordHash,
      name: 'Arjun Sharma',
      phone: '+91 91000 00001',
      role: UserRole.TRAVELER,
      status: UserStatus.ACTIVE,
    },
  });

  const traveler2 = await prisma.user.upsert({
    where: { email: 'priya@example.com' },
    update: {},
    create: {
      email: 'priya@example.com',
      passwordHash,
      name: 'Priya Patel',
      phone: '+91 91000 00002',
      role: UserRole.TRAVELER,
      status: UserStatus.ACTIVE,
    },
  });

  const expert1 = await prisma.user.upsert({
    where: { email: 'vikram@example.com' },
    update: {},
    create: {
      email: 'vikram@example.com',
      passwordHash,
      name: 'Vikram Travels & Tours',
      phone: '+91 92000 00001',
      role: UserRole.EXPERT,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Seed Destinations, Hotels, Activities, and Packages
  console.log('🗺️ Seeding destinations & inventory...');

  const destinationsData = [
    {
      name: 'Kerala',
      slug: 'kerala',
      country: 'India',
      state: 'Kerala',
      description: "God's Own Country — lush backwaters, serene houseboats, aromatic spice plantations, and Ayurvedic rejuvenation along tropical shores.",
      imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
      bestTimeToVisit: 'September to March',
      averageBudget: new Prisma.Decimal(25000.00),
      currency: 'INR',
      hotels: [
        {
          name: 'Kumarakom Lake Luxury Resort',
          description: 'Award-winning heritage luxury resort nestled along the tranquil banks of Vembanad Lake.',
          address: 'Kumarakom North Post, Kottayam',
          city: 'Kumarakom',
          stars: 5,
          pricePerNight: new Prisma.Decimal(14500.00),
          currency: 'INR',
          amenities: ['Private Pool', 'Ayurvedic Spa', 'Lakefront Dining', 'Houseboat Dock', 'Wi-Fi'],
          imageUrls: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
        },
        {
          name: 'Munnar Mist Heritage Homestay',
          description: 'Scenic plantation homestay surrounded by rolling emerald tea estates and mountain waterfalls.',
          address: 'Pallivasal, Munnar',
          city: 'Munnar',
          stars: 4,
          pricePerNight: new Prisma.Decimal(6200.00),
          currency: 'INR',
          amenities: ['Mountain View', 'Tea Garden Walk', 'Fireplace', 'Homecooked Organic Meals'],
          imageUrls: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'],
        },
      ],
      activities: [
        {
          title: 'Private Alleppey Houseboat Day Cruise',
          description: 'Glide through winding backwaters with a dedicated chef preparing fresh authentic Karimeen fish curry.',
          category: 'Cruise & Leisure',
          durationHours: new Prisma.Decimal(6.0),
          pricePerPerson: new Prisma.Decimal(4500.00),
          currency: 'INR',
          imageUrls: ['https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80'],
        },
        {
          title: 'Periyar Wildlife Bamboo Rafting Safari',
          description: 'Eco-guided bamboo rafting through Periyar Tiger Reserve with rare avian and elephant sightings.',
          category: 'Adventure & Wildlife',
          durationHours: new Prisma.Decimal(4.5),
          pricePerPerson: new Prisma.Decimal(2800.00),
          currency: 'INR',
          imageUrls: ['https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'],
        },
      ],
      packages: [
        {
          title: 'Kerala Backwater Bliss & Tea Sanctuary',
          description: 'A 5-day quintessential family & couple retreat covering Fort Kochi, Munnar tea highlands, and an overnight private Alleppey houseboat.',
          durationDays: 5,
          totalPrice: new Prisma.Decimal(48500.00),
          pricePerPerson: new Prisma.Decimal(24250.00),
          currency: 'INR',
          inclusions: ['4-Star & 5-Star Stays', 'Private AC Innova Transfer', 'All Breakfasts & Houseboat Full Board', 'Spice Plantation Tour'],
          exclusions: ['Flights', 'Alcoholic Beverages', 'Personal Expenses'],
          cancellationPolicy: '100% refund up to 14 days before journey. 50% refund 7-13 days prior.',
          isRecommended: true,
          expertName: 'Vikram Menon',
          organizationName: 'Vikram Travels & Tours',
          expertRating: new Prisma.Decimal(4.9),
          expertReviews: 48,
          imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      name: 'Rajasthan',
      slug: 'rajasthan',
      country: 'India',
      state: 'Rajasthan',
      description: 'The Land of Kings — grand royal palaces, formidable desert forts, sunset camel safaris, and rich Rajasthani cuisine.',
      imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
      bestTimeToVisit: 'October to March',
      averageBudget: new Prisma.Decimal(32000.00),
      currency: 'INR',
      hotels: [
        {
          name: 'Udaivilas Lakefront Palace',
          description: 'Majestic palace architecture on the banks of Lake Pichola with private courtyard pools and Mewari dining.',
          address: 'Haridas Ji Ki Magri, Udaipur',
          city: 'Udaipur',
          stars: 5,
          pricePerNight: new Prisma.Decimal(24000.00),
          currency: 'INR',
          amenities: ['Lake View', 'Butler Service', 'Royal Spa', 'Fine Dining', 'Pool'],
          imageUrls: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
        },
      ],
      activities: [
        {
          title: 'Amber Fort Royal Heritage Walk & Elephant Sanctuary',
          description: 'Guided historian tour of Jaipur mirror halls followed by ethical elephant sanctuary interaction.',
          category: 'Heritage & Culture',
          durationHours: new Prisma.Decimal(4.0),
          pricePerPerson: new Prisma.Decimal(1800.00),
          currency: 'INR',
          imageUrls: ['https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80'],
        },
      ],
      packages: [
        {
          title: 'Royal Rajasthan Heritage & Desert Odyssey',
          description: '6 days traversing Jaipur Pink City, Jodhpur Blue City, and luxury glamping under the Thar Desert starlit skies.',
          durationDays: 6,
          totalPrice: new Prisma.Decimal(68000.00),
          pricePerPerson: new Prisma.Decimal(34000.00),
          currency: 'INR',
          inclusions: ['Heritage Palace Hotels', 'Private Chauffeur', 'Desert Luxury Camp', 'Fort Passes & Guides'],
          exclusions: ['Airfare', 'Camera Fees', 'Tips'],
          cancellationPolicy: 'Free cancellation up to 10 days before departure.',
          isRecommended: true,
          expertName: 'Rajendra Singh Rathore',
          organizationName: 'Raj Tourism Co',
          expertRating: new Prisma.Decimal(4.9),
          expertReviews: 62,
          imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      name: 'Goa',
      slug: 'goa',
      country: 'India',
      state: 'Goa',
      description: "India's premier coastal haven — palm-fringed sands, Portuguese colonial villas, lively night markets, and sunset catamaran cruises.",
      imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
      bestTimeToVisit: 'October to April',
      averageBudget: new Prisma.Decimal(22000.00),
      currency: 'INR',
      hotels: [
        {
          name: 'Taj Exotica Beach Resort',
          description: 'Sprawling Mediterranean-style villa resort along the pristine white sands of Benaulim Beach.',
          address: 'Calwaddo, Benaulim',
          city: 'South Goa',
          stars: 5,
          pricePerNight: new Prisma.Decimal(18500.00),
          currency: 'INR',
          amenities: ['Direct Beach Access', 'Golf Course', 'Infinity Pool', 'Seafood Grill'],
          imageUrls: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'],
        },
      ],
      activities: [
        {
          title: 'Sunset Catamaran Cruise with Dolphin Watching',
          description: 'Sail the Arabian Sea at golden hour with chilled beverages, music, and wild dolphin spotting.',
          category: 'Water Sports & Coastal',
          durationHours: new Prisma.Decimal(3.0),
          pricePerPerson: new Prisma.Decimal(2200.00),
          currency: 'INR',
          imageUrls: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
        },
      ],
      packages: [
        {
          title: 'Goa Sun, Sand & Portuguese Charm',
          description: '4 days of boutique heritage villa living, sunset sailing, and chef-curated coastal dining.',
          durationDays: 4,
          totalPrice: new Prisma.Decimal(36000.00),
          pricePerPerson: new Prisma.Decimal(18000.00),
          currency: 'INR',
          inclusions: ['4-Star Boutique Resort', 'Private Airport Transfers', 'Sunset Cruise', 'Daily Breakfast'],
          exclusions: ['Flights', 'Watersport Upgrades'],
          cancellationPolicy: 'Full refund up to 7 days prior.',
          isRecommended: false,
          expertName: 'Sunita D Souza',
          organizationName: 'Sunita Holidays',
          expertRating: new Prisma.Decimal(4.7),
          expertReviews: 29,
          imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      name: 'Ladakh',
      slug: 'ladakh',
      country: 'India',
      state: 'Ladakh',
      description: 'The Land of High Mountain Passes — dramatic moonscapes, centuries-old Buddhist gompas, azure high-altitude lakes, and starlit night skies.',
      imageUrl: 'https://images.unsplash.com/photo-1626015365107-4986c390e5d2?auto=format&fit=crop&w=1200&q=80',
      bestTimeToVisit: 'June to September',
      averageBudget: new Prisma.Decimal(35000.00),
      currency: 'INR',
      hotels: [
        {
          name: 'The Grand Dragon Ladakh',
          description: 'Solar-heated premier luxury hotel overlooking the snow-capped Stok Kangri mountain range.',
          address: 'Old Road, Sheynam',
          city: 'Leh',
          stars: 5,
          pricePerNight: new Prisma.Decimal(13000.00),
          currency: 'INR',
          amenities: ['Oxygen-Enriched Rooms', 'Heating', 'Mountain Views', 'Traditional Cuisine'],
          imageUrls: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'],
        },
      ],
      activities: [
        {
          title: 'Pangong Tso & Chang La High Altitude Expedition',
          description: 'Cross the world third highest motorable pass to witness the ever-changing blue hues of Pangong Lake.',
          category: 'High Altitude Adventure',
          durationHours: new Prisma.Decimal(10.0),
          pricePerPerson: new Prisma.Decimal(5500.00),
          currency: 'INR',
          imageUrls: ['https://images.unsplash.com/photo-1626015365107-4986c390e5d2?auto=format&fit=crop&w=800&q=80'],
        },
      ],
      packages: [
        {
          title: 'Himalayan High Passes & Monasteries of Ladakh',
          description: '7-day acclimatized expedition through Leh, Nubra Valley sand dunes, and turquoise Pangong Tso.',
          durationDays: 7,
          totalPrice: new Prisma.Decimal(58000.00),
          pricePerPerson: new Prisma.Decimal(29000.00),
          currency: 'INR',
          inclusions: ['Hotels & Nubra Luxury Camps', 'Oxygen Cylinder Equipped 4x4 SUV', 'Inner Line Permits', 'All Meals'],
          exclusions: ['Flights to Leh', 'Personal Cold Gear'],
          cancellationPolicy: 'Free cancellation up to 15 days before travel.',
          isRecommended: true,
          expertName: 'Meera Joshi',
          organizationName: 'Meera Adventures India',
          expertRating: new Prisma.Decimal(4.9),
          expertReviews: 38,
          imageUrl: 'https://images.unsplash.com/photo-1626015365107-4986c390e5d2?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      name: 'Manali',
      slug: 'manali',
      country: 'India',
      state: 'Himachal Pradesh',
      description: 'The Himalayan jewel — pine forests, Solang Valley adventure sports, rushing Beas river rapids, and snow-capped peaks.',
      imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
      bestTimeToVisit: 'March to June & October to December',
      averageBudget: new Prisma.Decimal(22000.00),
      currency: 'INR',
      hotels: [],
      activities: [],
      packages: [],
    },
    {
      name: 'Andaman Islands',
      slug: 'andaman-islands',
      country: 'India',
      state: 'Andaman & Nicobar',
      description: 'Tropical archipelago paradise — powdery white sand beaches, untouched coral reefs, scuba diving, and bioluminescent kayak tours.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      bestTimeToVisit: 'October to May',
      averageBudget: new Prisma.Decimal(28000.00),
      currency: 'INR',
      hotels: [],
      activities: [],
      packages: [],
    },
    {
      name: 'Varanasi',
      slug: 'varanasi',
      country: 'India',
      state: 'Uttar Pradesh',
      description: 'The spiritual heart of India — eternal Ganga ghats, hypnotic evening aarti ceremonies, silk weaving, and 5,000 years of living philosophy.',
      imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
      bestTimeToVisit: 'October to March',
      averageBudget: new Prisma.Decimal(16000.00),
      currency: 'INR',
      hotels: [],
      activities: [],
      packages: [],
    },
    {
      name: 'Meghalaya',
      slug: 'meghalaya',
      country: 'India',
      state: 'Meghalaya',
      description: 'The Abode of Clouds — living bio-engineered root bridges, roaring canyon waterfalls, crystal-clear Dawki river, and limestone cave networks.',
      imageUrl: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=80',
      bestTimeToVisit: 'October to April',
      averageBudget: new Prisma.Decimal(20000.00),
      currency: 'INR',
      hotels: [],
      activities: [],
      packages: [],
    },
  ];

  for (const dest of destinationsData) {
    const destination = await prisma.destination.upsert({
      where: { slug: dest.slug },
      update: {
        description: dest.description,
        imageUrl: dest.imageUrl,
        bestTimeToVisit: dest.bestTimeToVisit,
        averageBudget: dest.averageBudget,
      },
      create: {
        name: dest.name,
        slug: dest.slug,
        country: dest.country,
        state: dest.state,
        description: dest.description,
        imageUrl: dest.imageUrl,
        bestTimeToVisit: dest.bestTimeToVisit,
        averageBudget: dest.averageBudget,
        currency: dest.currency,
      },
    });

    // Seed Hotels
    for (const hotel of dest.hotels) {
      await prisma.hotel.create({
        data: {
          destinationId: destination.id,
          name: hotel.name,
          description: hotel.description,
          address: hotel.address,
          city: hotel.city,
          stars: hotel.stars,
          pricePerNight: hotel.pricePerNight,
          currency: hotel.currency,
          amenities: hotel.amenities,
          imageUrls: hotel.imageUrls,
        },
      });
    }

    // Seed Activities
    for (const act of dest.activities) {
      await prisma.activity.create({
        data: {
          destinationId: destination.id,
          title: act.title,
          description: act.description,
          category: act.category,
          durationHours: act.durationHours,
          pricePerPerson: act.pricePerPerson,
          currency: act.currency,
          imageUrls: act.imageUrls,
        },
      });
    }

    // Seed Packages
    for (const pkg of dest.packages) {
      await prisma.travelPackage.create({
        data: {
          destinationId: destination.id,
          title: pkg.title,
          description: pkg.description,
          durationDays: pkg.durationDays,
          totalPrice: pkg.totalPrice,
          pricePerPerson: pkg.pricePerPerson,
          currency: pkg.currency,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          cancellationPolicy: pkg.cancellationPolicy,
          isRecommended: pkg.isRecommended,
          expertName: pkg.expertName,
          organizationName: pkg.organizationName,
          expertRating: pkg.expertRating,
          expertReviews: pkg.expertReviews,
          imageUrl: pkg.imageUrl,
        },
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
