import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from './Badge';
import { PriceDisplay } from './PriceDisplay';
import { Button } from './Button';

export interface DestinationCardProps {
  id: number | string;
  name: string;
  state?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  averageBudget?: number;
  bestTimeToVisit?: string;
  isPopular?: boolean;
  onExplore?: (id: number | string) => void;
  className?: string;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  id,
  name,
  state,
  country = 'India',
  description,
  imageUrl,
  averageBudget,
  bestTimeToVisit,
  isPopular = false,
  onExplore,
  className = '',
}) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800';

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-3xl bg-surface/90 border border-border/80 hover:border-cyan-500/40 shadow-xl shadow-black/30 hover:shadow-cyan-500/10 flex flex-col transition-all duration-300 ${className}`}
    >
      {/* Image Container with Zoom effect */}
      <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900">
        <img
          src={imageUrl || fallbackImage}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />
        {/* Subtle Dark Gradient Overlay for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/30 to-transparent opacity-90" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {isPopular ? (
            <Badge variant="gold" glow dot icon={<Sparkles className="w-3 h-3 text-amber-300" />}>
              Trending
            </Badge>
          ) : (
            <span />
          )}

          {bestTimeToVisit && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-navy-dark/80 backdrop-blur-md text-slate-300 border border-white/10 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-400" /> {bestTimeToVisit}
            </span>
          )}
        </div>

        {/* Floating Location Name on Image */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5" /> {state ? `${state}, ${country}` : country}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
            {name}
          </h3>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        {description && (
          <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        <div className="pt-3 border-t border-border/80 flex items-center justify-between">
          {averageBudget ? (
            <PriceDisplay
              amount={averageBudget}
              currency="INR"
              period="avg. budget"
              size="sm"
              variant="cyan"
            />
          ) : (
            <span className="text-xs text-slate-400">Custom Itineraries</span>
          )}

          <Button
            variant="secondary"
            size="sm"
            rightIcon={<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}
            onClick={() => onExplore && onExplore(id)}
            className="hover:border-cyan-400 hover:text-cyan-300"
          >
            Explore
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
