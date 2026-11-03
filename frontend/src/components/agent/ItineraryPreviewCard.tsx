import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  Edit3,
  FileCheck2,
  Utensils,
  Hotel,
} from 'lucide-react';

interface ItineraryDay {
  dayNumber: number;
  title: string;
  morning?: string;
  afternoon?: string;
  evening?: string;
  mealsIncluded?: string[];
  accommodationNotes?: string;
  activitiesNotes?: string;
  estimatedDayCost?: number;
}

interface ItineraryPreviewProps {
  itinerary: {
    destinationName?: string;
    numberOfDays: number;
    travelersCount?: number;
    travelStyle?: string;
    totalEstimatedCost?: number;
    hotel?: any;
    days: ItineraryDay[];
  };
  onSave?: (itinerary: any) => void;
  onEdit?: (itinerary: any) => void;
  onPrepareBooking?: (itinerary: any) => void;
  isSaved?: boolean;
}

export const ItineraryPreviewCard: React.FC<ItineraryPreviewProps> = ({
  itinerary,
  onSave,
  onEdit,
  onPrepareBooking,
  isSaved = false,
}) => {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  const toggleDay = (dayNum: number) => {
    setExpandedDay(expandedDay === dayNum ? null : dayNum);
  };

  return (
    <div className="rounded-2xl bg-navy-card/95 border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-950/25 my-3">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-navy-dark border-b border-cyan-500/20">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            {itinerary.numberOfDays}-Day Day-by-Day Route
          </span>
          {itinerary.totalEstimatedCost && (
            <span className="text-sm font-black text-cyan-300">
              ₹{Number(itinerary.totalEstimatedCost).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <h3 className="text-base font-black text-white">
          {itinerary.destinationName || 'Personalized Journey'} {itinerary.travelStyle ? `• ${itinerary.travelStyle}` : ''}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Crafted for {itinerary.travelersCount || 2} travelers based on live inventory.
        </p>
      </div>

      {/* Days Accordion */}
      <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
        {itinerary.days.map((day) => {
          const isExpanded = expandedDay === day.dayNumber;
          return (
            <div
              key={day.dayNumber}
              className={`rounded-xl border transition-all duration-200 ${
                isExpanded
                  ? 'bg-slate-900/90 border-cyan-500/35 shadow-md shadow-cyan-950/20'
                  : 'bg-slate-900/40 border-white/5 hover:border-white/15'
              }`}
            >
              <button
                onClick={() => toggleDay(day.dayNumber)}
                className="w-full py-2.5 px-3 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black flex items-center justify-center shrink-0">
                    {day.dayNumber}
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-white leading-tight">{day.title}</h5>
                    {day.activitiesNotes && (
                      <span className="text-[10px] text-cyan-300/80 line-clamp-1">
                        {day.activitiesNotes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {day.estimatedDayCost && (
                    <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                      ₹{Number(day.estimatedDayCost).toLocaleString('en-IN')}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-2 text-xs border-t border-white/5">
                  {day.morning && (
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20 shrink-0 mt-0.5">
                        Morning
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-300">{day.morning}</p>
                    </div>
                  )}

                  {day.afternoon && (
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 shrink-0 mt-0.5">
                        Afternoon
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-300">{day.afternoon}</p>
                    </div>
                  )}

                  {day.evening && (
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20 shrink-0 mt-0.5">
                        Evening
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-300">{day.evening}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 text-[10px]">
                    {day.accommodationNotes && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Hotel className="w-3 h-3 text-cyan-400" />
                        <span>{day.accommodationNotes}</span>
                      </div>
                    )}
                    {day.mealsIncluded && day.mealsIncluded.length > 0 && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Utensils className="w-3 h-3 text-amber-400" />
                        <span>{day.mealsIncluded.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Toolbar */}
      <div className="p-3 bg-slate-950/80 border-t border-white/10 flex flex-wrap items-center gap-2">
        {onSave && (
          <button
            onClick={() => onSave(itinerary)}
            disabled={isSaved}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Saved to Profile' : 'Save Itinerary'}</span>
          </button>
        )}

        {onEdit && (
          <button
            onClick={() => onEdit(itinerary)}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Route</span>
          </button>
        )}

        {onPrepareBooking && (
          <button
            onClick={() => onPrepareBooking(itinerary)}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 ml-auto transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Prepare Booking Proposal</span>
          </button>
        )}
      </div>
    </div>
  );
};
