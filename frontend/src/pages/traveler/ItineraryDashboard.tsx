import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Bookmark,
  Shield,
  Trash2,
  Plus,
  Edit3,
  Hotel,
  Car,
  Utensils,
  Compass,
  Info,
  TrendingDown,
  Lock,
} from 'lucide-react';
import {
  destinationService,
  hotelService,
  activityService,
  itineraryIntelligenceService,
  bookingService,
} from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';

interface ActivitySlot {
  timeWindow: string;
  activityTitle: string;
  attractionDescription: string;
  travelTimeEstimate: string;
  estimatedCost: number;
  activityId?: string;
  category?: string;
}

interface ItineraryDayData {
  dayNumber: number;
  date: string;
  dayOfWeek: string;
  title: string;
  morning: ActivitySlot;
  afternoon: ActivitySlot;
  evening: ActivitySlot;
  suggestedMealBreaks: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  practicalTravelNotes: string;
  estimatedDayCost: number;
  hotelStayName?: string;
}

const ItineraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Search parameters & initial inputs
  const initialDestination = searchParams.get('destination') || 'Goa';
  const initialDays = parseInt(searchParams.get('days') || '5', 10);
  const initialBudget = parseInt(searchParams.get('budget') || '35000', 10);

  // Form State
  const [destinations, setDestinations] = useState<any[]>([]);
  const [selectedDestId, setSelectedDestId] = useState<string>('');
  const [destinationName, setDestinationName] = useState<string>(initialDestination);
  const [numberOfDays, setNumberOfDays] = useState<number>(initialDays);
  const [startDate, setStartDate] = useState<string>(() =>
    new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
  );
  const [travelersCount, setTravelersCount] = useState<number>(2);
  const [userBudget, setUserBudget] = useState<number>(initialBudget);
  const [travelStyle, setTravelStyle] = useState<string>('COMFORT');
  const [transportMode, setTransportMode] = useState<string>('AC_SEDAN');

  // Generated Plan & Optimization Data
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [availableHotels, setAvailableHotels] = useState<any[]>([]);
  const [availableActivities, setAvailableActivities] = useState<any[]>([]);
  const [days, setDays] = useState<ItineraryDayData[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<any>(null);
  const [optimization, setOptimization] = useState<any>(null);
  const [activeDayTab, setActiveDayTab] = useState<number>(1);

  // Editing state for activities
  const [editingSlot, setEditingSlot] = useState<{
    dayNumber: number;
    slot: 'morning' | 'afternoon' | 'evening';
    title: string;
    desc: string;
    cost: number;
  } | null>(null);

  const [isAddActivityOpen, setIsAddActivityOpen] = useState<boolean>(false);
  const [addDayTarget, setAddDayTarget] = useState<number>(1);

  // Execution states
  const [loading, setLoading] = useState<boolean>(false);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [bookingPending, setBookingPending] = useState<boolean>(false);
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  const [isLockedByConfirmedBooking, setIsLockedByConfirmedBooking] = useState<boolean>(false);

  // Load destinations on mount
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await destinationService.getAll(1, 50);
        const list = res.data?.data?.destinations || res.data?.data || [];
        setDestinations(list);

        // Find match for destinationName
        const match = list.find(
          (d: any) =>
            d.name.toLowerCase().includes(destinationName.toLowerCase()) ||
            d.slug.toLowerCase().includes(destinationName.toLowerCase())
        );
        if (match) {
          setSelectedDestId(match.id);
          setDestinationName(match.name);
        } else if (list.length > 0) {
          setSelectedDestId(list[0].id);
          setDestinationName(list[0].name);
        }
      } catch (err) {
        console.error('Failed to load destinations:', err);
      }
    };
    fetchDestinations();
  }, []);

  // When selectedDestId changes, load real hotels and activities inventory
  useEffect(() => {
    if (!selectedDestId) return;
    const fetchInventory = async () => {
      try {
        const [hRes, aRes] = await Promise.all([
          hotelService.getAll({ destinationId: selectedDestId }),
          activityService.getAll({ destinationId: selectedDestId }),
        ]);
        const hList = hRes.data?.data?.hotels || hRes.data?.data || [];
        const aList = aRes.data?.data?.activities || aRes.data?.data || [];
        setAvailableHotels(hList);
        setAvailableActivities(aList);
        if (!selectedHotel && hList.length > 0) {
          setSelectedHotel(hList[0]);
        }
      } catch (err) {
        console.error('Failed to load inventory for destination:', err);
      }
    };
    fetchInventory();
  }, [selectedDestId]);

  // Generate Itinerary
  const handleGenerate = async (forcedHotelId?: string) => {
    setLoading(true);
    setOptimization(null);
    try {
      const res = await itineraryIntelligenceService.generateItinerary({
        destinationId: selectedDestId,
        destinationName,
        numberOfDays,
        startDate,
        travelersCount,
        budget: userBudget,
        hotelId: forcedHotelId || selectedHotel?.id,
        travelStyle,
      });

      const data = res.data?.data;
      if (data) {
        setDays(data.days || []);
        setBudgetBreakdown(data.budget);
        if (data.selectedHotel) {
          setSelectedHotel(data.selectedHotel);
        }

        // Run budget optimization check in background
        checkOptimization(data.budget?.totalEstimatedExpenditure);
      }
      toast.success('Itinerary successfully generated with live inventory');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate itinerary');
    } finally {
      setLoading(false);
    }
  };

  // Run budget optimization check
  const checkOptimization = async (currentTotalCost?: number) => {
    const total = currentTotalCost || budgetBreakdown?.totalEstimatedExpenditure;
    if (total && total > userBudget) {
      setOptimizing(true);
      try {
        const optRes = await itineraryIntelligenceService.optimizeBudget({
          destinationId: selectedDestId,
          destinationName,
          numberOfDays,
          travelersCount,
          userBudget,
          currentHotelId: selectedHotel?.id,
          currentActivityIds: availableActivities.slice(0, 3).map((a) => a.id),
          travelStyle,
          startDate,
        });
        setOptimization(optRes.data?.data);
      } catch (err) {
        console.error('Optimization check error:', err);
      } finally {
        setOptimizing(false);
      }
    } else {
      setOptimization(null);
    }
  };

  // Trigger initial generation once destinationId is loaded
  useEffect(() => {
    if (selectedDestId && days.length === 0) {
      handleGenerate();
    }
  }, [selectedDestId]);

  // Apply AI Budget Optimization
  const handleApplyOptimization = () => {
    if (!optimization) return;

    if (optimization.suggestedAlternatives?.hotel?.suggested) {
      const suggestedHotel = availableHotels.find(
        (h) => h.id === optimization.suggestedAlternatives.hotel.suggested.id
      ) || {
        ...optimization.suggestedAlternatives.hotel.suggested,
        pricePerNight: optimization.suggestedAlternatives.hotel.suggested.nightlyRate,
      };
      setSelectedHotel(suggestedHotel);
    }

    if (optimization.optimizedItineraryDays && optimization.optimizedItineraryDays.length > 0) {
      setDays(optimization.optimizedItineraryDays);
    }

    if (optimization.recalculatedBudget) {
      setBudgetBreakdown(optimization.recalculatedBudget);
    }

    toast.success(
      `AI Budget Optimization Applied! Saved ₹${(optimization.totalSavings || 0).toLocaleString('en-IN')}`
    );
    setOptimization(null);
  };

  // Edit an activity slot
  const handleSaveActivitySlot = () => {
    if (!editingSlot) return;

    const updated = days.map((day) => {
      if (day.dayNumber === editingSlot.dayNumber) {
        const updatedSlot = {
          ...day[editingSlot.slot],
          activityTitle: editingSlot.title,
          attractionDescription: editingSlot.desc,
          estimatedCost: editingSlot.cost,
        };
        const newMorning = editingSlot.slot === 'morning' ? updatedSlot : day.morning;
        const newAfternoon = editingSlot.slot === 'afternoon' ? updatedSlot : day.afternoon;
        const newEvening = editingSlot.slot === 'evening' ? updatedSlot : day.evening;
        const newCost = newMorning.estimatedCost + newAfternoon.estimatedCost + newEvening.estimatedCost;

        return {
          ...day,
          [editingSlot.slot]: updatedSlot,
          estimatedDayCost: newCost,
        };
      }
      return day;
    });

    setDays(updated);
    setEditingSlot(null);
    recalculateLocalBudget(updated, selectedHotel, transportMode);
    toast.success('Activity updated successfully');
  };

  // Remove an activity from a day slot
  const handleRemoveActivity = (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening') => {
    if (isLockedByConfirmedBooking) {
      toast.error('Modification Blocked: Itinerary is locked to a confirmed booking.');
      return;
    }

    const updated = days.map((day) => {
      if (day.dayNumber === dayNumber) {
        const clearedSlot: ActivitySlot = {
          timeWindow: day[slot].timeWindow,
          activityTitle: 'Leisure & Self-Guided Relaxation',
          attractionDescription: 'Free time to explore local cafés, beachfront strolls, or rest.',
          travelTimeEstimate: '0 mins',
          estimatedCost: 0,
        };
        const newMorning = slot === 'morning' ? clearedSlot : day.morning;
        const newAfternoon = slot === 'afternoon' ? clearedSlot : day.afternoon;
        const newEvening = slot === 'evening' ? clearedSlot : day.evening;
        const newCost = newMorning.estimatedCost + newAfternoon.estimatedCost + newEvening.estimatedCost;

        return {
          ...day,
          [slot]: clearedSlot,
          estimatedDayCost: newCost,
        };
      }
      return day;
    });

    setDays(updated);
    recalculateLocalBudget(updated, selectedHotel, transportMode);
    toast.info('Activity cleared for free leisure');
  };

  // Add an inventory activity to a day slot
  const handleAddActivityToDay = (act: any, slot: 'morning' | 'afternoon' | 'evening') => {
    if (isLockedByConfirmedBooking) {
      toast.error('Modification Blocked: Itinerary is locked to a confirmed booking.');
      return;
    }

    const cost = Number(act.pricePerPerson || act.price || 0) * travelersCount;
    const updated = days.map((day) => {
      if (day.dayNumber === addDayTarget) {
        const newSlot: ActivitySlot = {
          timeWindow: slot === 'morning' ? '09:00 AM - 12:30 PM' : slot === 'afternoon' ? '01:30 PM - 04:30 PM' : '05:30 PM - 08:30 PM',
          activityTitle: act.title,
          attractionDescription: act.description,
          travelTimeEstimate: '20 mins via vehicle',
          estimatedCost: cost,
          activityId: act.id,
          category: act.category,
        };
        const newMorning = slot === 'morning' ? newSlot : day.morning;
        const newAfternoon = slot === 'afternoon' ? newSlot : day.afternoon;
        const newEvening = slot === 'evening' ? newSlot : day.evening;
        const newCost = newMorning.estimatedCost + newAfternoon.estimatedCost + newEvening.estimatedCost;

        return {
          ...day,
          [slot]: newSlot,
          estimatedDayCost: newCost,
        };
      }
      return day;
    });

    setDays(updated);
    setIsAddActivityOpen(false);
    recalculateLocalBudget(updated, selectedHotel, transportMode);
    toast.success(`Added "${act.title}" to Day ${addDayTarget}`);
  };

  // Recalculate Budget through backend service
  const recalculateLocalBudget = async (currentDays: ItineraryDayData[], hotel: any, tMode: string = transportMode) => {
    try {
      const activeActivities: any[] = [];
      currentDays.forEach((d) => {
        if (d.morning.activityId) activeActivities.push({ id: d.morning.activityId, title: d.morning.activityTitle, pricePerPerson: d.morning.estimatedCost / travelersCount });
        if (d.afternoon.activityId) activeActivities.push({ id: d.afternoon.activityId, title: d.afternoon.activityTitle, pricePerPerson: d.afternoon.estimatedCost / travelersCount });
        if (d.evening.activityId) activeActivities.push({ id: d.evening.activityId, title: d.evening.activityTitle, pricePerPerson: d.evening.estimatedCost / travelersCount });
      });

      const res = await itineraryIntelligenceService.calculateBudget({
        destinationName,
        numberOfDays,
        travelersCount,
        userBudget,
        selectedHotel: hotel,
        selectedActivities: activeActivities,
        travelStyle,
        transportMode: tMode,
      });

      setBudgetBreakdown(res.data?.data);
      checkOptimization(res.data?.data?.totalEstimatedExpenditure);
    } catch (err) {
      console.error('Recalculate budget error:', err);
    }
  };

  // Save Itinerary
  const handleSaveItinerary = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to save your customized itinerary');
      navigate('/login?redirect=/itinerary-planner');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        destinationId: selectedDestId,
        title: `${numberOfDays}-Day ${destinationName} Experience (${travelStyle})`,
        travelStyle,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(new Date(startDate).getTime() + 86400000 * numberOfDays).toISOString(),
        numberOfDays,
        travelersCount,
        budget: userBudget,
        totalEstimatedCost: budgetBreakdown?.totalEstimatedExpenditure || 0,
        days: days.map((d) => ({
          dayNumber: d.dayNumber,
          date: d.date ? new Date(d.date).toISOString() : undefined,
          title: d.title,
          description: `${d.morning.activityTitle} | ${d.afternoon.activityTitle} | ${d.evening.activityTitle}`,
          morning: d.morning,
          afternoon: d.afternoon,
          evening: d.evening,
          mealsIncluded: ['Breakfast', 'Lunch'],
          accommodationNotes: selectedHotel ? `Staying at ${selectedHotel.name}` : undefined,
          activitiesNotes: d.practicalTravelNotes,
          estimatedDayCost: d.estimatedDayCost,
        })),
      };

      if (savedItineraryId) {
        // Update existing with strict safety check
        await itineraryIntelligenceService.updateItinerary(savedItineraryId, payload);
        toast.success('Itinerary changes updated successfully!');
      } else {
        const res = await itineraryIntelligenceService.saveItinerary(payload);
        const newId = res.data?.data?.id;
        setSavedItineraryId(newId);
        toast.success('Itinerary saved to your traveler profile!');
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsLockedByConfirmedBooking(true);
        toast.error(
          'Modification Blocked: Itinerary is locked to a confirmed booking with PayPal escrow protection.'
        );
      } else {
        toast.error(err.response?.data?.error || 'Failed to save itinerary');
      }
    } finally {
      setSaving(false);
    }
  };

  // Prepare Booking with PayPal Escrow Protection
  const handlePrepareBooking = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to prepare your booking');
      navigate('/login?redirect=/itinerary-planner');
      return;
    }

    setBookingPending(true);
    try {
      // Ensure itinerary is saved first
      let itinId = savedItineraryId;
      if (!itinId) {
        const res = await itineraryIntelligenceService.saveItinerary({
          destinationId: selectedDestId,
          title: `${numberOfDays}-Day ${destinationName} Experience`,
          travelStyle,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(new Date(startDate).getTime() + 86400000 * numberOfDays).toISOString(),
          numberOfDays,
          travelersCount,
          budget: userBudget,
          totalEstimatedCost: budgetBreakdown?.totalEstimatedExpenditure || 0,
          days: days.map((d) => ({
            dayNumber: d.dayNumber,
            date: d.date ? new Date(d.date).toISOString() : undefined,
            title: d.title,
            description: `${d.morning.activityTitle} | ${d.afternoon.activityTitle} | ${d.evening.activityTitle}`,
            estimatedDayCost: d.estimatedDayCost,
          })),
        });
        itinId = res.data?.data?.id;
        setSavedItineraryId(itinId);
      }

      // Create Booking proposal in PENDING_PAYMENT state
      const bookingRes = await bookingService.create({
        itineraryId: itinId,
        totalAmount: budgetBreakdown?.totalEstimatedExpenditure || 25000,
        currency: 'INR',
        travelersCount,
        startDate: new Date(startDate),
        endDate: new Date(new Date(startDate).getTime() + 86400000 * numberOfDays),
        specialRequests: `Preferred transport: ${transportMode}. Travel style: ${travelStyle}.`,
      });

      const booking = bookingRes.data?.data;
      toast.success('Booking proposal prepared with PayPal Escrow protection!');
      navigate(`/traveler/booking-confirmation/${booking?.id || itinId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to initialize booking proposal');
    } finally {
      setBookingPending(false);
    }
  };

  // Budget calculations
  const totalCost = budgetBreakdown?.totalEstimatedExpenditure || 0;
  const isOverBudget = totalCost > userBudget;
  const budgetUtilization = userBudget > 0 ? Math.min(100, Math.round((totalCost / userBudget) * 100)) : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      {/* 1. Header Banner */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Phase 7 Intelligence
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Grounded in Database Inventory
              </span>
              {isLockedByConfirmedBooking && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lock className="w-3 h-3" /> Confirmed Booking Locked
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              AI Itinerary & <span className="text-gradient-cyan">Budget Intelligence</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Day-wise timeline with morning, afternoon, and evening slots, meal breaks, travel times, and real-time inventory budget optimization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleGenerate()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              Regenerate Itinerary
            </button>

            <button
              onClick={handleSaveItinerary}
              disabled={saving || isLockedByConfirmedBooking}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-cyan-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Bookmark className="w-4 h-4" />
              {saving ? 'Saving...' : savedItineraryId ? 'Update Itinerary' : 'Save Itinerary'}
            </button>

            <button
              onClick={handlePrepareBooking}
              disabled={bookingPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              {bookingPending ? 'Preparing...' : 'Prepare Booking Proposal'}
            </button>
          </div>
        </div>

        {/* 2. Planning Controls Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          {/* Destination */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Destination
            </label>
            <select
              value={selectedDestId}
              onChange={(e) => {
                setSelectedDestId(e.target.value);
                const d = destinations.find((item) => item.id === e.target.value);
                if (d) setDestinationName(d.name);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.state || d.country})
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Duration
            </label>
            <select
              value={numberOfDays}
              onChange={(e) => setNumberOfDays(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={3}>3 Days (Weekend Escape)</option>
              <option value={4}>4 Days</option>
              <option value={5}>5 Days (Classic Tour)</option>
              <option value={7}>7 Days (Full Circuit)</option>
              <option value={10}>10 Days (Grand Odyssey)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Travelers */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Travelers
            </label>
            <select
              value={travelersCount}
              onChange={(e) => setTravelersCount(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={1}>1 Solo Explorer</option>
              <option value={2}>2 Travelers (1 Room)</option>
              <option value={3}>3 Travelers (2 Rooms)</option>
              <option value={4}>4 Travelers (2 Rooms)</option>
              <option value={6}>6 Travelers (3 Rooms)</option>
            </select>
          </div>

          {/* Target Budget */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Target Budget (₹)
            </label>
            <input
              type="number"
              step={1000}
              value={userBudget}
              onChange={(e) => setUserBudget(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Travel Style */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Travel Style
            </label>
            <select
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="BUDGET">Budget Conscious</option>
              <option value="COMFORT">Comfort & Balanced</option>
              <option value="LUXURY">Luxury Sanctuary</option>
            </select>
          </div>

          {/* Dedicated Transport */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Transport
            </label>
            <select
              value={transportMode}
              onChange={(e) => {
                const newMode = e.target.value;
                setTransportMode(newMode);
                recalculateLocalBudget(days, selectedHotel, newMode);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="AC_SEDAN">AC Sedan</option>
              <option value="AC_INNOVA">AC Innova SUV</option>
              <option value="LUXURY_SUV">Luxury SUV</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Budget Intelligence Alert / Optimization Banner */}
      {isOverBudget && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-amber-950/30 to-slate-900 border border-amber-500/30 relative overflow-hidden shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-bold text-amber-300">
                    Budget Intelligence Alert: Plan Exceeds Target by ₹
                    {(totalCost - userBudget).toLocaleString('en-IN')}
                  </h3>
                </div>

                {optimizing ? (
                  <p className="text-xs text-cyan-300 animate-pulse">
                    Analyzing database alternatives to optimize accommodation and activity cost drivers...
                  </p>
                ) : optimization ? (
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {optimization.explanation}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Plan exceeds target. Click optimize or adjust itinerary below.
                  </p>
                )}

                {optimization?.expensiveComponents && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {optimization.expensiveComponents.map((comp: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-[11px] bg-slate-900/90 border border-amber-500/30 text-amber-200 flex items-center gap-1.5"
                      >
                        <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                        <strong>{comp.itemTitle}</strong>: ₹{comp.originalCost.toLocaleString('en-IN')} (
                        {comp.percentageOfTotal}% of total)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {optimization && optimization.totalSavings > 0 && (
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <div className="text-right sm:text-right w-full sm:w-auto">
                    <div className="text-[11px] text-slate-400 font-medium">Estimated AI Savings</div>
                    <div className="text-xl font-black text-emerald-400">
                      ₹{optimization.totalSavings.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <button
                    onClick={handleApplyOptimization}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Apply AI Optimization
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Two-Column Layout (Timeline & Sticky Budget Panel) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Day-wise Timeline & Hotel Information (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hotel Information Card */}
          {selectedHotel && (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Hotel className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedHotel.name}</h3>
                    <p className="text-xs text-slate-400">
                      {selectedHotel.address}, {selectedHotel.city} • {'★'.repeat(selectedHotel.stars || 4)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Nightly Rate</div>
                    <div className="text-base font-black text-cyan-300">
                      ₹{Number(selectedHotel.pricePerNight).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {availableHotels.length > 1 && (
                    <select
                      value={selectedHotel.id}
                      onChange={(e) => {
                        const h = availableHotels.find((item) => item.id === e.target.value);
                        if (h) {
                          setSelectedHotel(h);
                          recalculateLocalBudget(days, h);
                        }
                      }}
                      className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500"
                    >
                      {availableHotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          Change: {h.name} (₹{Number(h.pricePerNight).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {selectedHotel.amenities && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                  {selectedHotel.amenities.slice(0, 6).map((am: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-300"
                    >
                      {am}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Day Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {days.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setActiveDayTab(day.dayNumber)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeDayTab === day.dayNumber
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/25'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                Day {day.dayNumber} • {day.dayOfWeek ? day.dayOfWeek.slice(0, 3) : ''}
              </button>
            ))}
          </div>

          {/* Active Day Schedule Card */}
          {days
            .filter((d) => d.dayNumber === activeDayTab)
            .map((day) => (
              <div
                key={day.dayNumber}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl relative"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
                  <div>
                    <div className="text-xs font-semibold text-cyan-400">
                      Day {day.dayNumber} — {day.date} ({day.dayOfWeek})
                    </div>
                    <h2 className="text-xl font-bold text-white mt-0.5">{day.title}</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Estimated Day Cost:</span>
                    <span className="text-base font-black text-cyan-300">
                      ₹{day.estimatedDayCost.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => {
                        setAddDayTarget(day.dayNumber);
                        setIsAddActivityOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Excursion
                    </button>
                  </div>
                </div>

                {/* Slots: Morning, Afternoon, Evening */}
                <div className="space-y-4">
                  {/* MORNING SLOT */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Morning • {day.morning.timeWindow}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Car className="w-3 h-3 text-cyan-400" /> {day.morning.travelTimeEstimate}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{day.morning.activityTitle}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {day.morning.attractionDescription}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-200">
                          ₹{day.morning.estimatedCost.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() =>
                              setEditingSlot({
                                dayNumber: day.dayNumber,
                                slot: 'morning',
                                title: day.morning.activityTitle,
                                desc: day.morning.attractionDescription,
                                cost: day.morning.estimatedCost,
                              })
                            }
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                            title="Edit Activity"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveActivity(day.dayNumber, 'morning')}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                            title="Clear Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LUNCH BREAK */}
                  <div className="px-4 py-2.5 rounded-lg bg-slate-900/50 border border-dashed border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                    <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-semibold text-slate-400">Lunch Break:</span>
                    <span>{day.suggestedMealBreaks?.lunch || 'Local café or beach shack recommendations'}</span>
                  </div>

                  {/* AFTERNOON SLOT */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            Afternoon • {day.afternoon.timeWindow}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Car className="w-3 h-3 text-cyan-400" /> {day.afternoon.travelTimeEstimate}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{day.afternoon.activityTitle}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {day.afternoon.attractionDescription}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-200">
                          ₹{day.afternoon.estimatedCost.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() =>
                              setEditingSlot({
                                dayNumber: day.dayNumber,
                                slot: 'afternoon',
                                title: day.afternoon.activityTitle,
                                desc: day.afternoon.attractionDescription,
                                cost: day.afternoon.estimatedCost,
                              })
                            }
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                            title="Edit Activity"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveActivity(day.dayNumber, 'afternoon')}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                            title="Clear Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EVENING SLOT */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            Evening • {day.evening.timeWindow}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Car className="w-3 h-3 text-cyan-400" /> {day.evening.travelTimeEstimate}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{day.evening.activityTitle}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {day.evening.attractionDescription}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-200">
                          ₹{day.evening.estimatedCost.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() =>
                              setEditingSlot({
                                dayNumber: day.dayNumber,
                                slot: 'evening',
                                title: day.evening.activityTitle,
                                desc: day.evening.attractionDescription,
                                cost: day.evening.estimatedCost,
                              })
                            }
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                            title="Edit Activity"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveActivity(day.dayNumber, 'evening')}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                            title="Clear Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DINNER BREAK */}
                  <div className="px-4 py-2.5 rounded-lg bg-slate-900/50 border border-dashed border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                    <Utensils className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-slate-400">Dinner Suggestion:</span>
                    <span>{day.suggestedMealBreaks?.dinner || 'Sunset seafood dinner & live Goan music'}</span>
                  </div>

                  {/* PRACTICAL TRAVEL NOTES */}
                  <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-200/90 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-cyan-300">Practical Travel Note: </strong>
                      {day.practicalTravelNotes}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Right Column: Live Sticky Budget Intelligence Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Budget Progress Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Budget Intelligence
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    isOverBudget
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isOverBudget ? 'Exceeded' : 'Within Target'}
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-2xl font-black text-white">
                    ₹{totalCost.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Target: ₹{userBudget.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOverBudget
                        ? 'bg-red-500'
                        : budgetUtilization > 85
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                    }`}
                    style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Per Person: ₹{(budgetBreakdown?.perPersonExpenditure || Math.round(totalCost / travelersCount)).toLocaleString('en-IN')}</span>
                  <span className={budgetBreakdown?.remainingBudget < 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {budgetBreakdown?.remainingBudget < 0 ? 'Deficit: ' : 'Surplus: '}₹{Math.abs(budgetBreakdown?.remainingBudget || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Itemized Breakdown */}
              <div className="pt-4 border-t border-slate-800 space-y-3 text-xs">
                {/* Accommodation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Hotel className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Accommodation ({budgetBreakdown?.accommodation?.nights || numberOfDays - 1} nights)</span>
                  </div>
                  <span className="font-bold text-slate-100">
                    ₹{(budgetBreakdown?.accommodation?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pl-5 -mt-2">
                  {budgetBreakdown?.accommodation?.assumptions}
                </div>

                {/* Activities */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Compass className="w-3.5 h-3.5 text-teal-400" />
                    <span>Curated Activities ({budgetBreakdown?.activities?.itemsCount || 0})</span>
                  </div>
                  <span className="font-bold text-slate-100">
                    ₹{(budgetBreakdown?.activities?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Transportation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Car className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Transport ({transportMode})</span>
                  </div>
                  <span className="font-bold text-slate-100">
                    ₹{(budgetBreakdown?.transportation?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Meals & Dining */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    <span>Estimated Meals & Dining</span>
                  </div>
                  <span className="font-bold text-slate-100">
                    ₹{(budgetBreakdown?.mealsAndDining?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Other Services */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    <span>Permits & Local Guide</span>
                  </div>
                  <span className="font-bold text-slate-100">
                    ₹{(budgetBreakdown?.otherServices?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Taxes & Fees (5% GST) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Taxes & Fees (5% GST)</span>
                  </div>
                  <span className="font-bold text-slate-300">
                    ₹{(budgetBreakdown?.taxesAndFees?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={handlePrepareBooking}
                  disabled={bookingPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Proceed to Escrow Booking
                </button>
              </div>
            </div>

            {/* AI Safety Invariant Guard Notice */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Shield className="w-4 h-4" /> PayPal Escrow Security Guarantee
              </div>
              <p className="text-[11px] leading-relaxed">
                Confirmed bookings are held in escrow. AI cannot autonomously alter confirmed booking prices or reservations without traveler authorization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Edit Activity Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Edit Day {editingSlot.dayNumber} ({editingSlot.slot.toUpperCase()}) Activity
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Activity Title
              </label>
              <input
                type="text"
                value={editingSlot.title}
                onChange={(e) => setEditingSlot({ ...editingSlot, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Attraction Description
              </label>
              <textarea
                rows={3}
                value={editingSlot.desc}
                onChange={(e) => setEditingSlot({ ...editingSlot, desc: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Estimated Cost (₹)
              </label>
              <input
                type="number"
                value={editingSlot.cost}
                onChange={(e) => setEditingSlot({ ...editingSlot, cost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingSlot(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveActivitySlot}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Activity from Inventory Modal */}
      {isAddActivityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                Add Excursion to Day {addDayTarget}
              </h3>
              <button
                onClick={() => setIsAddActivityOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select verified excursions from {destinationName} database inventory:
            </p>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {availableActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {act.category} • {Number(act.durationHours || 4)} hrs
                    </span>
                    <h4 className="text-sm font-bold text-white">{act.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{act.description}</p>
                    <div className="text-xs font-bold text-cyan-300">
                      ₹{Number(act.pricePerPerson || act.price).toLocaleString('en-IN')} / person
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAddActivityToDay(act, 'morning')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-semibold"
                    >
                      + Morning
                    </button>
                    <button
                      onClick={() => handleAddActivityToDay(act, 'afternoon')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-semibold"
                    >
                      + Afternoon
                    </button>
                    <button
                      onClick={() => handleAddActivityToDay(act, 'evening')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-semibold"
                    >
                      + Evening
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDashboard;
