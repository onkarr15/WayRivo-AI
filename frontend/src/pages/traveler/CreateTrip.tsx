import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tripRequestService, matchingService } from '../../services';
import {
  MapPin,
  Calendar,
  DollarSign,
  Hotel,
  Car,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Users,
  ShieldCheck,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';

const wizardSteps = [
  { id: 0, title: 'Destination', subtitle: 'Where to?' },
  { id: 1, title: 'Dates', subtitle: 'When?' },
  { id: 2, title: 'Travelers', subtitle: 'Who?' },
  { id: 3, title: 'Budget', subtitle: 'How much?' },
  { id: 4, title: 'Style', subtitle: 'Vibe?' },
  { id: 5, title: 'Passions', subtitle: 'What you love' },
  { id: 6, title: 'Requirements', subtitle: 'Special notes' },
  { id: 7, title: 'Review', subtitle: 'Confirm details' },
];

const popularDestinations = ['Kerala', 'Goa', 'Rajasthan', 'Manali', 'Ladakh', 'Andaman Islands', 'Meghalaya', 'Varanasi', 'Kashmir', 'Coorg'];
const budgetPresets = [
  { label: '₹20K - ₹40K', value: 30000, desc: 'Budget friendly' },
  { label: '₹40K - ₹70K', value: 60000, desc: 'Comfort & 4★' },
  { label: '₹70K - ₹1.2L', value: 95000, desc: 'Premium luxury' },
  { label: '₹1.2L+', value: 150000, desc: 'Ultimate bespoke' },
];

const travelStyles = [
  { name: 'Family Retreat', icon: '👨‍👩‍👧‍👦', desc: 'Kid friendly, relaxed pace, comfortable resorts' },
  { name: 'Romantic & Honeymoon', icon: '✨', desc: 'Candlelight dinners, scenic privacy, boutique stays' },
  { name: 'Adventure & Wildlife', icon: '🧗', desc: 'Safaris, trekking, rafting & exploration' },
  { name: 'Luxury Heritage', icon: '👑', desc: 'Palace stays, private chauffeurs, 5-star hospitality' },
  { name: 'Wellness & Ayurveda', icon: '🌿', desc: 'Rejuvenation, yoga, organic cuisine & spa' },
  { name: 'Beach & Coastal', icon: '🏖️', desc: 'Sunsets, watersports, oceanfront cottages' },
];

const interestOptions = [
  { label: 'Backwaters', icon: '🛶' },
  { label: 'Tea & Coffee Estates', icon: '☕' },
  { label: 'Wildlife Safari', icon: '🐘' },
  { label: 'Historical Forts', icon: '🏰' },
  { label: 'Culinary & Street Food', icon: '🍛' },
  { label: 'Beaches & Watersports', icon: '🏄' },
  { label: 'Ayurvedic Spa', icon: '💆' },
  { label: 'Photography & Sunsets', icon: '📸' },
  { label: 'Trekking & Hiking', icon: '🥾' },
  { label: 'Spiritual Temples', icon: '🛕' },
];

const accommodations = ['3-Star Comfort', '4-Star Premium Resort', '5-Star Luxury Palace', 'Authentic Houseboat', 'Heritage Homestay'];
const transports = ['Private AC Innova/Cab', 'Chauffeured Luxury Sedan', 'Self-Drive SUV', 'Flight + Local Transfers'];

const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destinationParam = searchParams.get('destination') || '';
  const fromLocationParam = searchParams.get('fromLocation') || '';
  const startDateParam = searchParams.get('startDate') || '';
  const travelersCountParam = parseInt(searchParams.get('travelersCount') || '2', 10) || 2;
  const budgetParam = searchParams.get('budget') || '60000';
  const preferenceParam = searchParams.get('preference') || 'Family Retreat';

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedTripId, setSubmittedTripId] = useState<number | null>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);

  const [form, setForm] = useState({
    fromLocation: fromLocationParam,
    destination: destinationParam,
    startDate: startDateParam,
    endDate: '',
    numberOfDays: 5,
    travelersCount: travelersCountParam,
    travelType: travelersCountParam > 2 ? 'Family' : travelersCountParam === 2 ? 'Couple' : 'Solo',
    budget: budgetParam,
    currency: 'INR',
    travelStyle: preferenceParam,
    accommodationPreference: '4-Star Premium Resort',
    transportPreference: 'Private AC Innova/Cab',
    interests: ['Backwaters', 'Tea & Coffee Estates', 'Ayurvedic Spa'] as string[],
    specialRequirements: '',
  });


  // Fetch live AI suggestions when destination / style changes
  useEffect(() => {
    if (form.destination && form.destination.length >= 3) {
      matchingService.getAiInsights(form.destination, form.travelStyle, form.numberOfDays)
        .then(res => {
          if (res.data?.success) {
            setAiInsights(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [form.destination, form.travelStyle, form.numberOfDays]);

  const update = (field: string, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'startDate' || field === 'endDate') {
        if (updated.startDate && updated.endDate) {
          const diff = Math.ceil((new Date(updated.endDate).getTime() - new Date(updated.startDate).getTime()) / 86400000);
          updated.numberOfDays = diff > 0 ? diff : 1;
        }
      }
      return updated;
    });
  };

  const toggleInterest = (label: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(label)
        ? prev.interests.filter(i => i !== label)
        : [...prev.interests, label],
    }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.destination) { setError('Please specify your destination'); setStep(0); return; }
    if (!form.budget) { setError('Please specify a target budget'); setStep(3); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        budget: parseFloat(form.budget),
        interests: form.interests.join(', '),
        numberOfDays: form.numberOfDays || 5,
      };
      const res = await tripRequestService.create(payload);
      if (res.data?.success && res.data?.data?.id) {
        setSubmittedTripId(res.data.data.id);
      } else {
        setError(res.data?.message || 'Failed to create trip request');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create trip request');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return form.destination.trim().length > 0;
    if (step === 3) return Number(form.budget) > 0;
    return true;
  };

  // STEP 9: Success state
  if (submittedTripId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4 animate-in fade-in">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-orange/10 text-orange mb-3">
          <Sparkles className="w-3.5 h-3.5" /> LIVE IN MARKETPLACE
        </span>
        <h1 className="text-3xl font-bold text-navy mb-3">Your trip request is live! ✈️</h1>
        <p className="text-lg text-text-light max-w-lg mx-auto mb-8">
          WayRivo is currently matching verified travel specialists for <span className="font-semibold text-navy">{form.destination}</span>. You will receive customized competitive proposals directly in your inbox.
        </p>

        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm mb-8 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm text-text-light">Destination</span>
            <span className="text-sm font-bold text-navy">{form.destination}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm text-text-light">Duration & Group</span>
            <span className="text-sm font-medium text-text">{form.numberOfDays} Days • {form.travelersCount} Travelers ({form.travelType})</span>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm text-text-light">Target Budget</span>
            <span className="text-sm font-bold text-emerald-600">₹{Number(form.budget).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-light">Matching Status</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" /> Dispatching to Verified Agents
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => navigate(`/traveler/requests/${submittedTripId}`)} className="btn-primary w-full sm:w-auto px-8">
            View Request Details & Proposals
          </button>
          <button onClick={() => navigate('/traveler/dashboard')} className="btn-secondary w-full sm:w-auto px-6">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-orange/10 text-orange mb-2">
          <Compass className="w-3.5 h-3.5" /> BESPOKE TRIP PLANNER
        </span>
        <h1 className="text-3xl font-bold text-navy mb-1">Create Your Custom Trip</h1>
        <p className="text-text-light text-sm max-w-lg mx-auto">
          Tell us what you want, your budget, and what you love. Verified specialists will craft tailored itineraries for you.
        </p>
      </div>

      {/* 8-Step Wizard Bar */}
      <div className="bg-white border border-border rounded-2xl p-3 sm:p-4 mb-8 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[620px] gap-2">
          {wizardSteps.map((ws, i) => (
            <React.Fragment key={ws.id}>
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  i === step
                    ? 'bg-orange text-white shadow-xs'
                    : i < step
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                    : 'text-text-light opacity-60 cursor-not-allowed'
                }`}
              >
                {i < step ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${i === step ? 'bg-white text-orange font-bold' : 'border border-gray-300'}`}>
                    {i + 1}
                  </span>
                )}
                <span>{ws.title}</span>
              </button>
              {i < wizardSteps.length - 1 && (
                <div className={`flex-1 h-0.5 min-w-[12px] ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-danger text-sm px-4 py-3 rounded-xl mb-6 border border-red-200 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Main Step Container */}
      <div className="card p-6 sm:p-10 shadow-sm border border-border">
        {/* STEP 1: Destination & Departure */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold">1</div>
              <div>
                <h2 className="text-xl font-bold text-navy">Where are you going?</h2>
                <p className="text-xs text-text-light">Select your dream destination and departure location</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Destination *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-orange" />
                  <input
                    className="input pl-10"
                    value={form.destination}
                    onChange={e => update('destination', e.target.value)}
                    placeholder="e.g. Kerala, Goa, Rajasthan, Ladakh..."
                  />
                </div>
              </div>
              <div>
                <label className="label">Departing From (City)</label>
                <input
                  className="input"
                  value={form.fromLocation}
                  onChange={e => update('fromLocation', e.target.value)}
                  placeholder="e.g. Mumbai, Delhi, Bangalore..."
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-text-light mb-2">Popular Trending Destinations:</p>
              <div className="flex flex-wrap gap-2">
                {popularDestinations.map(dest => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => update('destination', dest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      form.destination === dest
                        ? 'bg-navy text-white shadow-xs'
                        : 'bg-bg text-text hover:bg-gray-200'
                    }`}
                  >
                    📍 {dest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Dates & Duration */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold">2</div>
              <div>
                <h2 className="text-xl font-bold text-navy">When are you traveling?</h2>
                <p className="text-xs text-text-light">Pick tentative dates or specify trip length</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-orange" />
                  <input
                    type="date"
                    className="input pl-10"
                    value={form.startDate}
                    onChange={e => update('startDate', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-orange" />
                  <input
                    type="date"
                    className="input pl-10"
                    value={form.endDate}
                    onChange={e => update('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange/5 border border-orange/15 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-text-light">Estimated Trip Duration</span>
                <p className="text-lg font-bold text-navy">{form.numberOfDays} Days / {Math.max(1, form.numberOfDays - 1)} Nights</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => update('numberOfDays', Math.max(1, form.numberOfDays - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-border font-bold text-navy hover:bg-gray-100"
                >
                  -
                </button>
                <span className="font-bold text-navy px-2">{form.numberOfDays}</span>
                <button
                  type="button"
                  onClick={() => update('numberOfDays', form.numberOfDays + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-border font-bold text-navy hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Travelers & Group */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold">3</div>
              <div>
                <h2 className="text-xl font-bold text-navy">Who is traveling?</h2>
                <p className="text-xs text-text-light">Group composition helps experts tailor hotel rooms and vehicles</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Total Travelers Count</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-orange" />
                  <input
                    type="number"
                    min="1"
                    className="input pl-10"
                    value={form.travelersCount}
                    onChange={e => update('travelersCount', Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Group Type</label>
                <select
                  className="input"
                  value={form.travelType}
                  onChange={e => update('travelType', e.target.value)}
                >
                  {['Family', 'Couple', 'Friends / Group', 'Solo Traveler', 'Corporate / Business'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Budget */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold">4</div>
              <div>
                <h2 className="text-xl font-bold text-navy">What is your total budget?</h2>
                <p className="text-xs text-text-light">Total expected spend for all travelers (excluding international flights if applicable)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Total Budget Amount (₹) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-orange" />
                  <input
                    type="number"
                    className="input pl-10 text-lg font-bold text-navy"
                    value={form.budget}
                    onChange={e => update('budget', e.target.value)}
                    placeholder="60000"
                  />
                </div>
                {Number(form.budget) > 0 && form.travelersCount > 1 && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    ≈ ₹{Math.round(Number(form.budget) / form.travelersCount).toLocaleString()} per person
                  </p>
                )}
              </div>
              <div>
                <label className="label">Currency</label>
                <select className="input" value={form.currency} onChange={e => update('currency', e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-text-light mb-2">Budget Presets:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {budgetPresets.map(b => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => update('budget', b.value.toString())}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      Number(form.budget) === b.value
                        ? 'border-orange bg-orange/5 ring-2 ring-orange/20'
                        : 'border-border bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-navy block">{b.label}</span>
                    <span className="text-[11px] text-text-light block mt-0.5">{b.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Travel Style & Theme */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold">5</div>
              <div>
                <h2 className="text-xl font-bold text-navy">What kind of trip do you want?</h2>
                <p className="text-xs text-text-light">Select the overall vibe and pace of your journey</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {travelStyles.map(st => (
                <button
                  key={st.name}
                  type="button"
                  onClick={() => update('travelStyle', st.name)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    form.travelStyle === st.name
                      ? 'border-orange bg-orange/5 ring-2 ring-orange/20 shadow-xs'
                      : 'border-border bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{st.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-navy">{st.name}</h3>
                    <p className="text-xs text-text-light mt-0.5">{st.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Passions & Interests */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold">6</div>
              <div>
                <h2 className="text-xl font-bold text-navy">What do you love?</h2>
                <p className="text-xs text-text-light">Select all activities and experiences that excite you</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {interestOptions.map(int => {
                const isSelected = form.interests.includes(int.label);
                return (
                  <button
                    key={int.label}
                    type="button"
                    onClick={() => toggleInterest(int.label)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-orange bg-orange/10 text-navy font-bold shadow-xs'
                        : 'border-border bg-white text-text hover:border-gray-300'
                    }`}
                  >
                    <span>{int.icon}</span>
                    <span className="text-xs">{int.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-orange ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 7: Special Requirements & Logistics */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold">7</div>
              <div>
                <h2 className="text-xl font-bold text-navy">Special requirements & preferences</h2>
                <p className="text-xs text-text-light">Help specialists cater to your exact comfort needs</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-2"><Hotel className="w-4 h-4 text-orange" /> Accommodation Preference</label>
                <div className="flex flex-wrap gap-2">
                  {accommodations.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => update('accommodationPreference', a)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.accommodationPreference === a
                          ? 'bg-navy text-white shadow-xs'
                          : 'bg-bg text-text hover:bg-gray-200'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2"><Car className="w-4 h-4 text-orange" /> Transport Preference</label>
                <div className="flex flex-wrap gap-2">
                  {transports.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update('transportPreference', t)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.transportPreference === t
                          ? 'bg-navy text-white shadow-xs'
                          : 'bg-bg text-text hover:bg-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Specific Requests (Dietary, Accessibility, Occasion)</label>
                <textarea
                  className="input min-h-[90px]"
                  value={form.specialRequirements}
                  onChange={e => update('specialRequirements', e.target.value)}
                  placeholder="e.g. Vegetarian meals only, candlelight dinner on houseboat, wheelchair accessible transport, celebrating 10th anniversary..."
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Review & AI Insights */}
        {step === 7 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-bold">8</div>
              <div>
                <h2 className="text-xl font-bold text-navy">Review your trip request</h2>
                <p className="text-xs text-text-light">Check details before dispatching to verified specialists</p>
              </div>
            </div>

            {/* AI Insights Card */}
            {aiInsights && (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4.5">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span>WAYRIVO SMART ADVICE FOR {form.destination.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-blue-950">
                  <div>
                    <span className="font-bold block mb-1">Recommended Highlights:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-900">
                      {aiInsights.highlights?.slice(0, 3).map((h: string) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold block mb-1">Recommended Packing:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-900">
                      {aiInsights.packingTips?.slice(0, 3).map((p: string) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Destination', form.destination],
                ['From Location', form.fromLocation || 'Flexible'],
                ['Dates', form.startDate && form.endDate ? `${form.startDate} to ${form.endDate}` : 'Flexible'],
                ['Duration', `${form.numberOfDays} Days`],
                ['Travelers', `${form.travelersCount} (${form.travelType})`],
                ['Target Budget', `₹${Number(form.budget).toLocaleString()}`],
                ['Travel Style', form.travelStyle],
                ['Accommodation', form.accommodationPreference],
                ['Transport', form.transportPreference],
              ].map(([lbl, val]) => (
                <div key={lbl} className="p-3 bg-bg rounded-xl">
                  <span className="text-[11px] text-text-light uppercase font-semibold block">{lbl}</span>
                  <span className="text-xs font-bold text-navy mt-0.5 block">{val}</span>
                </div>
              ))}
            </div>

            {form.interests.length > 0 && (
              <div className="p-3 bg-bg rounded-xl">
                <span className="text-[11px] text-text-light uppercase font-semibold block mb-1">Selected Passions</span>
                <div className="flex flex-wrap gap-1.5">
                  {form.interests.map(i => (
                    <span key={i} className="text-xs bg-white border border-border px-2.5 py-0.5 rounded-md font-medium text-navy">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {form.specialRequirements && (
              <div className="p-3 bg-bg rounded-xl">
                <span className="text-[11px] text-text-light uppercase font-semibold block">Special Requests</span>
                <p className="text-xs text-text mt-0.5">{form.specialRequirements}</p>
              </div>
            )}

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-900">
                <span className="font-bold">100% Free & Zero Obligation:</span> You will receive multiple detailed proposals with day-by-day itineraries, transparent hotel tiers, and pricing.
              </p>
            </div>
          </div>
        )}

        {/* Wizard Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className={`btn-ghost ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < 7 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary px-6"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary px-8"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Dispatch Trip Request
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
