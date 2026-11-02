import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Compass,
  ArrowRight,
  PlaneTakeoff,
  Sparkles,
} from 'lucide-react';
import { Button } from './Button';

export interface AITravelSearchPanelProps {
  className?: string;
  onSearchSubmit?: (params: Record<string, any>) => void;
}

export const AITravelSearchPanel: React.FC<AITravelSearchPanelProps> = ({
  className = '',
  onSearchSubmit,
}) => {
  const navigate = useNavigate();

  const [destination, setDestination] = useState('');
  const [fromLocation, setFromLocation] = useState('Mumbai');
  const [startDate, setStartDate] = useState('');
  const [travelersCount, setTravelersCount] = useState('2');
  const [budget, setBudget] = useState('60000');
  const [preference, setPreference] = useState('Family Retreat');

  const popularDestinations = [
    'Kerala',
    'Goa',
    'Rajasthan',
    'Ladakh',
    'Andaman Islands',
    'Manali',
    'Meghalaya',
  ];

  const travelPreferences = [
    'Family Retreat',
    'Romantic & Honeymoon',
    'Adventure & Wildlife',
    'Luxury Heritage',
    'Beach & Coastal',
    'Wellness & Ayurveda',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams({
      destination: destination || 'Kerala',
      fromLocation,
      startDate: startDate || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      travelersCount,
      budget,
      preference,
    });

    if (onSearchSubmit) {
      onSearchSubmit({
        destination: destination || 'Kerala',
        fromLocation,
        startDate,
        travelersCount,
        budget,
        preference,
      });
    }

    navigate(`/traveler/create-trip?${queryParams.toString()}`);
  };

  return (
    <div className={`w-full max-w-5xl mx-auto ${className}`}>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-4 sm:p-7 rounded-3xl border border-cyan-500/25 shadow-2xl shadow-cyan-950/40 relative overflow-hidden"
      >
        {/* Subtle Ambient Header Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wider text-white uppercase">
                AI Travel Search Engine
              </span>
              <span className="text-[10px] text-cyan-400 block -mt-0.5">
                Google Gemini Orchestrated &bull; Verified Escrow Rates
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px]">50+ Verified Specialists Active</span>
          </div>
        </div>

        {/* 6 Grid Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* 1. Destination */}
          <div className="p-3.5 rounded-2xl bg-surface-dark/90 border border-border/80 hover:border-cyan-500/40 transition-colors">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Destination</span>
            </label>
            <input
              type="text"
              list="popular-destinations-list"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Kerala, Ladakh, Goa"
              className="w-full bg-transparent text-sm text-white font-semibold placeholder:text-slate-500 outline-none"
            />
            <datalist id="popular-destinations-list">
              {popularDestinations.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          {/* 2. Departure Location */}
          <div className="p-3.5 rounded-2xl bg-surface-dark/90 border border-border/80 hover:border-cyan-500/40 transition-colors">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-teal-400 mb-1">
              <PlaneTakeoff className="w-3.5 h-3.5" />
              <span>Departure Location</span>
            </label>
            <input
              type="text"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              placeholder="e.g. Mumbai, Delhi, Bangalore"
              className="w-full bg-transparent text-sm text-white font-semibold placeholder:text-slate-500 outline-none"
            />
          </div>

          {/* 3. Travel Dates */}
          <div className="p-3.5 rounded-2xl bg-surface-dark/90 border border-border/80 hover:border-cyan-500/40 transition-colors">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Travel Dates / Departure</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-transparent text-sm text-white font-semibold outline-none cursor-pointer"
            />
          </div>

          {/* 4. Number of Travellers */}
          <div className="p-3.5 rounded-2xl bg-surface-dark/90 border border-border/80 hover:border-cyan-500/40 transition-colors">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Travellers</span>
            </label>
            <select
              value={travelersCount}
              onChange={(e) => setTravelersCount(e.target.value)}
              className="w-full bg-transparent text-sm text-white font-semibold outline-none cursor-pointer"
            >
              <option value="1" className="bg-navy-dark text-white">1 Solo Explorer</option>
              <option value="2" className="bg-navy-dark text-white">2 Couples / Duo</option>
              <option value="4" className="bg-navy-dark text-white">4 Family (3-5)</option>
              <option value="6" className="bg-navy-dark text-white">6+ Group Adventurers</option>
            </select>
          </div>

          {/* 5. Budget */}
          <div className="p-3.5 rounded-2xl bg-surface-dark/90 border border-border/80 hover:border-cyan-500/40 transition-colors">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-teal-400 mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Target Budget (INR)</span>
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-transparent text-sm text-white font-semibold outline-none cursor-pointer"
            >
              <option value="30000" className="bg-navy-dark text-white">₹30,000 (Value Budget)</option>
              <option value="60000" className="bg-navy-dark text-white">₹60,000 (Comfort 4★)</option>
              <option value="95000" className="bg-navy-dark text-white">₹95,000 (Premium Luxury)</option>
              <option value="150000" className="bg-navy-dark text-white">₹1,50,000+ (Ultimate Bespoke)</option>
            </select>
          </div>

          {/* 6. Travel Preferences */}
          <div className="p-3.5 rounded-2xl bg-surface-dark/90 border border-border/80 hover:border-cyan-500/40 transition-colors">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Vibe & Preference</span>
            </label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className="w-full bg-transparent text-sm text-white font-semibold outline-none cursor-pointer"
            >
              {travelPreferences.map((pref) => (
                <option key={pref} value={pref} className="bg-navy-dark text-white">
                  {pref}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Plan My Journey Button */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-cyan-400 font-bold">Fast-Track:</span>
            <span>AI generates your draft proposal within 30 seconds</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto px-8 py-3.5 shadow-cyan-500/30 text-slate-950 font-black tracking-wide"
          >
            Plan My Journey
          </Button>
        </div>
      </motion.form>
    </div>
  );
};
