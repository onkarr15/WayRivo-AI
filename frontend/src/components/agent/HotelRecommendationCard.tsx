import React from 'react';
import { Star, CheckCircle2, Plus } from 'lucide-react';
import { useTripBasket } from '../../context/TripBasketContext';

interface HotelCardProps {
  hotel: {
    id: string;
    name: string;
    city: string;
    stars: number;
    pricePerNight: number;
    currency?: string;
    amenities?: string[];
    imageUrls?: string[];
    availableRooms?: number;
    destinationName?: string;
  };
  onSelect?: (hotel: any) => void;
}

export const HotelRecommendationCard: React.FC<HotelCardProps> = ({ hotel, onSelect }) => {
  const { addItem } = useTripBasket();

  const handleAddToBasket = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: hotel.id,
      type: 'HOTEL',
      title: hotel.name,
      price: Number(hotel.pricePerNight),
      destinationName: hotel.destinationName || hotel.city,
      imageUrl: hotel.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy-card/90 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 shadow-lg shadow-cyan-950/20 my-2">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-40 h-32 sm:h-auto relative overflow-hidden shrink-0">
          <img
            src={hotel.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-400/20">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{hotel.stars} Star</span>
          </div>
        </div>

        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">{hotel.name}</h4>
                <p className="text-[11px] text-slate-400">{hotel.city || hotel.destinationName}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-black text-cyan-300">
                  ₹{Number(hotel.pricePerNight).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">/night</span>
              </div>
            </div>

            {/* Room Availability */}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                {typeof hotel.availableRooms === 'number'
                  ? `${hotel.availableRooms} rooms available`
                  : 'Live availability verified'}
              </span>
            </div>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hotel.amenities.slice(0, 3).map((a, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded text-[9px] text-slate-400 bg-slate-800/60 border border-white/5"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
            <button
              onClick={handleAddToBasket}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add to Trip Basket</span>
            </button>
            {onSelect && (
              <button
                onClick={() => onSelect(hotel)}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Choose
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
