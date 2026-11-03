import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Compass, ArrowRight } from 'lucide-react';

interface DestinationCardProps {
  destination: {
    id: string;
    name: string;
    slug?: string;
    state?: string;
    country?: string;
    description?: string;
    imageUrl?: string;
    bestTimeToVisit?: string;
    averageBudget?: number;
    popularAttractions?: string[];
  };
}

export const DestinationRecommendationCard: React.FC<DestinationCardProps> = ({ destination }) => {
  const navigate = useNavigate();

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-navy-card/90 border border-cyan-500/25 hover:border-cyan-400/50 transition-all duration-300 shadow-lg shadow-cyan-950/20 my-3">
      <div className="relative h-44 overflow-hidden">
        <img
          src={destination.imageUrl || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800'}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-400/30 text-[10px] font-bold text-cyan-300">
          Verified Destination
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-semibold mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{destination.state ? `${destination.state}, India` : 'India'}</span>
          </div>
          <h4 className="text-lg font-black text-white">{destination.name}</h4>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {destination.description && (
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {destination.description}
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
          {destination.bestTimeToVisit && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{destination.bestTimeToVisit}</span>
            </div>
          )}
          {destination.averageBudget && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Avg Trip </span>
              <span className="font-bold text-cyan-300">₹{Number(destination.averageBudget).toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {destination.popularAttractions && destination.popularAttractions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {destination.popularAttractions.slice(0, 3).map((attr, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-white/10"
              >
                {attr}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate(`/destinations/${destination.id || destination.slug}`)}
          className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explore {destination.name} Inventory</span>
          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
        </button>
      </div>
    </div>
  );
};

