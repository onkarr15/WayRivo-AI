import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tripRequestService, proposalService, matchingService } from '../../services';
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Star,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  Briefcase
} from 'lucide-react';

const lifecycleStages = [
  { key: 'CREATED', label: 'Request Created', desc: 'Trip submitted to marketplace' },
  { key: 'MATCHED', label: 'Experts Matched', desc: 'Dispatched to specialists' },
  { key: 'PROPOSALS', label: 'Proposals Received', desc: 'Bespoke itineraries crafted' },
  { key: 'SELECTED', label: 'Proposal Selected', desc: 'Traveler selected specialist' },
  { key: 'BOOKED', label: 'Booked & Escrowed', desc: 'Deposit confirmed' },
  { key: 'COMPLETED', label: 'Trip Completed', desc: 'Travel finished & reviewed' },
];

const RequestDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [matchedExperts, setMatchedExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(null);
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    try {
      const [reqRes, propRes] = await Promise.all([
        tripRequestService.getById(Number(id)),
        proposalService.getForRequest(Number(id)),
      ]);
      setRequest(reqRes.data?.data);
      setProposals(propRes.data?.data || []);

      // Fetch matched specialists
      matchingService.getMatchedExperts(Number(id))
        .then(res => {
          if (res.data?.success) setMatchedExperts(res.data.data);
        })
        .catch(() => {});
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelect = async (proposalId: number) => {
    if (!confirm('Confirm selection of this bespoke proposal? Other proposals will be automatically declined and your booking will be created.')) return;
    setSelecting(proposalId);
    try {
      const res = await proposalService.select(proposalId);
      if (res.data?.success) {
        navigate(`/traveler/booking-confirmation/${res.data.data.id}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to select proposal');
    } finally {
      setSelecting(null);
    }
  };

  const getCurrentStageIndex = () => {
    if (!request) return 0;
    if (request.status === 'COMPLETED') return 5;
    if (request.status === 'BOOKED' || request.status === 'CONFIRMED') return 4;
    if (request.status === 'PROPOSAL_SELECTED' || proposals.some((p: any) => p.status === 'SELECTED')) return 3;
    if (proposals.length > 0) return 2;
    if (matchedExperts.length > 0) return 1;
    return 0;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!request) return (
    <div className="card p-8 text-center">
      <p className="text-text-light">Trip request not found</p>
    </div>
  );

  const currentStage = getCurrentStageIndex();

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange uppercase tracking-wider">REQUEST #{request.id}</span>
            <span className="text-xs text-text-light">•</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {request.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-navy">Trip to {request.destination}</h1>
        </div>
        {proposals.length > 1 && (
          <Link to={`/traveler/compare/${id}`} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
            <Award className="w-4 h-4" /> Compare {proposals.length} Proposals Matrix
          </Link>
        )}
      </div>

      {/* Visual Timeline Bar */}
      <div className="bg-white border border-border rounded-2xl p-5 mb-8 shadow-xs overflow-x-auto">
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-orange" /> Request Journey Status
        </h3>
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {lifecycleStages.map((st, i) => {
            const isDone = i <= currentStage;
            const isCurrent = i === currentStage;
            return (
              <React.Fragment key={st.key}>
                <div className="flex flex-col items-center text-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-orange text-white ring-4 ring-orange/20 shadow-xs'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-text-light'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[11px] font-bold mt-2 ${isCurrent ? 'text-orange' : isDone ? 'text-navy' : 'text-text-light'}`}>
                    {st.label}
                  </span>
                  <span className="text-[10px] text-text-light max-w-[90px] leading-tight mt-0.5">{st.desc}</span>
                </div>
                {i < lifecycleStages.length - 1 && (
                  <div className={`h-0.5 flex-1 min-w-[20px] mb-6 ${i < currentStage ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Trip Details Grid */}
      <div className="card p-6 mb-8 shadow-xs border border-border">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-orange" /> Trip Specifications
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            [MapPin, 'Origin', request.fromLocation || 'Flexible'],
            [MapPin, 'Destination', request.destination],
            [Calendar, 'Dates', request.startDate ? `${request.startDate} to ${request.endDate}` : 'Flexible'],
            [Clock, 'Duration', `${request.numberOfDays || 5} Days`],
            [Users, 'Travelers', `${request.travelersCount} (${request.travelType})`],
            [DollarSign, 'Target Budget', `₹${Number(request.budget).toLocaleString()}`],
          ].map(([Icon, label, value]: any) => (
            <div key={label} className="p-3 bg-bg rounded-xl">
              <div className="flex items-center gap-1.5 text-text-light mb-1">
                <Icon className="w-3.5 h-3.5 text-orange" />
                <span className="text-[11px] uppercase font-semibold">{label}</span>
              </div>
              <p className="text-xs font-bold text-navy truncate">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-light font-semibold mr-1">Preferences:</span>
          {request.travelStyle && <span className="badge-info text-xs">{request.travelStyle}</span>}
          {request.accommodationPreference && <span className="badge-neutral text-xs">{request.accommodationPreference}</span>}
          {request.transportPreference && <span className="badge-neutral text-xs">{request.transportPreference}</span>}
          {request.interests?.split(',').map((i: string) => (
            <span key={i} className="badge-neutral text-xs">{i.trim()}</span>
          ))}
        </div>

        {request.specialRequirements && (
          <div className="mt-3 p-3 bg-orange/5 border border-orange/15 rounded-xl text-xs text-text">
            <span className="font-bold text-navy">Special Requests: </span>
            {request.specialRequirements}
          </div>
        )}
      </div>

      {/* Matched Specialists Discovery Panel */}
      {matchedExperts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange" /> Intelligent Expert Matching
              </h2>
              <p className="text-xs text-text-light">
                WayRivo scored verified specialists specifically for your {request.destination} trip
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
              {matchedExperts.length} Verified Specialists
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {matchedExperts.map((exp: any) => (
              <div key={exp.expertId} className="card p-4 border border-border hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-sm">
                      {exp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Link to={`/experts/${exp.expertId}`} className="text-sm font-bold text-navy hover:text-orange">
                          {exp.name}
                        </Link>
                        {exp.verificationStatus === 'VERIFIED' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <p className="text-xs text-text-light truncate max-w-[130px]">{exp.organizationName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-orange bg-orange/10 px-2 py-0.5 rounded-full block">
                      {exp.matchScore}% Match
                    </span>
                  </div>
                </div>

                <div className="space-y-1 my-2.5">
                  {exp.matchReasons?.slice(0, 3).map((r: string, idx: number) => (
                    <p key={idx} className="text-[11px] text-text-light truncate">{r}</p>
                  ))}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-navy font-bold">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{exp.rating || '5.0'}</span>
                    <span className="text-text-light font-normal">({exp.totalReviews})</span>
                  </div>
                  <Link to={`/experts/${exp.expertId}`} className="text-xs font-semibold text-orange hover:underline">
                    View Profile →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Received Proposals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-navy">Received Proposals ({proposals.length})</h2>
            <p className="text-xs text-text-light">Detailed customized itineraries crafted by verified specialists</p>
          </div>
          {proposals.length > 1 && (
            <Link to={`/traveler/compare/${id}`} className="btn-outline text-xs px-3 py-1.5">
              Side-by-Side Comparison Matrix →
            </Link>
          )}
        </div>

        {proposals.length === 0 ? (
          <div className="card p-10 text-center border border-dashed border-gray-300">
            <Clock className="w-12 h-12 text-orange mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-navy mb-1">Specialists are preparing your custom proposals</h3>
            <p className="text-sm text-text-light max-w-md mx-auto">
              WayRivo dispatched your trip request. You will receive competitive day-by-day itineraries and transparent pricing directly here.
            </p>
          </div>
        ) : (
          proposals.map((p: any) => {
            const isExpanded = expandedItinerary === p.id;
            return (
              <div key={p.id} className={`card p-6 border transition-all ${
                p.status === 'SELECTED'
                  ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20'
                  : 'border-border hover:border-gray-300'
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-navy text-white rounded-xl flex items-center justify-center font-bold text-base">
                        {p.expertName?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/experts/${p.expertId || 1}`} className="text-base font-bold text-navy hover:text-orange">
                            {p.expertName}
                          </Link>
                          {p.verificationStatus === 'VERIFIED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> VERIFIED EXPERT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-light">{p.organizationName} • {p.expertExperience || 10}+ yrs exp</p>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold text-navy">{p.expertRating || '5.0'}</span>
                        <span className="text-xs text-text-light">({p.expertReviews || 0} reviews)</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-navy">{p.title}</h3>
                    <p className="text-xs text-text-light leading-relaxed">{p.description}</p>

                    {/* Meta highlights */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <div className="p-2.5 bg-bg rounded-lg text-xs">
                        <span className="text-text-light text-[10px] uppercase font-bold block">Hotels</span>
                        <span className="font-semibold text-navy truncate block">{p.accommodationDetails || '4-Star Resorts'}</span>
                      </div>
                      <div className="p-2.5 bg-bg rounded-lg text-xs">
                        <span className="text-text-light text-[10px] uppercase font-bold block">Transport</span>
                        <span className="font-semibold text-navy truncate block">{p.transportDetails || 'Private AC Cab'}</span>
                      </div>
                      <div className="p-2.5 bg-bg rounded-lg text-xs">
                        <span className="text-text-light text-[10px] uppercase font-bold block">Activities</span>
                        <span className="font-semibold text-navy truncate block">{p.activities || 'Sightseeing & Safari'}</span>
                      </div>
                      <div className="p-2.5 bg-bg rounded-lg text-xs">
                        <span className="text-text-light text-[10px] uppercase font-bold block">Cancellation</span>
                        <span className="font-semibold text-emerald-600 truncate block">{p.cancellationPolicy || 'Flexible 85% Refund'}</span>
                      </div>
                    </div>

                    {/* Itinerary Dropdown */}
                    {p.itinerary && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedItinerary(isExpanded ? null : p.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-orange hover:underline mt-2"
                        >
                          {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide Day-by-Day Plan</> : <><ChevronDown className="w-3.5 h-3.5" /> View Day-by-Day Detailed Itinerary</>}
                        </button>
                        {isExpanded && (
                          <div className="mt-3 p-4 bg-bg rounded-xl text-xs text-text whitespace-pre-line leading-relaxed border border-border">
                            {p.itinerary}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pricing & Selection CTA */}
                  <div className="flex flex-col lg:items-end justify-between border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6 min-w-[210px]">
                    <div className="lg:text-right">
                      <span className="text-xs text-text-light block">Total Bespoke Quote</span>
                      <p className="text-2xl font-bold text-navy">₹{Number(p.totalPrice).toLocaleString()}</p>
                      {p.pricePerPerson && (
                        <p className="text-xs text-emerald-600 font-semibold">₹{Number(p.pricePerPerson).toLocaleString()} / person</p>
                      )}
                    </div>

                    <div className="my-3 lg:text-right">
                      <span className={`badge ${
                        p.status === 'SELECTED'
                          ? 'badge-success'
                          : p.status === 'REJECTED'
                          ? 'badge-danger'
                          : 'badge-info'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    {p.status === 'SUBMITTED' && (request.status === 'OPEN' || request.status === 'PROPOSALS_RECEIVED') && (
                      <button
                        onClick={() => handleSelect(p.id)}
                        disabled={selecting === p.id}
                        className="btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-1.5"
                      >
                        {selecting === p.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Select This Proposal
                          </>
                        )}
                      </button>
                    )}

                    {p.status === 'SELECTED' && (
                      <button
                        onClick={() => navigate('/traveler/bookings')}
                        className="btn-secondary text-xs w-full py-2.5"
                      >
                        View Confirmed Booking →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RequestDetail;
