import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Clock, MapPin, Users, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTripBasket } from '../../context/TripBasketContext';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ isOpen, onClose, activity }) => {
  const { addItem } = useTripBasket();
  const [guestCount, setGuestCount] = useState(2);

  if (!activity) return null;

  const maxGuests = Math.min(10, activity.availableSlots || 8);

  const handleAddActivity = () => {
    addItem({
      id: `${activity.id}-qty-${guestCount}`,
      type: 'ACTIVITY',
      title: `${activity.title} (${guestCount} guests)`,
      destinationName: activity.location || activity.destination?.name,
      price: Number(activity.pricePerPerson) * guestCount,
      currency: activity.currency || 'INR',
      quantity: guestCount,
      imageUrl: Array.isArray(activity.imageUrls) ? activity.imageUrls[0] : activity.imageUrl,
      details: {
        activityId: activity.id,
        category: activity.category,
        durationHours: activity.durationHours,
        guests: guestCount,
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={activity.title} maxWidth="2xl">
      <div className="space-y-6 pt-2">
        {/* Banner Image */}
        <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-slate-900">
          <img
            src={(Array.isArray(activity.imageUrls) && activity.imageUrls[0]) || activity.imageUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000'}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent" />

          {/* Badges on Banner */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-navy-dark/90 text-cyan-300 border border-cyan-500/30">
              {activity.category}
            </span>
            <Badge variant="cyan" size="sm">{activity.difficultyLevel || 'Moderate'}</Badge>
          </div>

          {activity.location && (
            <div className="absolute bottom-3 left-4 right-4 flex items-center gap-1.5 text-xs text-slate-200">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{activity.location}</span>
            </div>
          )}
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-surface border border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Duration</p>
              <p className="text-xs font-bold text-white">{activity.durationHours} Hours</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Slots Left</p>
              <p className="text-xs font-bold text-emerald-400">{activity.availableSlots || 12} Available</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-border flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Safety Gear</p>
              <p className="text-xs font-bold text-white">Certified Guides</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1.5">
            Experience Details
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {activity.description}
          </p>
        </div>

        {/* What's Included */}
        {activity.includedItems && activity.includedItems.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5">
              What Is Included In This Tour
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activity.includedItems.map((item: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-dark border border-border text-xs text-slate-300"
                >
                  <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guest Selector */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
          <div>
            <h5 className="text-sm font-bold text-white">Select Number of Participants</h5>
            <p className="text-xs text-slate-400">Total pricing updates automatically</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded-lg bg-surface-dark border border-border text-white flex items-center justify-center font-bold hover:bg-white/10"
            >
              -
            </button>
            <span className="w-6 text-center font-bold text-white font-mono text-sm">{guestCount}</span>
            <button
              type="button"
              onClick={() => setGuestCount((prev) => Math.min(maxGuests, prev + 1))}
              className="w-8 h-8 rounded-lg bg-surface-dark border border-border text-white flex items-center justify-center font-bold hover:bg-white/10"
            >
              +
            </button>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Total for {guestCount} Guests</span>
            <span className="text-xl font-black text-cyan-300 font-mono">
              ₹{(Number(activity.pricePerPerson) * guestCount).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              onClick={handleAddActivity}
            >
              Add Activity to Trip
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
