import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { destinationService } from '../../services';
import {
  MapPin,
  Calendar,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Compass,
  ShieldCheck,
  Hotel as HotelIcon,
  Activity as ActivityIcon,
  Sparkles,
  Luggage,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { HotelCard } from '../../components/ui/HotelCard';
import { ActivityCard } from '../../components/ui/ActivityCard';
import { PackageCard } from '../../components/ui/PackageCard';
import { HotelDetailModal } from '../../components/marketplace/HotelDetailModal';
import { ActivityDetailModal } from '../../components/marketplace/ActivityDetailModal';
import { PackageDetailModal } from '../../components/marketplace/PackageDetailModal';
import { useTripBasket } from '../../context/TripBasketContext';

const DestinationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useTripBasket();

  const [destination, setDestination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'hotels' | 'activities' | 'packages'>('all');

  // Modals
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      destinationService
        .getById(id)
        .then((res) => {
          if (res.data?.success && res.data.data) {
            setDestination(res.data.data);
          } else if (res.data?.data) {
            setDestination(res.data.data);
          }
        })
        .catch(() => {
          // Fallback to slug if ID route fails
          destinationService
            .getBySlug(id)
            .then((res) => setDestination(res.data?.data))
            .catch(() => setDestination(null));
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-navy-dark py-24 px-4 text-center">
        <div className="max-w-md mx-auto card p-8 border border-border">
          <h2 className="text-2xl font-black text-white mb-3">Destination Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">
            The requested destination could not be located in our active database catalog.
          </p>
          <Button variant="primary" size="md" onClick={() => navigate('/explore')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  const hotels: any[] = destination.hotels || [];
  const activities: any[] = destination.activities || [];
  const packages: any[] = destination.packages || [];

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-24">
      {/* Hero Header */}
      <div className="relative h-[480px] w-full overflow-hidden bg-slate-950">
        <img
          src={destination.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600'}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/60 to-transparent" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 z-10">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Explore Catalog
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy-dark/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              {destination.state ? `${destination.state}, ${destination.country}` : destination.country}
            </span>
            <Badge variant="cyan" glow dot size="sm">Verified Destination</Badge>
          </div>

          <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight">
            {destination.name}
          </h1>

          {/* Highlights pills */}
          {destination.highlights && destination.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {destination.highlights.map((h: string, idx: number) => (
                <span
                  key={idx}
                  className="text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-slate-200 border border-white/10 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" /> {h}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Overview Card */}
            <div className="card p-6 sm:p-8 border border-border">
              <h2 className="text-xl sm:text-2xl font-black text-white mb-4">
                About {destination.name}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {destination.description}
              </p>

              {/* Best Time & Average Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-3.5 p-4 bg-surface-dark rounded-2xl border border-border">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Best Time to Visit</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {destination.bestTimeToVisit || 'September to April'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-4 bg-surface-dark rounded-2xl border border-border">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Estimated Budget</p>
                    <p className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                      ₹{Number(destination.averageBudget || 25000).toLocaleString()}{' '}
                      <span className="text-xs text-slate-400 font-normal">/ person</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Popular Attractions */}
            {destination.popularAttractions && destination.popularAttractions.length > 0 && (
              <div className="card p-6 sm:p-8 border border-border">
                <h3 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" /> Top Iconic Attractions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {destination.popularAttractions.map((attr: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-surface-dark border border-border flex items-center gap-3 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-semibold text-slate-200">{attr}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Travel Recommendations & Tips */}
            {destination.travelTips && destination.travelTips.length > 0 && (
              <div className="card p-6 sm:p-8 border border-border">
                <h3 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
                  <Luggage className="w-5 h-5 text-amber-400" /> Specialist Travel Recommendations
                </h3>
                <div className="space-y-2.5">
                  {destination.travelTips.map((tip: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Filterable Marketplace Section (Hotels, Activities, Packages) */}
            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">Live Inventory in {destination.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real verified accommodations, excursions, and packages</p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'all' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({hotels.length + activities.length + packages.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('hotels')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'hotels' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Hotels ({hotels.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('activities')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'activities' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Activities ({activities.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('packages')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'packages' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Packages ({packages.length})
                  </button>
                </div>
              </div>

              {/* Hotels Section */}
              {(activeTab === 'all' || activeTab === 'hotels') && hotels.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <HotelIcon className="w-4 h-4 text-cyan-400" /> Accommodations & Heritage Stays
                  </h4>
                  <div className="space-y-4">
                    {hotels.map((hotel) => (
                      <HotelCard
                        key={hotel.id}
                        id={hotel.id}
                        name={hotel.name}
                        city={hotel.city}
                        state={destination.state}
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
                </div>
              )}

              {/* Activities Section */}
              {(activeTab === 'all' || activeTab === 'activities') && activities.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h4 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4 text-teal-400" /> Curated Excursions & Adventures
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            destinationName: destination.name,
                            price: Number(act.pricePerPerson),
                            currency: act.currency || 'INR',
                            imageUrl: Array.isArray(act.imageUrls) ? act.imageUrls[0] : act.imageUrl,
                          });
                        }}
                        onViewDetails={() => setSelectedActivity(act)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Packages Section */}
              {(activeTab === 'all' || activeTab === 'packages') && packages.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" /> Complete Agency Packages
                  </h4>
                  <div className="space-y-4">
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
                            destinationName: destination.name,
                            price: Number(pkg.totalPrice),
                            currency: pkg.currency || 'INR',
                            imageUrl: pkg.imageUrl,
                          });
                        }}
                        onViewDetails={() => setSelectedPackage(pkg)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Sidebar CTA */}
          <div>
            <div className="card p-6 sticky top-24 border border-cyan-500/30 shadow-2xl space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold">
                <Compass className="w-3.5 h-3.5" /> Autonomous Reverse Travel
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Custom Trip to {destination.name}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Tell our AI agent your dates and budget. Certified local agencies will submit tailored proposals with guaranteed escrow protection.
                </p>
              </div>

              <div className="space-y-3 p-4 bg-surface-dark rounded-2xl border border-border text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Starting Budget</span>
                  <span className="font-extrabold text-cyan-300 font-mono">
                    ₹{Number(destination.averageBudget || 25000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Agency Match Time</span>
                  <span className="font-bold text-white">&lt; 24 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Proposal Limit</span>
                  <span className="font-bold text-teal-300">Up to 5 Free Proposals</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Escrow Security</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Protected
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                onClick={() =>
                  navigate(`/traveler/create-trip?destination=${encodeURIComponent(destination.name)}`)
                }
              >
                Request Custom Proposals
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Booking Fees • Free Cancellation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Detail Modals */}
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

export default DestinationDetailPage;
