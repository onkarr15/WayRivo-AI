import React, { useState } from 'react';
import { Search, MapPin, Users, Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface SearchBarProps {
  onSearch?: (params: { query: string; destination: string; guests: string }) => void;
  initialQuery?: string;
  className?: string;
  placeholder?: string;
  popularTags?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  initialQuery = '',
  className = '',
  placeholder = 'Where would you love to travel next?',
  popularTags = ['Kerala', 'Ladakh', 'Rajasthan', 'Goa', 'Andaman', 'Manali'],
}) => {
  const [destination, setDestination] = useState(initialQuery);
  const [guests, setGuests] = useState('2 Travelers');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ query: destination, destination, guests });
    }
  };

  const handleTagClick = (tag: string) => {
    setDestination(tag);
    if (onSearch) {
      onSearch({ query: tag, destination: tag, guests });
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Main Bar */}
      <form
        onSubmit={handleSubmit}
        className="glass-card p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-2"
      >
        {/* Destination Field */}
        <div className="flex items-center gap-3 w-full md:flex-1 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
          <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div className="flex-1 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Destination
            </span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none font-medium"
            />
          </div>
        </div>

        <div className="hidden md:block w-px h-10 bg-border-light/60" />

        {/* Travelers / Guests Field */}
        <div className="flex items-center gap-3 w-full md:w-56 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
          <Users className="w-5 h-5 text-teal-400 flex-shrink-0" />
          <div className="flex-1 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Travelers
            </span>
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none cursor-pointer font-medium"
            >
              <option value="Solo (1 Traveler)" className="bg-navy-dark text-white">Solo (1 Traveler)</option>
              <option value="Couple (2 Travelers)" className="bg-navy-dark text-white">Couple (2 Travelers)</option>
              <option value="Family (3-5 Travelers)" className="bg-navy-dark text-white">Family (3-5 Travelers)</option>
              <option value="Group (6+ Travelers)" className="bg-navy-dark text-white">Group (6+ Travelers)</option>
            </select>
          </div>
        </div>

        {/* Search Action Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          leftIcon={<Search className="w-5 h-5" />}
          className="w-full md:w-auto px-7 py-3.5 shadow-cyan-500/30"
        >
          Explore
        </Button>
      </form>

      {/* Quick Suggestion Tags */}
      {popularTags.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Trending:
          </span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="px-3 py-1 rounded-full bg-white/5 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer font-medium"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
