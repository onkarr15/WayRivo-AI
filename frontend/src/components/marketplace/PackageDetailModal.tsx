import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Star, Calendar, Check, X, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useTripBasket } from '../../context/TripBasketContext';

interface PackageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: any;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({ isOpen, onClose, pkg }) => {
  const { addItem } = useTripBasket();

  if (!pkg) return null;

  const handleAddPackage = () => {
    addItem({
      id: pkg.id,
      type: 'PACKAGE',
      title: pkg.title,
      destinationName: pkg.destination?.name,
      price: Number(pkg.totalPrice),
      currency: pkg.currency || 'INR',
      imageUrl: pkg.imageUrl,
      details: {
        packageId: pkg.id,
        durationDays: pkg.durationDays,
        expertName: pkg.expertName,
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pkg.title} maxWidth="2xl">
      <div className="space-y-6 pt-2">
        {/* Banner */}
        <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-900">
          <img
            src={pkg.imageUrl || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1000'}
            alt={pkg.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/30 to-transparent" />

          {/* Badges on Banner */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy-dark/90 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              {pkg.durationDays} Days / {Math.max(1, pkg.durationDays - 1)} Nights
            </span>
            {pkg.isRecommended && (
              <Badge variant="cyan" glow dot size="sm">Specialist Pick</Badge>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">{pkg.organizationName || pkg.expertName}</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-dark/90 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{Number(pkg.expertRating || 4.8).toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 font-normal">({pkg.expertReviews || 18} reviews)</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1.5">
            Package Itinerary Overview
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {pkg.description}
          </p>
        </div>

        {/* Highlights */}
        {pkg.highlights && pkg.highlights.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">
              Curated Journey Highlights
            </h4>
            <div className="flex flex-wrap gap-2">
              {pkg.highlights.map((h: string, idx: number) => (
                <span
                  key={idx}
                  className="text-xs px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 flex items-center gap-1.5 font-medium"
                >
                  <Star className="w-3 h-3 text-cyan-400" /> {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Inclusions & Exclusions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pkg.inclusions && pkg.inclusions.length > 0 && (
            <div className="p-4 rounded-2xl bg-surface border border-border">
              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> What Is Included
              </h5>
              <div className="space-y-1.5">
                {pkg.inclusions.map((inc: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pkg.exclusions && pkg.exclusions.length > 0 && (
            <div className="p-4 rounded-2xl bg-surface border border-border">
              <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Exclusions
              </h5>
              <div className="space-y-1.5">
                {pkg.exclusions.map((exc: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                    <X className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{exc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Escrow & Cancellation Guarantee */}
        <div className="p-4 rounded-2xl bg-surface-dark border border-border flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h6 className="font-bold text-white">PayPal Escrow Protected Booking</h6>
            <p className="text-slate-400 mt-0.5">
              {pkg.cancellationPolicy || 'Funds remain safely in escrow until you arrive and confirm services with your licensed agency.'}
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Total Package Price</span>
            <span className="text-xl font-black text-cyan-300 font-mono">
              ₹{Number(pkg.totalPrice).toLocaleString()}
            </span>
            {pkg.pricePerPerson && (
              <span className="text-[11px] text-slate-400 block">
                (≈ ₹{Number(pkg.pricePerPerson).toLocaleString()} / person)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              onClick={handleAddPackage}
            >
              Add Package to Trip
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
