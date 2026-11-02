import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { destinationService } from '../../services';
import { MapPin, Calendar, DollarSign, ArrowRight, ArrowLeft, CheckCircle, Compass, ShieldCheck } from 'lucide-react';

const DestinationDetailPage: React.FC = () => {
  const { id } = useParams();
  const [destination, setDestination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      destinationService.getById(Number(id))
        .then(res => setDestination(res.data?.data))
        .catch(() => {
          // Fallback demo data
          setDestination({
            id: Number(id),
            name: 'Munnar & Alleppey',
            state: 'Kerala',
            country: 'India',
            description: 'Experience God’s Own Country with the misty tea hills of Munnar and the iconic tranquil backwaters of Alleppey. Savor authentic traditional sadya, cruise along the canals in luxury houseboats, and witness breathtaking sunrises.',
            averageBudget: 40000,
            bestTimeToVisit: 'September - March',
            imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-navy mb-3">Destination Not Found</h2>
        <p className="text-text-light mb-6">The requested destination does not exist or has been removed.</p>
        <Link to="/explore" className="btn-primary">
          <ArrowLeft className="w-4 h-4" /> Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Hero Header */}
      <div className="relative h-[420px] w-full overflow-hidden">
        <img
          src={destination.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
          <Link to="/explore" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Explore
          </Link>
          <div className="inline-flex items-center gap-2 text-orange font-semibold text-sm mb-2">
            <MapPin className="w-4 h-4" /> {destination.state}, {destination.country || 'India'}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">{destination.name}</h1>
        </div>
      </div>

      {/* Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="card p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-navy mb-4">About {destination.name}</h2>
              <p className="text-text-light text-base sm:text-lg leading-relaxed whitespace-pre-line">
                {destination.description || 'A mesmerizing getaway filled with unforgettable sights, local culinary delights, and culturally rich landmarks.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-3 p-4 bg-bg rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center text-orange">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-light font-medium">Best Time to Visit</p>
                    <p className="text-sm font-bold text-navy mt-0.5">{destination.bestTimeToVisit || 'All Year Round'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-bg rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-light font-medium">Estimated Budget</p>
                    <p className="text-sm font-bold text-navy mt-0.5">
                      {destination.averageBudget ? `₹${Number(destination.averageBudget).toLocaleString()} / person` : 'Customizable'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why WayRivo */}
            <div className="card p-6 sm:p-8">
              <h3 className="text-xl font-bold text-navy mb-4">How WayRivo Plans Your Visit</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-navy text-sm">Verified Local Specialists</p>
                    <p className="text-sm text-text-light">Only certified experts from this region will handle your itinerary and on-ground logistics.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-navy text-sm">Best Price Guarantee</p>
                    <p className="text-sm text-text-light">Multiple agents compete with customized proposals, saving you up to 30% compared to standard packages.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-navy text-sm">100% Tailored To You</p>
                    <p className="text-sm text-text-light">You decide hotels, activities, vehicle preferences, and pace of travel.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar CTA */}
          <div>
            <div className="card p-6 sticky top-24 shadow-xl border-orange/20">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange/10 text-orange rounded-full text-xs font-semibold mb-3">
                <Compass className="w-3.5 h-3.5" /> Reverse Travel Booking
              </div>
              <h3 className="text-xl font-bold text-navy">Plan Your Custom Trip</h3>
              <p className="text-sm text-text-light mt-1 mb-6">
                Tell us your travel dates and group size. Local experts will craft tailor-made proposals for you.
              </p>

              <div className="space-y-3 mb-6 p-4 bg-bg rounded-xl text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light">Starting From</span>
                  <span className="font-bold text-navy">
                    {destination.averageBudget ? `₹${Number(destination.averageBudget).toLocaleString()}` : 'Flexible'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light">Turnaround Time</span>
                  <span className="font-bold text-navy">&lt; 24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light">Proposal Limit</span>
                  <span className="font-bold text-orange">Up to 5 Free Proposals</span>
                </div>
              </div>

              <Link
                to={`/traveler/create-trip?destination=${encodeURIComponent(destination.name)}`}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base font-bold shadow-lg shadow-orange/20"
              >
                Request Custom Proposals <ArrowRight className="w-5 h-5" />
              </Link>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-text-light">
                <ShieldCheck className="w-4 h-4 text-success" />
                Zero Booking Fees • Free Cancellation Options
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetailPage;
