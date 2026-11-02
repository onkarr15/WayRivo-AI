import React from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, Check, Lock, ChevronRight, UserCheck } from 'lucide-react';
import { Badge } from './Badge';
import { PriceDisplay } from './PriceDisplay';
import { Button } from './Button';

export interface PackageCardProps {
  id: number | string;
  title: string;
  expertName: string;
  organizationName?: string;
  expertRating?: number;
  expertReviews?: number;
  durationDays?: number;
  totalPrice: number;
  pricePerPerson?: number;
  currency?: string;
  inclusions?: string[];
  cancellationPolicy?: string;
  isRecommended?: boolean;
  onSelect?: (id: number | string) => void;
  onViewDetails?: (id: number | string) => void;
  className?: string;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  id,
  title,
  expertName,
  organizationName,
  expertRating = 4.9,
  expertReviews = 28,
  durationDays = 5,
  totalPrice,
  pricePerPerson,
  currency = 'INR',
  inclusions = ['4-Star Luxury Resort', 'Private AC Cab', 'Houseboat Cruise', 'Daily Breakfast & Dinner'],
  cancellationPolicy = 'Free cancellation up to 14 days before',
  isRecommended = false,
  onSelect,
  onViewDetails,
  className = '',
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className={`relative rounded-3xl bg-surface/90 border transition-all duration-300 p-6 flex flex-col justify-between gap-5 shadow-xl ${
        isRecommended
          ? 'border-cyan-400/50 shadow-cyan-500/10 bg-gradient-to-b from-surface-elevated/95 to-surface/90'
          : 'border-border/80 hover:border-cyan-500/30'
      } ${className}`}
    >
      {/* Recommended Header Pill */}
      {isRecommended && (
        <div className="absolute -top-3 left-6">
          <Badge variant="cyan" glow dot size="sm">
            Top Specialist Proposal
          </Badge>
        </div>
      )}

      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-xs font-bold">
              <UserCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{organizationName || expertName}</p>
              <div className="flex items-center gap-1 text-[11px] text-amber-300">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{expertRating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({expertReviews} reviews)</span>
              </div>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-cyan-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> {durationDays} Days / {Math.max(1, durationDays - 1)} Nights
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white mt-2 leading-snug hover:text-cyan-300 transition-colors">
          {title}
        </h3>

        {/* Inclusions Check List */}
        <div className="mt-4 space-y-2">
          {inclusions.slice(0, 4).map((inc, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
              <span>{inc}</span>
            </div>
          ))}
        </div>

        {cancellationPolicy && (
          <p className="text-[11px] text-slate-400 mt-3 italic">
            &bull; {cancellationPolicy}
          </p>
        )}
      </div>

      {/* Footer / Pricing & Escrow Notice */}
      <div className="pt-4 border-t border-border/80 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <PriceDisplay
              amount={totalPrice}
              currency={currency}
              period="Total package amount"
              size="lg"
              variant="cyan"
            />
            {pricePerPerson && (
              <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                (≈ {currency === 'INR' ? '₹' : '$'}{pricePerPerson.toLocaleString()} per person)
              </span>
            )}
          </div>

          <div className="text-right flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Escrow Protected</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => onViewDetails(id)}
              className="flex-1"
            >
              View Itinerary
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            rightIcon={<ChevronRight className="w-4 h-4" />}
            onClick={() => onSelect && onSelect(id)}
            className="flex-1 shadow-cyan-500/25"
          >
            Select Proposal
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
