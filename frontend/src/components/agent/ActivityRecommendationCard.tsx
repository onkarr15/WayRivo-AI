import React from 'react';
import { Clock, Users, Plus } from 'lucide-react';
import { useTripBasket } from '../../context/TripBasketContext';

interface ActivityCardProps {
  activity: {
    id: string;
    title: string;
    category: string;
    durationHours: number;
    pricePerPerson: number;
    currency?: string;
    location?: string;
    difficultyLevel?: string;
    availableSlots?: number;
    destinationName?: string;
    imageUrls?: string[];
  };
  onSelect?: (activity: any) => void;
}

export const ActivityRecommendationCard: React.FC<ActivityCardProps> = ({ activity, onSelect }) => {
  const { addItem } = useTripBasket();

  const handleAddToBasket = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: activity.id,
      type: 'ACTIVITY',
      title: activity.title,
      price: Number(activity.pricePerPerson),
      destinationName: activity.destinationName || activity.location || 'Curated Excursion',
      imageUrl: activity.imageUrls?.[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy-card/90 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 shadow-lg shadow-cyan-950/20 my-2">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-36 h-28 sm:h-auto relative overflow-hidden shrink-0">
          <img
            src={activity.imageUrls?.[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[9px] font-bold text-cyan-300 border border-cyan-400/20">
            {activity.category}
          </div>
        </div>

        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">{activity.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {activity.durationHours} hrs
                  </span>
                  {activity.difficultyLevel && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px]">
                      {activity.difficultyLevel}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-black text-cyan-300">
                  ₹{Number(activity.pricePerPerson).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">/person</span>
              </div>
            </div>

            {/* Capacity */}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Users className="w-3 h-3" />
                {typeof activity.availableSlots === 'number'
                  ? `${activity.availableSlots} slots remaining`
                  : 'Live availability verified'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
            <button
              onClick={handleAddToBasket}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add to Plan</span>
            </button>
            {onSelect && (
              <button
                onClick={() => onSelect(activity)}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Include
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
