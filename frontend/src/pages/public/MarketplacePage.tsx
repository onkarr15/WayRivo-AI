import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  destinationService,
  hotelService,
  activityService,
  packageService,
} from '../../services';
import {
  Search,
  Sparkles,
  MapPin,
  Hotel as HotelIcon,
  Activity as ActivityIcon,
  Compass,
  ArrowUpDown,
} from 'lucide-react';
import { DestinationCard } from '../../components/ui/DestinationCard';
import { HotelCard } from '../../components/ui/HotelCard';
import { ActivityCard } from '../../components/ui/ActivityCard';
import { PackageCard } from '../../components/ui/PackageCard';
import { HotelDetailModal } from '../../components/marketplace/HotelDetailModal';
import { ActivityDetailModal } from '../../components/marketplace/ActivityDetailModal';
import { PackageDetailModal } from '../../components/marketplace/PackageDetailModal';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { useTripBasket } from '../../context/TripBasketContext';

type MarketplaceTab = 'destinations' | 'hotels' | 'activities' | 'packages';

export const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useTripBasket();

  // Tab state
  const initialTab = (searchParams.get('tab') as MarketplaceTab) || 'destinations';
  const [activeTab, setActiveTab] = useState<MarketplaceTab>(initialTab);

  // Search & Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedDestination, setSelectedDestination] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStars, setSelectedStars] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [page, setPage] = useState(1);

  // Data states
  const [destinations, setDestinations] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // Load all destinations for dropdown filter
  useEffect(() => {
    destinationService.getAll(1, 100).then((res) => {
      const items = res.data?.data || [];
      if (Array.isArray(items)) setDestinations(items);
    }).catch(() => {});
  }, []);

  // Fetch data based on active tab & filters
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'destinations') {
        const res = await destinationService.getAll(1, 50, search, selectedState !== 'All' ? selectedState : '');
        const items = res.data?.data || [];
        setDestinations(Array.isArray(items) ? items : []);
      } else if (activeTab === 'hotels') {
        const res = await hotelService.getAll({
          destinationId: selectedDestination !== 'All' ? selectedDestination : undefined,
          stars: selectedStars,
          search: search || undefined,
          sortBy: sortBy !== 'popular' ? sortBy : undefined,
          page,
          limit: 30,
        });
        const items = res.data?.data || [];
        setHotels(Array.isArray(items) ? items : []);
      } else if (activeTab === 'activities') {
        const res = await activityService.getAll({
          destinationId: selectedDestination !== 'All' ? selectedDestination : undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: search || undefined,
          sortBy: sortBy !== 'popular' ? sortBy : undefined,
          page,
          limit: 30,
        });
        const items = res.data?.data || [];
        setActivities(Array.isArray(items) ? items : []);
      } else if (activeTab === 'packages') {
        const res = await packageService.getAll({
          destinationId: selectedDestination !== 'All' ? selectedDestination : undefined,
          search: search || undefined,
          sortBy: sortBy !== 'popular' ? sortBy : undefined,
          page,
          limit: 30,
        });
        const items = res.data?.data || [];
        setPackages(Array.isArray(items) ? items : []);
      }
    } catch (e) {
      console.error('Failed to load marketplace items', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, selectedDestination, selectedState, selectedCategory, selectedStars, sortBy, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (tab: MarketplaceTab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchParams({ tab });
  };

  const activityCategories = [
    'All',
    'Adventure activities',
    'Sightseeing',
    'Water sports',
    'Cultural experiences',
  ];

  const destinationStates = [
    'All',
    ...Array.from(new Set(destinations.map((d) => d.state).filter(Boolean))),
  ];

  return (
    <div className="bg-navy-dark min-h-screen text-slate-100 pb-24">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-b from-navy via-navy-light to-navy-dark py-16 px-4 border-b border-border/80 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge variant="cyan" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}>
            Autonomous Travel Marketplace
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-white mt-3 tracking-tight">
            Discover & Book Tailored Travel
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base mt-3 leading-relaxed">
            Browse verified destinations, luxury heritage resorts, adventure excursions, and specialist packages with PayPal Developer Sandbox escrow protection.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-surface/90 border border-white/10 text-white placeholder:text-slate-500 shadow-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 text-sm"
              placeholder={`Search across ${activeTab} (e.g. Kerala, Houseboat, Taj, Rafting)...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Marketplace Navigation Tabs */}
          <div className="flex items-center justify-center gap-2 mt-8 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => handleTabChange('destinations')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'destinations'
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-surface border border-border-light text-slate-300 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              <MapPin className="w-4 h-4" /> Destinations
            </button>

            <button
              onClick={() => handleTabChange('hotels')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'hotels'
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-surface border border-border-light text-slate-300 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              <HotelIcon className="w-4 h-4" /> Hotels & Stays
            </button>

            <button
              onClick={() => handleTabChange('activities')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'activities'
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-surface border border-border-light text-slate-300 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              <ActivityIcon className="w-4 h-4" /> Activities
            </button>

            <button
              onClick={() => handleTabChange('packages')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'packages'
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-surface border border-border-light text-slate-300 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              <Compass className="w-4 h-4" /> Travel Packages
            </button>
          </div>
        </div>
      </section>

      {/* Main Catalog Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Dynamic Filters Bar */}
        <div className="card p-4 mb-8 border border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Destination filter for Hotels, Activities, Packages */}
            {activeTab !== 'destinations' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Destination:</span>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="bg-surface-dark border border-border text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-400"
                >
                  <option value="All">All Destinations</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.state})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* State filter for Destinations */}
            {activeTab === 'destinations' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Region:</span>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="bg-surface-dark border border-border text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-400"
                >
                  {destinationStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Star rating filter for Hotels */}
            {activeTab === 'hotels' && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-semibold">Stars:</span>
                {[undefined, 5, 4, 3].map((star) => (
                  <button
                    key={star || 'all'}
                    onClick={() => setSelectedStars(star)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      selectedStars === star
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-surface-dark text-slate-300 hover:text-white'
                    }`}
                  >
                    {star ? `${star}★` : 'All'}
                  </button>
                ))}
              </div>
            )}

            {/* Category filter for Activities */}
            {activeTab === 'activities' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-surface-dark border border-border text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-400"
                >
                  {activityCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-400 font-semibold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-dark border border-border text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-400"
            >
              <option value="popular">Recommended / Rating</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Content Cards Grid */}
        {loading ? (
          <CardSkeleton count={6} />
        ) : (
          <>
            {/* 1. DESTINATIONS */}
            {activeTab === 'destinations' && (
              destinations.length === 0 ? (
                <EmptyState
                  title="No destinations found"
                  description="Try adjusting your search keywords or state filters."
                  actionLabel="Clear Filters"
                  onAction={() => { setSearch(''); setSelectedState('All'); }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {destinations.map((d) => (
                    <DestinationCard
                      key={d.id}
                      id={d.id}
                      name={d.name}
                      state={d.state}
                      country={d.country}
                      description={d.description}
                      imageUrl={d.imageUrl}
                      averageBudget={Number(d.averageBudget)}
                      bestTimeToVisit={d.bestTimeToVisit}
                      isPopular={d.slug === 'kerala' || d.slug === 'ladakh'}
                      onExplore={(destId) => navigate(`/destinations/${destId}`)}
                    />
                  ))}
                </div>
              )
            )}

            {/* 2. HOTELS */}
            {activeTab === 'hotels' && (
              hotels.length === 0 ? (
                <EmptyState
                  title="No hotels match your criteria"
                  description="Try selecting a different destination or clearing your star filters."
                  actionLabel="Reset Search"
                  onAction={() => { setSearch(''); setSelectedDestination('All'); setSelectedStars(undefined); }}
                />
              ) : (
                <div className="space-y-4">
                  {hotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      id={hotel.id}
                      name={hotel.name}
                      city={hotel.city}
                      state={hotel.destination?.state}
                      rating={4.8}
                      reviewsCount={hotel.stars * 12}
                      imageUrl={Array.isArray(hotel.imageUrls) ? hotel.imageUrls[0] : hotel.imageUrl}
                      roomType={Array.isArray(hotel.roomTypes) && hotel.roomTypes[0]?.category}
                      pricePerNight={Number(hotel.pricePerNight)}
                      currency={hotel.currency}
                      amenities={hotel.amenities}
                      onSelect={() => setSelectedHotel(hotel)}
                    />
                  ))}
                </div>
              )
            )}

            {/* 3. ACTIVITIES */}
            {activeTab === 'activities' && (
              activities.length === 0 ? (
                <EmptyState
                  title="No activities found"
                  description="Try switching activity categories or choosing a different destination."
                  actionLabel="Reset Filters"
                  onAction={() => { setSearch(''); setSelectedDestination('All'); setSelectedCategory('All'); }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activities.map((act) => (
                    <ActivityCard
                      key={act.id}
                      id={act.id}
                      title={act.title}
                      description={act.description}
                      category={act.category}
                      durationHours={Number(act.durationHours)}
                      pricePerPerson={Number(act.pricePerPerson)}
                      currency={act.currency}
                      location={act.location}
                      difficultyLevel={act.difficultyLevel}
                      availableSlots={act.availableSlots}
                      maxSlots={act.maxSlots}
                      imageUrl={Array.isArray(act.imageUrls) ? act.imageUrls[0] : act.imageUrl}
                      includedItems={act.includedItems}
                      onSelect={() => {
                        addItem({
                          id: act.id,
                          type: 'ACTIVITY',
                          title: act.title,
                          destinationName: act.location || act.destination?.name,
                          price: Number(act.pricePerPerson),
                          currency: act.currency || 'INR',
                          imageUrl: Array.isArray(act.imageUrls) ? act.imageUrls[0] : act.imageUrl,
                        });
                      }}
                      onViewDetails={() => setSelectedActivity(act)}
                    />
                  ))}
                </div>
              )
            )}

            {/* 4. PACKAGES */}
            {activeTab === 'packages' && (
              packages.length === 0 ? (
                <EmptyState
                  title="No travel packages match your query"
                  description="Try resetting search keywords or choosing 'All Destinations'."
                  actionLabel="Clear Filters"
                  onAction={() => { setSearch(''); setSelectedDestination('All'); }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {packages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      id={pkg.id}
                      title={pkg.title}
                      expertName={pkg.expertName}
                      organizationName={pkg.organizationName}
                      expertRating={Number(pkg.expertRating || 4.8)}
                      expertReviews={pkg.expertReviews || 18}
                      durationDays={pkg.durationDays}
                      totalPrice={Number(pkg.totalPrice)}
                      pricePerPerson={Number(pkg.pricePerPerson)}
                      currency={pkg.currency}
                      inclusions={pkg.inclusions}
                      cancellationPolicy={pkg.cancellationPolicy}
                      isRecommended={pkg.isRecommended}
                      onSelect={() => {
                        addItem({
                          id: pkg.id,
                          type: 'PACKAGE',
                          title: pkg.title,
                          destinationName: pkg.destination?.name,
                          price: Number(pkg.totalPrice),
                          currency: pkg.currency || 'INR',
                          imageUrl: pkg.imageUrl,
                        });
                      }}
                      onViewDetails={() => setSelectedPackage(pkg)}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <HotelDetailModal
        isOpen={!!selectedHotel}
        onClose={() => setSelectedHotel(null)}
        hotel={selectedHotel}
      />

      <ActivityDetailModal
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        activity={selectedActivity}
      />

      <PackageDetailModal
        isOpen={!!selectedPackage}
        onClose={() => setSelectedPackage(null)}
        pkg={selectedPackage}
      />
    </div>
  );
};

export default MarketplacePage;
