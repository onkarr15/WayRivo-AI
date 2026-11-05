import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { expertService, reviewService } from '../../services';
import {
  Star,
  MapPin,
  Award,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ThumbsUp,
  UserCheck
} from 'lucide-react';

const ExpertPublicProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = React.useCallback(async () => {
    if (!id) return;
    try {
      const [expRes, revRes] = await Promise.all([
        expertService.getById(Number(id)),
        reviewService.getForExpert(Number(id)),
      ]);
      setExpert(expRes.data?.data);
      setReviews(revRes.data?.data || []);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Expert Profile Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">The travel specialist you requested is currently unavailable or pending verification.</p>
        <Link to="/explore" className="btn-primary">Explore Destinations</Link>
      </div>
    );
  }

  const specializationsList = expert.specializations ? expert.specializations.split(',') : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="btn-ghost text-xs mb-6 flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero Profile Header */}
      <div className="card p-6 sm:p-8 mb-8 border border-border shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-navy to-slate-800 text-white rounded-2xl flex items-center justify-center font-bold text-3xl shadow-md flex-shrink-0">
              {expert.name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{expert.name}</h1>
                {expert.verificationStatus === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> VERIFIED SPECIALIST
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-300">{expert.organizationName}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {expert.city}, {expert.state}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-cyan-400" /> {expert.yearsOfExperience || 8}+ Years Experience
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> &lt; 2h Avg Response
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-surface border border-amber-500/30 px-3.5 py-1.5 rounded-xl">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-lg font-bold text-white">{expert.rating || '5.0'}</span>
              <span className="text-xs text-slate-400">({expert.totalReviews || 0} reviews)</span>
            </div>
            <Link to="/traveler/create-trip" className="btn-primary text-xs w-full sm:w-auto px-6 py-2.5">
              <Sparkles className="w-4 h-4" /> Request Custom Trip
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Bio & Specializations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 border border-border">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-3">About Specialist & Agency</h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {expert.description || `${expert.organizationName} is a certified regional destination specialist dedicated to crafting personalized, hassle-free travel itineraries with authentic local stays and seamless private transport.`}
            </p>
          </div>

          <div className="card p-6 border border-border">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4">Destination & Theme Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {specializationsList.map((spec: string) => (
                <span key={spec} className="px-3 py-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold">
                  ✨ {spec.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Traveler Reviews Section */}
          <div className="card p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">Verified Traveler Reviews</h2>
                <p className="text-xs text-slate-400 mt-0.5">{reviews.length} authentic trip reviews</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-white">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{expert.rating || '5.0'} / 5.0</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No traveler reviews submitted yet for this specialist.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <div key={r.id} className="p-4 bg-surface-dark rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                          {r.travelerName?.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-white">{r.travelerName}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30">
                          VERIFIED TRIP
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(r.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Trust Badges & Guarantees */}
        <div className="space-y-6">
          <div className="card p-6 border border-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">WayRivo Trust Guarantees</h3>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Verified Credentials</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Business registration & regional tourism license audited by WayRivo Admin.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-500/15 text-cyan-400 rounded-lg">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Escrow Protection</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Payments held safely in escrow until the trip is completed satisfactorily.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/15 text-amber-400 rounded-lg">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Direct Specialist Chat</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Real-time collaboration on itinerary customizations before booking.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertPublicProfile;
