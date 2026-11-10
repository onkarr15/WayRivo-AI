import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { packageService } from '../../services';
import {
  Search,
  Sparkles,
  MapPin,
  Calendar,
  Star,
  Check,
  ShieldCheck,
  Bot,
  SlidersHorizontal,
  LayoutGrid,
  List,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PriceDisplay } from '../../components/ui/PriceDisplay';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { PackageDetailModal } from '../../components/marketplace/PackageDetailModal';
import { useTripBasket } from '../../context/TripBasketContext';
import {
  staggerContainer,
  staggerItem,
} from '../../utils/animations';

type DurationFilter = 'All' | '3-4' | '5-6' | '7+';

export const PackagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useTripBasket();

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>(searchParams.get('q') || '');
  const [selectedDestination, setSelectedDestination] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<DurationFilter>('All');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc'>('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selected package for full detail modal
  const [activeModalPackage, setActiveModalPackage] = useState<any>(null);

  // Fallback rich packages matching official database seeds
  const fallbackPackages = useMemo(
    () => [
      {
        id: 'cmw0qj40g000eurrnnm82z79l',
        destinationId: 'cmvzd6w2j00049u1424fblwm2',
        title: 'Pure Kerala: Backwaters, Tea Hills & Heritage',
        description: 'A 6-day immersive escape across Cochin, Munnar tea hills, and a private Alleppey luxury houseboat.',
        durationDays: 6,
        totalPrice: 42000,
        pricePerPerson: 21000,
        currency: 'INR',
        inclusions: [
          '4-Star Stays & Private Houseboat',
          'Private Chauffeur Sedan',
          'All Breakfasts & Houseboat Full Board',
          'Spice Garden Tour',
          'Kathakali Performance',
        ],
        exclusions: ['Flights', 'Personal Expenses', 'Tips'],
        highlights: ['Overnight Private Houseboat in Alleppey', 'Tea Tasting in Munnar', 'Kathakali Dance Show'],
        cancellationPolicy: 'Free cancellation up to 7 days before departure.',
        isRecommended: true,
        availableSeats: 12,
        expertName: 'Ananya Sharma',
        organizationName: 'Kerala Bliss Expeditions',
        expertRating: 4.9,
        expertReviews: 42,
        imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
        destination: { id: 'cmvzd6w2j00049u1424fblwm2', name: 'Kerala', state: 'Kerala' },
      },
      {
        id: 'cmw0qj40v0010urrnw2l1mbti',
        destinationId: 'cmvzd6w3c000m9u14qnjeaw1v',
        title: 'Goa Coastal Serenity & Sunset Catamaran Escape',
        description: '5 days of luxury beachfront relaxation in South Goa combined with private yacht charters and gourmet dining.',
        durationDays: 5,
        totalPrice: 36000,
        pricePerPerson: 18000,
        currency: 'INR',
        inclusions: [
          '5-Star Beach Resort',
          'Daily Gourmet Breakfast',
          'Private Catamaran Sunset Cruise',
          'Airport Transfers',
        ],
        exclusions: ['Airfare', 'Alcoholic Beverages'],
        highlights: ['Private Sunset Catamaran Charter', 'Dudhsagar Jeep Safari', 'Exclusive Beach Dining'],
        cancellationPolicy: 'Free cancellation up to 5 days prior to arrival.',
        isRecommended: true,
        availableSeats: 16,
        expertName: 'Carlos Fernandes',
        organizationName: 'Goa Soul Charters',
        expertRating: 4.9,
        expertReviews: 45,
        imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
        destination: { id: 'cmvzd6w3c000m9u14qnjeaw1v', name: 'Goa', state: 'Goa' },
      },
      {
        id: 'cmw0qj40l000lurrneq2k9awc',
        destinationId: 'cmvzd6w34000f9u14i0zreqln',
        title: 'Royal Rajasthan: Jaipur, Jodhpur & Udaipur Circuit',
        description: '7 days of regal splendour visiting Amber Fort, Mehrangarh Citadel, and luxury boat cruises on Lake Pichola.',
        durationDays: 7,
        totalPrice: 52000,
        pricePerPerson: 26000,
        currency: 'INR',
        inclusions: [
          'Heritage Haveli & Palace Hotels',
          'Private Chauffeur Innova',
          'All Breakfasts',
          'Private Boat Ride in Udaipur',
        ],
        exclusions: ['Flights', 'Monument Camera Fees'],
        highlights: ['Lake Pichola Private Boat Ride', 'Amer Fort Sound & Light Show', 'Mehrangarh Palace Access'],
        cancellationPolicy: 'Free cancellation up to 10 days before travel.',
        isRecommended: true,
        availableSeats: 10,
        expertName: 'Rajendra Singh',
        organizationName: 'Mewar Royal Travels',
        expertRating: 4.8,
        expertReviews: 29,
        imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        destination: { id: 'cmvzd6w34000f9u14i0zreqln', name: 'Rajasthan', state: 'Rajasthan' },
      },
      {
        id: 'cmw0qj40z0017urrny822p1nl',
        destinationId: 'cmvzd6w3k000t9u1435hemkbv',
        title: 'Himalayan High Passes & Monasteries of Ladakh',
        description: '7-day acclimatized expedition through Leh, Nubra Valley sand dunes, and turquoise Pangong Tso.',
        durationDays: 7,
        totalPrice: 58000,
        pricePerPerson: 29000,
        currency: 'INR',
        inclusions: [
          'Hotels & Nubra Luxury Camps',
          'Oxygen Cylinder Equipped 4x4 SUV',
          'Inner Line Permits',
          'All Meals',
        ],
        exclusions: ['Flights to Leh', 'Personal Cold Gear'],
        highlights: ['Khardung La Pass Crossing', 'Pangong Tso Sunset Stargazing', 'Diskit Giant Buddha'],
        cancellationPolicy: 'Free cancellation up to 15 days before travel.',
        isRecommended: true,
        availableSeats: 8,
        expertName: 'Tenzin Norbu',
        organizationName: 'Ladakh High Adventure',
        expertRating: 4.9,
        expertReviews: 38,
        imageUrl: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80',
        destination: { id: 'cmvzd6w3k000t9u1435hemkbv', name: 'Ladakh', state: 'Ladakh' },
      },
      {
        id: 'cmw0qj414001eurrnlm3rcwu1',
        destinationId: 'cmvzd6w3q00109u14nbc1bqo9',
        title: 'Himalayan Serenity: Manali, Kasol & Rohtang Pass',
        description: '5 days of pine air, snow peaks, river rafting and scenic hikes across the Parvati Valley.',
        durationDays: 5,
        totalPrice: 28000,
        pricePerPerson: 14000,
        currency: 'INR',
        inclusions: [
          'Orchard Resort Stay',
          'Rohtang Pass Permit & Vehicle',
          'River Rafting Session',
          'Breakfast & Dinner',
        ],
        exclusions: ['Flights to Bhuntar', 'Personal Paragliding'],
        highlights: ['Rohtang Snow View', 'Solang Adventure Valley', 'Old Manali Cafe Crawl'],
        cancellationPolicy: 'Free cancellation up to 7 days before check-in.',
        isRecommended: true,
        availableSeats: 14,
        expertName: 'Vikram Mehta',
        organizationName: 'Himalayan Trails Agency',
        expertRating: 4.8,
        expertReviews: 31,
        imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
        destination: { id: 'cmvzd6w3q00109u14nbc1bqo9', name: 'Manali', state: 'Himachal Pradesh' },
      },
      {
        id: 'cmw0qj419001lurrn1speht60',
        destinationId: 'cmvzd6w3r00119u141i5e45d8',
        title: 'Andaman Tropical Dream: Havelock & Neil Island Escapade',
        description: '6 days of turquoise lagoon swimming, premium catamaran cruises, and undersea adventures.',
        durationDays: 6,
        totalPrice: 54000,
        pricePerPerson: 27000,
        currency: 'INR',
        inclusions: [
          'Luxury Island Resorts',
          'Makruzz Premium Catamaran Transfers',
          'Sea Walk Experience',
          'All Breakfasts & Airport Pickup',
        ],
        exclusions: ['Flights to Port Blair', 'Personal Water Sports'],
        highlights: ['Radhanagar Sunset Session', 'Elephant Beach Snorkel Tour', 'Cellular Jail Evening Show'],
        cancellationPolicy: 'Free cancellation up to 10 days before check-in.',
        isRecommended: true,
        availableSeats: 11,
        expertName: 'Sameer Sen',
        organizationName: 'Andaman Ocean Wonders',
        expertRating: 4.9,
        expertReviews: 36,
        imageUrl: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
        destination: { id: 'cmvzd6w3r00119u141i5e45d8', name: 'Andaman Islands', state: 'Andaman & Nicobar' },
      },
      {
        id: 'cmw0qj41h001zurrnx4ozwdfn',
        destinationId: 'cmvzd6w3v00139u14b7hvh5ve',
        title: 'Meghalaya Cloud Trails: Living Bridges, Waterfalls & Dawki',
        description: '6 days exploring Shillong pine hills, Cherrapunji gorges, Mawlynnong clean village, and Dawki glass waters.',
        durationDays: 6,
        totalPrice: 38000,
        pricePerPerson: 19000,
        currency: 'INR',
        inclusions: [
          'Scenic Resort Accommodations',
          'Private SUV for Mountain Roads',
          'Dawki Boating & Root Bridge Guide',
          'All Breakfasts',
        ],
        exclusions: ['Flights to Guwahati', 'Personal Expenses'],
        highlights: ['Glass-Clear Dawki Boating', 'Double Decker Root Bridge Hike', 'Nohkalikai Falls Sunset'],
        cancellationPolicy: 'Free cancellation up to 7 days before departure.',
        isRecommended: true,
        availableSeats: 10,
        expertName: 'Banteilang Khongwir',
        organizationName: 'Khasi Cloud Treks',
        expertRating: 4.9,
        expertReviews: 27,
        imageUrl: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=800&q=80',
        destination: { id: 'cmvzd6w3v00139u14b7hvh5ve', name: 'Meghalaya', state: 'Meghalaya' },
      },
      {
        id: 'cmw0qj41d001surrn2uni82mw',
        destinationId: 'cmvzd6w3t00129u1421boegow',
        title: 'Sacred Kashi & Sarnath Spiritual Journey',
        description: '4 days of transformative spiritual encounters, classical ragas, temple darshans, and Buddhist teachings in Sarnath.',
        durationDays: 4,
        totalPrice: 24000,
        pricePerPerson: 12000,
        currency: 'INR',
        inclusions: [
          'Heritage Riverfront Palace Hotel',
          'All Boat Transfers',
          'Private Spiritual Scholar Guide',
          'Sarnath Day Excursion',
        ],
        exclusions: ['Flights / Train to Varanasi', 'Temple Special Puja Fees'],
        highlights: ['Dawn Boat Raga Session', 'Special Pass to Kashi Vishwanath Corridor', 'Sarnath Archaeological Museum'],
        cancellationPolicy: 'Free cancellation up to 5 days prior to arrival.',
        isRecommended: true,
        availableSeats: 12,
        expertName: 'Pandit Devrat',
        organizationName: 'Banaras Heritage Guild',
        expertRating: 4.9,
        expertReviews: 48,
        imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
        destination: { id: 'cmvzd6w3t00129u1421boegow', name: 'Varanasi', state: 'Uttar Pradesh' },
      },
    ],
    []
  );

  // Fetch packages from backend API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    packageService
      .getAll({ page: 1, limit: 50 })
      .then((res) => {
        if (!isMounted) return;
        const apiData = res.data?.data;
        if (Array.isArray(apiData) && apiData.length > 0) {
          setPackages(apiData);
        } else {
          setPackages(fallbackPackages);
        }
      })
      .catch(() => {
        if (isMounted) setPackages(fallbackPackages);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackPackages]);

  // Extract distinct destinations for filter
  const availableDestinations = useMemo(() => {
    const destNames = new Set<string>();
    packages.forEach((pkg) => {
      const name = pkg.destination?.name || pkg.destinationName;
      if (name) destNames.add(name);
    });
    return ['All', ...Array.from(destNames).sort()];
  }, [packages]);

  // Filtered and Sorted Packages
  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        // Search filter
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchesTitle = (pkg.title || '').toLowerCase().includes(query);
          const matchesDesc = (pkg.description || '').toLowerCase().includes(query);
          const matchesDest = (pkg.destination?.name || pkg.destinationName || '').toLowerCase().includes(query);
          const matchesExpert = (pkg.expertName || pkg.organizationName || '').toLowerCase().includes(query);
          const matchesInclusions = (pkg.inclusions || []).some((inc: string) =>
            inc.toLowerCase().includes(query)
          );
          if (!matchesTitle && !matchesDesc && !matchesDest && !matchesExpert && !matchesInclusions) {
            return false;
          }
        }

        // Destination filter
        if (selectedDestination !== 'All') {
          const destName = pkg.destination?.name || pkg.destinationName;
          if (destName !== selectedDestination) return false;
        }

        // Duration filter
        if (selectedDuration !== 'All') {
          const days = Number(pkg.durationDays || 0);
          if (selectedDuration === '3-4' && (days < 3 || days > 4)) return false;
          if (selectedDuration === '5-6' && (days < 5 || days > 6)) return false;
          if (selectedDuration === '7+' && days < 7) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          return Number(a.totalPrice || 0) - Number(b.totalPrice || 0);
        }
        if (sortBy === 'price_desc') {
          return Number(b.totalPrice || 0) - Number(a.totalPrice || 0);
        }
        if (sortBy === 'duration_asc') {
          return Number(a.durationDays || 0) - Number(b.durationDays || 0);
        }
        if (sortBy === 'duration_desc') {
          return Number(b.durationDays || 0) - Number(a.durationDays || 0);
        }
        // Recommended first
        return (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0);
      });
  }, [packages, search, selectedDestination, selectedDuration, sortBy]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedDestination('All');
    setSelectedDuration('All');
    setSortBy('recommended');
    setSearchParams({});
  };

  const handleAddToBasket = (pkg: any) => {
    addItem({
      id: pkg.id,
      type: 'PACKAGE',
      title: pkg.title,
      destinationName: pkg.destination?.name || pkg.destinationName,
      price: Number(pkg.totalPrice),
      currency: pkg.currency || 'INR',
      imageUrl: pkg.imageUrl,
      details: {
        packageId: pkg.id,
        durationDays: pkg.durationDays,
        expertName: pkg.expertName,
      },
    });
  };

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-24">
      {/* 1. HERO HEADER */}
      <section className="relative bg-gradient-to-b from-navy-950 via-navy-900 to-navy-dark pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-border/80 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge
              variant="gold"
              size="md"
              icon={<Sparkles className="w-4 h-4 text-amber-300" />}
              className="mb-4 inline-flex shadow-[0_0_15px_rgba(212,175,55,0.2)]"
            >
              Curated Travel Portfolio
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              All Curated <span className="gradient-text">Travel Packages</span>
            </h1>

            <p className="text-slate-300 max-w-3xl mx-auto text-base sm:text-lg mt-4 leading-relaxed font-normal">
              Handcrafted, all-inclusive journeys designed and fulfilled by licensed regional agencies. Complete with private transfers, luxury stays, daily excursions, and PayPal Escrow buyer protection.
            </p>

            {/* Value Guarantees Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-8 pt-6 border-t border-white/5 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span><strong className="text-white font-bold">{packages.length}</strong> Curated Expeditions</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>100% PayPal Escrow Protected</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Local Specialist Agencies</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <section className="sticky top-16 z-30 bg-navy-dark/95 backdrop-blur-xl border-b border-border/80 py-4 px-4 sm:px-6 lg:px-8 shadow-xl shadow-black/20">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search packages by destination, title, agency, or inclusion..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface/90 border border-border-light text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Dropdowns & View Mode */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Destination Filter */}
              <div className="flex items-center gap-1.5 bg-surface rounded-xl px-3 py-1.5 border border-border-light text-xs">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 hidden sm:inline">Destination:</span>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  {availableDestinations.map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white">
                      {d === 'All' ? 'All Destinations' : d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration Filter */}
              <div className="flex items-center gap-1.5 bg-surface rounded-xl px-3 py-1.5 border border-border-light text-xs">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 hidden sm:inline">Duration:</span>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value as any)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="All" className="bg-slate-900 text-white">All Durations</option>
                  <option value="3-4" className="bg-slate-900 text-white">3–4 Days (Short Breaks)</option>
                  <option value="5-6" className="bg-slate-900 text-white">5–6 Days (Classic)</option>
                  <option value="7+" className="bg-slate-900 text-white">7+ Days (Expeditions)</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-surface rounded-xl px-3 py-1.5 border border-border-light text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="recommended" className="bg-slate-900 text-white">Top Specialist Pick</option>
                  <option value="price_asc" className="bg-slate-900 text-white">Price: Low to High</option>
                  <option value="price_desc" className="bg-slate-900 text-white">Price: High to Low</option>
                  <option value="duration_asc" className="bg-slate-900 text-white">Duration: Shortest</option>
                  <option value="duration_desc" className="bg-slate-900 text-white">Duration: Longest</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center bg-surface rounded-xl p-1 border border-border-light">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Destination Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {['All', 'Kerala', 'Goa', 'Rajasthan', 'Ladakh', 'Manali', 'Andaman Islands', 'Meghalaya', 'Varanasi'].map((dest) => (
              <button
                key={dest}
                type="button"
                onClick={() => setSelectedDestination(dest)}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedDestination === dest
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-surface border border-border-light text-slate-300 hover:text-white hover:border-amber-400/40'
                }`}
              >
                {dest === 'All' ? '🌟 All Packages' : dest}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT: CURATED PACKAGES */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>All Curated Packages</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {filteredPackages.length} {filteredPackages.length === 1 ? 'Package' : 'Packages'}
              </span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Select any package to view day-by-day itineraries, exact inclusions, and verified agency reviews.
            </p>
          </div>

          {(search || selectedDestination !== 'All' || selectedDuration !== 'All') && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          /* Empty State */
          <EmptyState
            title="No packages match your filters"
            description="We could not find any curated travel packages matching your search or duration filter. Try resetting your search keywords."
            actionLabel="View All Curated Packages"
            onAction={handleClearFilters}
          />
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                variants={staggerItem}
                className="group relative rounded-3xl bg-surface/90 border border-border/80 hover:border-cyan-500/40 transition-all duration-300 p-6 flex flex-col justify-between gap-5 shadow-xl shadow-black/20 hover:shadow-cyan-500/10"
              >
                {/* Specialist Recommended Pill */}
                {pkg.isRecommended && (
                  <div className="absolute -top-3 left-6">
                    <Badge variant="cyan" glow dot size="sm">
                      Top Specialist Proposal
                    </Badge>
                  </div>
                )}

                <div>
                  {/* Agency Header & Duration */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-xs font-bold">
                        <UserCheck className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">
                          {pkg.organizationName || pkg.expertName}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-amber-300">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{Number(pkg.expertRating || 4.9).toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">({pkg.expertReviews || 35} reviews)</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-cyan-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      {pkg.durationDays} Days / {Math.max(1, (pkg.durationDays || 5) - 1)} Nights
                    </span>
                  </div>

                  {/* Thumbnail Banner */}
                  {pkg.imageUrl && (
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-4 bg-slate-900">
                      <img
                        src={pkg.imageUrl}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-xs font-semibold text-cyan-300 bg-navy-dark/80 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>{pkg.destination?.name || pkg.destinationName}</span>
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {pkg.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Inclusions Checklist */}
                  <div className="mt-4 space-y-2">
                    {(pkg.inclusions || []).slice(0, 4).map((inc: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{inc}</span>
                      </div>
                    ))}
                  </div>

                  {pkg.cancellationPolicy && (
                    <p className="text-[11px] text-slate-400 mt-3 italic">
                      &bull; {pkg.cancellationPolicy}
                    </p>
                  )}
                </div>

                {/* Pricing & Actions */}
                <div className="pt-4 border-t border-border/80 space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <PriceDisplay
                        amount={Number(pkg.totalPrice)}
                        currency={pkg.currency || 'INR'}
                        period="Total package amount"
                        size="md"
                        variant="cyan"
                      />
                      {pkg.pricePerPerson && (
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                          (≈ ₹{Number(pkg.pricePerPerson).toLocaleString('en-IN')} per person)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20 font-semibold">
                      <Lock className="w-3 h-3 text-teal-400" />
                      <span>Escrow Secured</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveModalPackage(pkg)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                      onClick={() => handleAddToBasket(pkg)}
                    >
                      Add to Basket
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* List View */
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                variants={staggerItem}
                className="group p-5 rounded-2xl bg-surface/90 border border-border/80 hover:border-cyan-500/40 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="flex items-start sm:items-center gap-4 w-full lg:w-auto">
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900">
                    <img
                      src={pkg.imageUrl || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800'}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {pkg.isRecommended && (
                      <span className="absolute top-1 left-1 bg-cyan-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                        TOP PICK
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {pkg.destination?.name || pkg.destinationName}
                      </span>
                      <span>&bull;</span>
                      <span className="text-slate-300">
                        {pkg.organizationName || pkg.expertName}
                      </span>
                      <span>&bull;</span>
                      <span className="text-amber-300 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {Number(pkg.expertRating || 4.9).toFixed(1)}
                      </span>
                      <span>&bull;</span>
                      <span className="text-slate-400">
                        {pkg.durationDays} Days / {Math.max(1, (pkg.durationDays || 5) - 1)} Nights
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {pkg.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mt-1 max-w-2xl">
                      {pkg.description}
                    </p>

                    {pkg.inclusions && pkg.inclusions.length > 0 && (
                      <div className="hidden sm:flex items-center gap-2 mt-2 flex-wrap">
                        {pkg.inclusions.slice(0, 3).map((inc: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-surface-dark border border-white/5 text-slate-300 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 text-teal-400" /> {inc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between lg:flex-col lg:items-end w-full lg:w-auto gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/80">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Price</span>
                    <span className="text-lg sm:text-xl font-black text-cyan-300">
                      ₹{Number(pkg.totalPrice).toLocaleString('en-IN')}
                    </span>
                    {pkg.pricePerPerson && (
                      <span className="text-[11px] text-slate-400 block">
                        ₹{Number(pkg.pricePerPerson).toLocaleString('en-IN')} / person
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveModalPackage(pkg)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                      onClick={() => handleAddToBasket(pkg)}
                    >
                      Add to Basket
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 4. AI TRAVEL AGENT CUSTOM REQUEST CTA */}
        <section className="mt-20 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-surface via-surface-elevated to-surface border border-amber-500/20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center lg:text-left">
              <Badge variant="gold" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}>
                Custom Specialist Quotes
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
                Want a 100% Bespoke Custom Itinerary?
              </h3>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Submit a travel request with your specific preferences. Verified agencies compete to offer customized all-inclusive packages tailored directly to your family or group requirements.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/traveler/create-trip')}
                className="shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 font-bold border-none"
              >
                Create Trip Request
              </Button>
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Bot className="w-4 h-4 text-cyan-400" />}
                onClick={() => navigate('/agent')}
              >
                Ask WayRivo AI
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Package Detail Modal */}
      {activeModalPackage && (
        <PackageDetailModal
          isOpen={!!activeModalPackage}
          onClose={() => setActiveModalPackage(null)}
          pkg={activeModalPackage}
        />
      )}
    </div>
  );
};

export default PackagesPage;

