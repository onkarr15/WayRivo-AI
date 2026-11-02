import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { destinationService } from '../../services';
import { Search, Sparkles } from 'lucide-react';
import { DestinationCard } from '../../components/ui/DestinationCard';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [loading, setLoading] = useState(true);

  const fallbackDestinations = React.useMemo(
    () => [
      {
        id: 1,
        name: 'Manali & Kasol',
        state: 'Himachal Pradesh',
        country: 'India',
        description: 'Snow-capped mountains, scenic pine valleys, and riverside cafes.',
        averageBudget: 25000,
        bestTimeToVisit: 'Oct - May',
        imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
        isPopular: true,
      },
      {
        id: 2,
        name: 'Goa Beaches',
        state: 'Goa',
        country: 'India',
        description: 'Golden sands, vibrant nightlife, water sports and Portuguese heritage.',
        averageBudget: 35000,
        bestTimeToVisit: 'Nov - Feb',
        imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
        isPopular: true,
      },
      {
        id: 3,
        name: 'Munnar & Alleppey',
        state: 'Kerala',
        country: 'India',
        description: 'Tea plantations, serene backwaters in houseboats, and lush greenery.',
        averageBudget: 40000,
        bestTimeToVisit: 'Sep - Mar',
        imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
        isPopular: true,
      },
      {
        id: 4,
        name: 'Jaipur & Udaipur',
        state: 'Rajasthan',
        country: 'India',
        description: 'Royal palaces, majestic forts, colorful bazaars and desert culture.',
        averageBudget: 45000,
        bestTimeToVisit: 'Oct - Mar',
        imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800',
        isPopular: true,
      },
      {
        id: 5,
        name: 'Varanasi',
        state: 'Uttar Pradesh',
        country: 'India',
        description: 'Ancient spiritual capital, evening Ganga Aarti, and cultural ghats.',
        averageBudget: 20000,
        bestTimeToVisit: 'Oct - Mar',
        imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800',
      },
      {
        id: 6,
        name: 'Ladakh',
        state: 'Ladakh',
        country: 'India',
        description: 'High-altitude mountain passes, Pangong Lake, and Buddhist monasteries.',
        averageBudget: 55000,
        bestTimeToVisit: 'May - Sep',
        imageUrl: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800',
        isPopular: true,
      },
      {
        id: 7,
        name: 'Andaman & Nicobar',
        state: 'Andaman',
        country: 'India',
        description: 'Crystal-clear turquoise waters, coral reefs, and pristine white beaches.',
        averageBudget: 60000,
        bestTimeToVisit: 'Oct - May',
        imageUrl: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
      },
      {
        id: 8,
        name: 'Rishikesh',
        state: 'Uttarakhand',
        country: 'India',
        description: 'Yoga capital of the world, white water river rafting, and Himalayan foothills.',
        averageBudget: 18000,
        bestTimeToVisit: 'Sep - Jun',
        imageUrl: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800',
      },
    ],
    []
  );

  const fetchDestinations = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await destinationService.getAll(1, 50);
      const items = Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.content;
      if (items && items.length > 0) {
        setDestinations(items);
      } else {
        setDestinations(fallbackDestinations);
      }
    } catch {
      setDestinations(fallbackDestinations);
    }
    setLoading(false);
  }, [fallbackDestinations]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const states = ['All', ...Array.from(new Set(destinations.map((d) => d.state).filter(Boolean)))];

  const filtered = destinations.filter((d) => {
    const matchesSearch =
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.state?.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase());
    const matchesState = selectedState === 'All' || d.state === selectedState;
    return matchesSearch && matchesState;
  });

  const handleExplore = (id: number | string) => {
    navigate(`/destinations/${id}`);
  };

  return (
    <div className="bg-navy-dark min-h-screen text-slate-100">
      {/* Header Banner */}
      <section className="relative bg-gradient-to-b from-navy via-navy-light to-navy-dark py-20 px-4 border-b border-border/80 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge variant="cyan" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}>
            Curated Destinations
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-white mt-3 tracking-tight">
            Explore Trending Getaways
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base mt-3 leading-relaxed">
            Discover breathtaking regions across India. Request tailored packages from certified local agencies with PayPal escrow protection.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto mt-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-surface/90 border border-white/10 text-white placeholder:text-slate-500 shadow-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 text-sm"
              placeholder="Search by city, state, or style (e.g. Kerala, Ladakh, Beaches)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* State filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {states.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedState === st
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-surface border border-border-light text-slate-300 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {loading ? (
          <CardSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No destinations match your search"
            description="Try clearing your search query or choosing 'All' from the state filters above."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setSelectedState('All');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((d) => (
              <DestinationCard
                key={d.id}
                id={d.id}
                name={d.name}
                state={d.state}
                country={d.country}
                description={d.description}
                imageUrl={d.imageUrl}
                averageBudget={d.averageBudget}
                bestTimeToVisit={d.bestTimeToVisit}
                isPopular={d.isPopular}
                onExplore={handleExplore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
