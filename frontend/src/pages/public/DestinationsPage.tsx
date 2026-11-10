import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { destinationService } from '../../services';
import {
  Search,
  Compass,
  MapPin,
  Sparkles,
  Calendar,
  ArrowRight,
  Bot,
  SlidersHorizontal,
  LayoutGrid,
  List,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { DestinationCard } from '../../components/ui/DestinationCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import {
  staggerContainer,
  staggerItem,
} from '../../utils/animations';

type CategoryFilter = 'All' | 'Trending' | 'Coastal' | 'Himalayan' | 'Heritage' | 'Nature';

export const DestinationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>(searchParams.get('q') || '');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'budget_asc' | 'budget_desc' | 'name'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Hardcoded rich fallback destinations matching official Supabase schema
  const fallbackDestinations = useMemo(
    () => [
      {
        id: 'cmvzd6w2j00049u1424fblwm2',
        name: 'Kerala',
        slug: 'kerala',
        state: 'Kerala',
        country: 'India',
        description:
          "God's Own Country — emerald backwaters, tranquil houseboats, mist-covered tea plantations in Munnar, and authentic Ayurvedic wellness retreats along the Arabian Sea.",
        imageUrl:
          'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
        bestTimeToVisit: 'September to March',
        averageBudget: 25000,
        currency: 'INR',
        isPopular: true,
        category: 'Nature',
        popularAttractions: [
          'Alleppey Backwaters & Canal Cruise',
          'Munnar Tea Hills & Mattupetty Dam',
          'Periyar Wildlife Sanctuary',
        ],
      },
      {
        id: 'cmvzd6w3c000m9u14qnjeaw1v',
        name: 'Goa',
        slug: 'goa',
        state: 'Goa',
        country: 'India',
        description:
          'Sun-drenched golden coastlines, historic Portuguese churches, vibrant beach clubs, fresh seafood shacks, and exhilarating water sports along the Arabian Sea.',
        imageUrl:
          'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
        bestTimeToVisit: 'November to February',
        averageBudget: 24000,
        currency: 'INR',
        isPopular: true,
        category: 'Coastal',
        popularAttractions: [
          'Palolem & Agonda Beach',
          'Dudhsagar Waterfalls Trek',
          'Basilica of Bom Jesus',
        ],
      },
      {
        id: 'cmvzd6w34000f9u14i0zreqln',
        name: 'Rajasthan',
        slug: 'rajasthan',
        state: 'Rajasthan',
        country: 'India',
        description:
          'The Land of Kings — grand sandstone forts, fairytale lake palaces in Udaipur, vibrant bazaars of Jaipur, and starlit desert camps in Jaisalmer.',
        imageUrl:
          'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
        bestTimeToVisit: 'October to March',
        averageBudget: 32000,
        currency: 'INR',
        isPopular: true,
        category: 'Heritage',
        popularAttractions: [
          'Amer Fort & Sheesh Mahal',
          'Lake Pichola & City Palace',
          'Sam Sand Dunes Desert Camp',
        ],
      },
      {
        id: 'cmvzd6w3k000t9u1435hemkbv',
        name: 'Ladakh',
        slug: 'ladakh',
        state: 'Ladakh',
        country: 'India',
        description:
          'The Moonland of Himalayas — high-altitude mountain passes, electric blue Pangong Tso, sand dunes of Nubra Valley, and 1,000-year-old Buddhist monasteries.',
        imageUrl:
          'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
        bestTimeToVisit: 'May to September',
        averageBudget: 38000,
        currency: 'INR',
        isPopular: true,
        category: 'Himalayan',
        popularAttractions: [
          'Pangong Tso Lake (14,270 ft)',
          'Khardung La Pass (17,982 ft)',
          'Nubra Valley & Diskit Monastery',
        ],
      },
      {
        id: 'cmvzd6w3q00109u14nbc1bqo9',
        name: 'Manali',
        slug: 'manali',
        state: 'Himachal Pradesh',
        country: 'India',
        description:
          'The Himalayan jewel — alpine pine forests, roaring Beas river rapids, Solang Valley adventure sports, and snowcapped Pir Panjal peaks.',
        imageUrl:
          'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
        bestTimeToVisit: 'March to June & Oct to Dec',
        averageBudget: 22000,
        currency: 'INR',
        isPopular: true,
        category: 'Himalayan',
        popularAttractions: [
          'Solang Valley & Rohtang Pass',
          'Hadimba Devi Temple',
          'Jogini Waterfall Trek',
        ],
      },
      {
        id: 'cmvzd6w3r00119u141i5e45d8',
        name: 'Andaman Islands',
        slug: 'andaman-islands',
        state: 'Andaman & Nicobar',
        country: 'India',
        description:
          'Tropical archipelago wonderland — powdery white beaches, coral gardens, scuba diving with sea turtles, and bioluminescent night kayaking.',
        imageUrl:
          'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=80',
        bestTimeToVisit: 'October to May',
        averageBudget: 34000,
        currency: 'INR',
        isPopular: true,
        category: 'Coastal',
        popularAttractions: [
          'Radhanagar Beach No. 7',
          'Elephant Beach Coral Reef',
          'Cellular Jail Sound & Light',
        ],
      },
      {
        id: 'cmvzd6w3v00139u14b7hvh5ve',
        name: 'Meghalaya',
        slug: 'meghalaya',
        state: 'Meghalaya',
        country: 'India',
        description:
          'The Abode of Clouds — mystical living root bridges, roaring canyon waterfalls of Cherrapunji, crystal-clear Dawki river, and sacred tribal forests.',
        imageUrl:
          'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=80',
        bestTimeToVisit: 'October to April',
        averageBudget: 22000,
        currency: 'INR',
        isPopular: true,
        category: 'Nature',
        popularAttractions: [
          'Double Decker Living Root Bridge',
          'Umngot River Glass-Water Boating',
          'Nohkalikai Falls',
        ],
      },
      {
        id: 'cmvzd6w3t00129u1421boegow',
        name: 'Varanasi',
        slug: 'varanasi',
        state: 'Uttar Pradesh',
        country: 'India',
        description:
          'The ancient spiritual heart of India — eternal Ganga ghats, hypnotic evening Maha Aarti, labyrinthine heritage alleys, and 5,000 years of living philosophy.',
        imageUrl:
          'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
        bestTimeToVisit: 'October to March',
        averageBudget: 16000,
        currency: 'INR',
        isPopular: false,
        category: 'Heritage',
        popularAttractions: [
          'Dashashwamedh Ghat Evening Aarti',
          'Subah-e-Banaras Morning Boat Tour',
          'Kashi Vishwanath Temple Corridor',
        ],
      },
    ],
    []
  );

  // Load destinations from database API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    destinationService
      .getAll(1, 50)
      .then((res) => {
        if (!isMounted) return;
        const apiData = res.data?.data;
        if (Array.isArray(apiData) && apiData.length > 0) {
          setDestinations(apiData);
        } else {
          setDestinations(fallbackDestinations);
        }
      })
      .catch(() => {
        if (isMounted) setDestinations(fallbackDestinations);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackDestinations]);

  // Extract distinct states
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    destinations.forEach((d) => {
      if (d.state) states.add(d.state);
    });
    return ['All', ...Array.from(states).sort()];
  }, [destinations]);

  // Category matching helper
  const getDestinationCategory = (dest: any): CategoryFilter => {
    if (dest.category) return dest.category;
    const name = (dest.name || '').toLowerCase();
    const state = (dest.state || '').toLowerCase();
    if (name.includes('goa') || name.includes('andaman') || state.includes('goa')) return 'Coastal';
    if (name.includes('ladakh') || name.includes('manali') || state.includes('himachal')) return 'Himalayan';
    if (name.includes('rajasthan') || name.includes('varanasi') || state.includes('rajasthan') || state.includes('uttar')) return 'Heritage';
    if (name.includes('kerala') || name.includes('meghalaya') || state.includes('kerala')) return 'Nature';
    return 'All';
  };

  // Filtered & Sorted Destinations
  const filteredDestinations = useMemo(() => {
    return destinations
      .filter((dest) => {
        // Search filter
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchesName = (dest.name || '').toLowerCase().includes(query);
          const matchesState = (dest.state || '').toLowerCase().includes(query);
          const matchesDesc = (dest.description || '').toLowerCase().includes(query);
          const matchesAttractions = (dest.popularAttractions || []).some((a: string) =>
            a.toLowerCase().includes(query)
          );
          if (!matchesName && !matchesState && !matchesDesc && !matchesAttractions) {
            return false;
          }
        }

        // State filter
        if (selectedState !== 'All' && dest.state !== selectedState) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'All') {
          if (selectedCategory === 'Trending') {
            if (!dest.isPopular && !['kerala', 'goa', 'rajasthan', 'ladakh'].includes(dest.slug)) {
              return false;
            }
          } else {
            const cat = getDestinationCategory(dest);
            if (cat !== selectedCategory) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'budget_asc') {
          return Number(a.averageBudget || 0) - Number(b.averageBudget || 0);
        }
        if (sortBy === 'budget_desc') {
          return Number(b.averageBudget || 0) - Number(a.averageBudget || 0);
        }
        if (sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '');
        }
        // Default: featured / popular first
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      });
  }, [destinations, search, selectedState, selectedCategory, sortBy]);

  const handleDestinationExplore = (id: number | string) => {
    navigate(`/destinations/${id}`);
  };

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
    setSelectedState('All');
    setSelectedCategory('All');
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-24">
      {/* 1. HERO HEADER */}
      <section className="relative bg-gradient-to-b from-navy-950 via-navy-900 to-navy-dark pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-border/80 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge
              variant="cyan"
              size="md"
              icon={<Compass className="w-4 h-4 text-cyan-400" />}
              className="mb-4 inline-flex shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              Curated Regional Portfolios
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Featured <span className="gradient-text">Destinations</span>
            </h1>

            <p className="text-slate-300 max-w-3xl mx-auto text-base sm:text-lg mt-4 leading-relaxed font-normal">
              Explore hand-crafted itineraries, authentic cultural highlights, and verified local inventory across India's most celebrated regions.
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-8 pt-6 border-t border-white/5 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span><strong className="text-white font-bold">{destinations.length}</strong> Curated Regions</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Real-Time Pricing & Rates</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Local Specialist Partners</span>
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
                placeholder="Search destinations, states, or attractions (e.g. Kerala, Houseboat, Pangong)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface/90 border border-border-light text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Dropdowns & View Mode */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* State Filter */}
              <div className="flex items-center gap-1.5 bg-surface rounded-xl px-3 py-1.5 border border-border-light text-xs">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 hidden sm:inline">State:</span>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  {availableStates.map((st) => (
                    <option key={st} value={st} className="bg-slate-900 text-white">
                      {st === 'All' ? 'All States' : st}
                    </option>
                  ))}
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
                  <option value="featured" className="bg-slate-900 text-white">Featured First</option>
                  <option value="budget_asc" className="bg-slate-900 text-white">Budget: Low to High</option>
                  <option value="budget_desc" className="bg-slate-900 text-white">Budget: High to Low</option>
                  <option value="name" className="bg-slate-900 text-white">Name: A to Z</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center bg-surface rounded-xl p-1 border border-border-light">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
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
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
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

          {/* Category Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {(
              [
                { id: 'All', label: 'All Featured' },
                { id: 'Trending', label: '🔥 Trending Now' },
                { id: 'Coastal', label: '🏖️ Coastal & Beaches' },
                { id: 'Himalayan', label: '🏔️ Himalayan & Hill Stations' },
                { id: 'Heritage', label: '🏰 Royal Heritage & Forts' },
                { id: 'Nature', label: '🌿 Tropical & Backwaters' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-surface border border-border-light text-slate-300 hover:text-white hover:border-cyan-400/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT: FEATURED DESTINATIONS LIST / GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>All Featured Destinations</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {filteredDestinations.length} {filteredDestinations.length === 1 ? 'Destination' : 'Destinations'}
              </span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Select any destination to view verified resorts, daily excursions, and custom package quotes.
            </p>
          </div>

          {(search || selectedState !== 'All' || selectedCategory !== 'All') && (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredDestinations.length === 0 ? (
          /* Empty State */
          <EmptyState
            title="No destinations match your filters"
            description="We could not find any featured destinations matching your search or category criteria. Try resetting filters or search keywords."
            actionLabel="View All Featured Destinations"
            onAction={handleClearFilters}
          />
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredDestinations.map((d) => (
              <motion.div key={d.id || d.slug} variants={staggerItem}>
                <DestinationCard
                  id={d.id || d.slug}
                  name={d.name}
                  state={d.state}
                  country={d.country || 'India'}
                  description={d.description}
                  imageUrl={d.imageUrl}
                  averageBudget={Number(d.averageBudget)}
                  bestTimeToVisit={d.bestTimeToVisit}
                  isPopular={d.isPopular}
                  onExplore={handleDestinationExplore}
                />
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
            {filteredDestinations.map((d) => (
              <motion.div
                key={d.id || d.slug}
                variants={staggerItem}
                className="group p-5 rounded-2xl bg-surface/90 border border-border/80 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900">
                    <img
                      src={d.imageUrl}
                      alt={d.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {d.isPopular && (
                      <span className="absolute top-1 left-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                        HOT
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{d.state ? `${d.state}, ${d.country || 'India'}` : d.country || 'India'}</span>
                      {d.bestTimeToVisit && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 ml-2">
                          <Calendar className="w-3 h-3 text-cyan-400" /> {d.bestTimeToVisit}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {d.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mt-1 max-w-2xl">
                      {d.description}
                    </p>

                    {d.popularAttractions && d.popularAttractions.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1.5 mt-2 flex-wrap">
                        {d.popularAttractions.slice(0, 3).map((attr: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-surface-dark border border-white/5 text-slate-300"
                          >
                            {attr}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-border/80">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Avg. Budget</span>
                    <span className="text-base sm:text-lg font-black text-cyan-300">
                      ₹{Number(d.averageBudget || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => handleDestinationExplore(d.id || d.slug)}
                    >
                      Explore Inventory
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 4. AI TRAVEL ASSISTANT BOTTOM PROMO */}
        <section className="mt-20 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-surface via-surface-elevated to-surface border border-cyan-500/20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center lg:text-left">
              <Badge variant="cyan" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}>
                WayRivo AI 2.0 Gemini Engine
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
                Can't decide on a destination?
              </h3>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Prompt our Autonomous Travel Agent with your group dynamics, travel dates, and budget. WayRivo AI crafts an end-to-end itinerary with verified hotels and specialist recommendations.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Bot className="w-4 h-4" />}
                onClick={() => navigate('/agent')}
                className="shadow-[0_0_20px_rgba(0,240,255,0.3)]"
              >
                Plan with AI Agent
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/itinerary-planner')}
              >
                Custom Budget Planner
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DestinationsPage;
