import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface EditItineraryModalProps {
  itinerary: any;
  isOpen: boolean;
  onClose: () => void;
  onSaveModified: (modifiedItinerary: any) => void;
}

export const EditItineraryModal: React.FC<EditItineraryModalProps> = ({
  itinerary,
  isOpen,
  onClose,
  onSaveModified,
}) => {
  const [title, setTitle] = useState(itinerary?.title || `${itinerary?.destinationName || 'Custom'} Travel Plan`);
  const [days, setDays] = useState<any[]>(itinerary?.days ? JSON.parse(JSON.stringify(itinerary.days)) : []);

  useEffect(() => {
    if (itinerary) {
      setTitle(itinerary.title || `${itinerary.destinationName || 'Custom'} Travel Plan`);
      setDays(itinerary.days ? JSON.parse(JSON.stringify(itinerary.days)) : []);
    }
  }, [itinerary]);

  if (!isOpen || !itinerary) return null;

  const handleDayChange = (index: number, field: string, value: any) => {
    const updated = [...days];
    updated[index][field] = value;
    setDays(updated);
  };

  const handleSave = () => {
    onSaveModified({
      ...itinerary,
      title,
      days,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-navy-card border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div>
            <h3 className="text-base font-black text-white">Customize Your Day-by-Day Route</h3>
            <p className="text-xs text-slate-400 mt-0.5">Modify activities, highlights, and daily scheduling.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Itinerary Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Daily Schedule</h4>
            {days.map((day: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center">
                    {day.dayNumber}
                  </span>
                  <input
                    type="text"
                    value={day.title || ''}
                    onChange={(e) => handleDayChange(idx, 'title', e.target.value)}
                    placeholder="Day Title"
                    className="flex-1 py-1 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-cyan-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-amber-400 font-semibold block">Morning</span>
                    <textarea
                      rows={2}
                      value={day.morning || ''}
                      onChange={(e) => handleDayChange(idx, 'morning', e.target.value)}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-cyan-400 font-semibold block">Afternoon</span>
                    <textarea
                      rows={2}
                      value={day.afternoon || ''}
                      onChange={(e) => handleDayChange(idx, 'afternoon', e.target.value)}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-purple-400 font-semibold block">Evening</span>
                    <textarea
                      rows={2}
                      value={day.evening || ''}
                      onChange={(e) => handleDayChange(idx, 'evening', e.target.value)}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 bg-slate-900/60">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Modifications</span>
          </button>
        </div>
      </div>
    </div>
  );
};
