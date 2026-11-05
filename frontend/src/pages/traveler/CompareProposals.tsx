import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tripRequestService, proposalService } from '../../services';
import {
  ArrowLeft,
  Star,
  CheckCircle,
  Check,
  MessageSquare,
  ShieldCheck,
  TrendingDown,
  Award,
  Zap,
  Hotel,
  Car,
  Compass,
  FileText
} from 'lucide-react';

const CompareProposals: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [reqRes, propRes] = await Promise.all([
        tripRequestService.getById(Number(id)),
        proposalService.getForRequest(Number(id)),
      ]);
      setRequest(reqRes.data?.data);
      setProposals(propRes.data?.data || []);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelect = async (proposalId: number) => {
    if (!confirm('Confirm selection of this proposal? Other competing proposals will be automatically rejected and your booking confirmation will be generated.')) return;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="card p-8 text-center">
        <p className="text-text-light">Trip request not found.</p>
        <Link to="/traveler/requests" className="btn-primary mt-4 inline-flex">Back to My Requests</Link>
      </div>
    );
  }

  // Calculate Dynamic Badges
  let lowestPriceId: number | null = null;
  let highestRatingId: number | null = null;
  let bestValueId: number | null = null;

  if (proposals.length > 0) {
    const minPrice = Math.min(...proposals.map(p => Number(p.totalPrice) || Infinity));
    const maxRating = Math.max(...proposals.map(p => Number(p.expertRating) || 0));
    
    lowestPriceId = proposals.find(p => Number(p.totalPrice) === minPrice)?.id || null;
    highestRatingId = proposals.find(p => Number(p.expertRating) === maxRating && maxRating > 4.5)?.id || null;

    // Best value: balance high rating with competitive price
    const scoredProposals = proposals.map(p => ({
      id: p.id,
      score: ((Number(p.expertRating) || 4.5) / 5.0) * 0.6 + (minPrice / (Number(p.totalPrice) || minPrice)) * 0.4,
    })).sort((a, b) => b.score - a.score);

    if (scoredProposals.length > 1 && scoredProposals[0].id !== lowestPriceId) {
      bestValueId = scoredProposals[0].id;
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to={`/traveler/requests/${id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Request Details
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Compare Proposals: {request.destination}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Target Budget: ₹{Number(request.budget).toLocaleString()} • {request.travelersCount} Travelers ({request.travelType}) • {proposals.length} Verified Proposals
          </p>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="card p-12 text-center border border-dashed border-slate-700">
          <p className="text-slate-400 text-sm">No proposals have been submitted for this request yet.</p>
          <Link to="/traveler/requests" className="btn-primary mt-4 inline-flex text-xs">View All Requests</Link>
        </div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="grid grid-flow-col auto-cols-[330px] md:auto-cols-[380px] gap-6">
            {proposals.map((p) => {
              const isSelected = p.status === 'SELECTED';
              const isSubmitted = p.status === 'SUBMITTED';

              let badgeLabel = null;
              let badgeColor = '';
              let BadgeIcon = Award;

              if (isSelected) {
                badgeLabel = 'SELECTED PROPOSAL';
                badgeColor = 'bg-emerald-600 text-white';
                BadgeIcon = CheckCircle;
              } else if (p.id === bestValueId) {
                badgeLabel = 'BEST VALUE CHOICE';
                badgeColor = 'bg-cyan-500 text-slate-950';
                BadgeIcon = Zap;
              } else if (p.id === lowestPriceId) {
                badgeLabel = 'LOWEST PRICE';
                badgeColor = 'bg-blue-600 text-white';
                BadgeIcon = TrendingDown;
              } else if (p.id === highestRatingId) {
                badgeLabel = 'HIGHEST RATED EXPERT';
                badgeColor = 'bg-amber-600 text-white';
                BadgeIcon = Star;
              }

              return (
                <div
                  key={p.id}
                  className={`card flex flex-col justify-between overflow-hidden relative border-2 transition-all ${
                    isSelected
                      ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                      : badgeLabel
                      ? 'border-cyan-500/50 shadow-md'
                      : 'border-border'
                  }`}
                >
                  {/* Dynamic Badge */}
                  {badgeLabel && (
                    <div className={`${badgeColor} text-[11px] font-bold py-1 px-3 text-center flex items-center justify-center gap-1.5 shadow-xs`}>
                      <BadgeIcon className="w-3.5 h-3.5" /> {badgeLabel}
                    </div>
                  )}

                  <div className="p-6 space-y-5 flex-1">
                    {/* Expert Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-lg flex-shrink-0">
                        {p.expertName?.charAt(0) || 'E'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link to={`/experts/${p.expertId || 1}`} className="font-bold text-white text-sm hover:text-cyan-400 truncate">
                            {p.expertName}
                          </Link>
                          {p.verificationStatus === 'VERIFIED' && (
                            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{p.organizationName}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-white">{p.expertRating || '5.0'}</span>
                          <span className="text-slate-400">({p.expertReviews || 0} reviews)</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="p-4 bg-surface-dark rounded-xl text-center border border-border">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Total Bespoke Quote</p>
                      <p className="text-3xl font-extrabold text-white mt-1">
                        ₹{Number(p.totalPrice).toLocaleString()}
                      </p>
                      {p.pricePerPerson && (
                        <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                          ₹{Number(p.pricePerPerson).toLocaleString()} per traveler
                        </p>
                      )}
                    </div>

                    {/* Proposal Title & Description */}
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                        {p.description || 'Custom planned itinerary curated for your comfort and budget.'}
                      </p>
                    </div>

                    {/* Matrix Inclusions Breakdown */}
                    <div className="space-y-3 text-xs pt-4 border-t border-border">
                      <div>
                        <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                          <Hotel className="w-3.5 h-3.5 text-cyan-400" /> Accommodation Tier:
                        </span>
                        <p className="text-slate-300 bg-surface-dark p-2 rounded-lg border border-border/80">{p.accommodationDetails || 'Standard / 4-Star Resort'}</p>
                      </div>

                      <div>
                        <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                          <Car className="w-3.5 h-3.5 text-cyan-400" /> Transportation:
                        </span>
                        <p className="text-slate-300 bg-surface-dark p-2 rounded-lg border border-border/80">{p.transportationDetails || 'Dedicated AC Cab for full tour'}</p>
                      </div>

                      <div>
                        <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                          <Compass className="w-3.5 h-3.5 text-cyan-400" /> Sightseeing & Activities:
                        </span>
                        <p className="text-slate-300 bg-surface-dark p-2 rounded-lg border border-border/80">{p.activities || 'All entry tickets & guided tours'}</p>
                      </div>

                      <div>
                        <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" /> Cancellation Policy:
                        </span>
                        <p className="text-slate-300 bg-surface-dark p-2 rounded-lg border border-border/80">{p.cancellationPolicy || 'Flexible 85% refund up to 7 days prior'}</p>
                      </div>

                      {p.inclusions && (
                        <div>
                          <span className="font-bold text-emerald-600 block mb-1 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Inclusions:
                          </span>
                          <p className="text-text-light bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">{p.inclusions}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action CTA Footer */}
                  <div className="p-6 bg-gray-50 border-t border-border space-y-3">
                    {isSubmitted && (request.status === 'OPEN' || request.status === 'PROPOSALS_RECEIVED') ? (
                      <button
                        onClick={() => handleSelect(p.id)}
                        disabled={selecting === p.id}
                        className="btn-primary w-full py-3 text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
                      >
                        {selecting === p.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" /> Select This Proposal
                          </>
                        )}
                      </button>
                    ) : isSelected ? (
                      <Link to="/traveler/bookings" className="btn-success w-full py-2.5 text-xs font-bold text-center block">
                        View Confirmed Booking
                      </Link>
                    ) : (
                      <span className="badge-neutral w-full py-2 text-center block font-semibold text-xs">
                        {p.status}
                      </span>
                    )}

                    <Link
                      to={`/traveler/messages?recipientId=${p.expertId || ''}`}
                      className="btn-ghost w-full py-2 text-xs flex items-center justify-center gap-1.5 text-slate-400 hover:text-white"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat with {p.expertName?.split(' ')[0]}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareProposals;
