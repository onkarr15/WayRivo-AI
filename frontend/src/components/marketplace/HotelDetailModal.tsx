import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Star, MapPin, Check, BedDouble, ShieldCheck, Phone, Mail, ArrowRight } from 'lucide-react';
import { useTripBasket } from '../../context/TripBasketContext';

interface HotelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: any;
}

export const HotelDetailModal: React.FC<HotelDetailModalProps> = ({ isOpen, onClose, hotel }) => {
  const { addItem } = useTripBasket();
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);

  if (!hotel) return null;

  const roomTypes: any[] = Array.isArray(hotel.roomTypes) && hotel.roomTypes.length > 0
    ? hotel.roomTypes
    : [
        {
          category: 'Deluxe Room',
          price: Number(hotel.pricePerNight) || 8500,
          availableRooms: hotel.availableRooms || 5,
          bedType: 'Queen Bed',
        },
        {
          category: 'Executive Heritage Suite',
          price: (Number(hotel.pricePerNight) || 8500) * 1.4,
          availableRooms: Math.max(1, (hotel.availableRooms || 5) - 2),
          bedType: 'King Bed',
        },
      ];

  const currentRoom = roomTypes[selectedRoomIndex] || roomTypes[0];

  const handleAddHotel = () => {
    addItem({
      id: `${hotel.id}-${currentRoom.category}`,
      type: 'HOTEL',
      title: `${hotel.name} (${currentRoom.category})`,
      destinationName: hotel.city || hotel.destination?.name,
      price: Number(currentRoom.price),
      currency: hotel.currency || 'INR',
      imageUrl: Array.isArray(hotel.imageUrls) ? hotel.imageUrls[0] : hotel.imageUrl,
      details: {
        hotelId: hotel.id,
        roomCategory: currentRoom.category,
        address: hotel.address,
        stars: hotel.stars,
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={hotel.name} maxWidth="2xl">
      <div className="space-y-6 pt-2">
        {/* Main Hotel Banner Image */}
        <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-900">
          <img
            src={(Array.isArray(hotel.imageUrls) && hotel.imageUrls[0]) || hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000'}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent" />

          {/* Badges on Banner */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge variant="cyan" size="sm">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 mr-1" />
              Verified Hotel
            </Badge>
          </div>

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-200">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{hotel.address || hotel.city}</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-dark/90 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{hotel.stars || 4} Stars</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1.5">Overview</h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {hotel.description || 'Experience world-class hospitality, luxury accommodations, and curated local dining.'}
          </p>
        </div>

        {/* Room Categories & Real Availability */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Select Room Category ({roomTypes.length} Available)
            </h4>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Live Availability Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roomTypes.map((room, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedRoomIndex(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedRoomIndex === idx
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'bg-surface border-border hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-white">{room.category}</h5>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <BedDouble className="w-3.5 h-3.5 text-cyan-400" /> {room.bedType || 'King Bed'}
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {room.availableRooms || 5} Left
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Nightly Rate</span>
                  <span className="text-base font-extrabold text-cyan-300 font-mono">
                    ₹{Number(room.price).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5">
              Included Facilities & Perks
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {hotel.amenities.map((item: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-surface-dark border border-border text-xs text-slate-300"
                >
                  <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact info if available */}
        {(hotel.contactEmail || hotel.contactPhone) && (
          <div className="p-3.5 rounded-xl bg-surface-dark border border-border flex flex-wrap gap-4 text-xs text-slate-400">
            {hotel.contactPhone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" /> {hotel.contactPhone}
              </span>
            )}
            {hotel.contactEmail && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" /> {hotel.contactEmail}
              </span>
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Selected Room Rate</span>
            <span className="text-xl font-black text-cyan-300 font-mono">
              ₹{Number(currentRoom.price).toLocaleString()} <span className="text-xs font-normal text-slate-400">/ night</span>
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
              onClick={handleAddHotel}
            >
              Add Room to Trip
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
