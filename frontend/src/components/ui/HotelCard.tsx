import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Check, ShieldCheck } from 'lucide-react';
import { Badge } from './Badge';
import { PriceDisplay } from './PriceDisplay';
import { Button } from './Button';

export interface HotelCardProps {
  id: number | string;
  name: string;
  city: string;
  state?: string;
  rating?: number;
  reviewsCount?: number;
  imageUrl?: string;
  roomType?: string;
  pricePerNight: number;
  currency?: string;
  amenities?: string[];
  isVerified?: boolean;
  onSelect?: (id: number | string) => void;
  className?: string;
}

export const HotelCard: React.FC<HotelCardProps> = ({
  id,
  name,
  city,
  state,
  rating = 4.8,
  reviewsCount = 42,
  imageUrl,
  roomType = 'Deluxe Suite with Breakfast',
  pricePerNight,
  currency = 'INR',
  amenities = ['Free WiFi', 'Breakfast Included', 'Pool Access'],
  isVerified = true,
  onSelect,
  className = '',
}) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className={`group rounded-3xl bg-surface/90 border border-border/80 hover:border-cyan-500/40 shadow-xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 ${className}`}
    >
      {/* Hotel Image with Overlay */}
      <div className="relative md:w-72 h-52 md:h-auto overflow-hidden bg-slate-900 flex-shrink-0">
        <img
          src={imageUrl || fallbackImage}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-navy-dark/80 via-transparent to-transparent" />

        {isVerified && (
          <div className="absolute top-3 left-3">
            <Badge variant="cyan" size="sm" icon={<ShieldCheck className="w-3 h-3 text-cyan-400" />}>
              WayRivo Verified
            </Badge>
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{city}{state ? `, ${state}` : ''}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{rating.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 font-normal">({reviewsCount})</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mt-1.5 group-hover:text-cyan-300 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-cyan-400/90 font-medium mt-0.5">{roomType}</p>

          {/* Amenities Pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {amenities.map((item, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5 flex items-center gap-1"
              >
                <Check className="w-3 h-3 text-teal-400" /> {item}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-border/80 flex items-center justify-between">
          <PriceDisplay
            amount={pricePerNight}
            currency={currency}
            period="per night"
            size="md"
            variant="cyan"
          />

          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelect && onSelect(id)}
          >
            Select Room
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
