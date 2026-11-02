import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Users, Check, ArrowRight } from 'lucide-react';
import { Badge } from './Badge';
import { PriceDisplay } from './PriceDisplay';
import { Button } from './Button';

export interface ActivityCardProps {
  id: number | string;
  title: string;
  description?: string;
  category: string;
  durationHours: number;
  pricePerPerson: number;
  currency?: string;
  location?: string;
  difficultyLevel?: string;
  availableSlots?: number;
  maxSlots?: number;
  imageUrl?: string;
  includedItems?: string[];
  onSelect?: (id: number | string) => void;
  onViewDetails?: (id: number | string) => void;
  className?: string;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  id,
  title,
  description,
  category,
  durationHours,
  pricePerPerson,
  currency = 'INR',
  location,
  difficultyLevel = 'Moderate',
  availableSlots = 12,
  maxSlots = 20,
  imageUrl,
  includedItems = [],
  onSelect,
  onViewDetails,
  className = '',
}) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800';

  const getDifficultyBadge = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return <Badge variant="success" size="sm">Easy</Badge>;
      case 'challenging':
      case 'hard':
        return <Badge variant="gold" size="sm">Challenging</Badge>;
      default:
        return <Badge variant="cyan" size="sm">Moderate</Badge>;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25 }}
      className={`group rounded-3xl bg-surface/90 border border-border/80 hover:border-cyan-500/40 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${className}`}
    >
      <div>
        {/* Activity Image Banner */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-900">
          <img
            src={imageUrl || fallbackImage}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/40 to-transparent" />

          {/* Top Category and Difficulty Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-navy-dark/85 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
              {category}
            </span>
            {getDifficultyBadge(difficultyLevel)}
          </div>

          {/* Location on image bottom */}
          {location && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate font-medium">{location}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>

          {description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* Quick Specs (Duration & Slots) */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-dark border border-border">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{durationHours} hrs</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-dark border border-border">
              <Users className="w-3.5 h-3.5 text-teal-400" />
              <span>{availableSlots} / {maxSlots} slots</span>
            </span>
          </div>

          {/* Inclusions tags preview */}
          {includedItems.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-1.5">
              {includedItems.slice(0, 2).map((item, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5 flex items-center gap-1 truncate max-w-[200px]"
                >
                  <Check className="w-3 h-3 text-teal-400 flex-shrink-0" /> {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="p-5 pt-3 border-t border-border/80 flex items-center justify-between gap-3">
        <PriceDisplay
          amount={pricePerPerson}
          currency={currency}
          period="per person"
          size="sm"
          variant="cyan"
        />

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetails(id)}
            >
              Details
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelect && onSelect(id)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Add to Trip
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
