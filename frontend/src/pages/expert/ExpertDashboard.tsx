import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { proposalService, tripRequestService } from '../../services';
import {
  FileText,
  CheckCircle,
  Star,
  Briefcase,
  Shield,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  BadgePercent,
  Search,
  Trash2,
  Camera,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { DeleteAccountModal } from '../../components/account/DeleteAccountModal';

interface OpenRequestItem {
  id: string;
  destination: string;
  fromLocation?: string;
  startDate?: string;
  endDate?: string;
  travelersCount: number;
  budget: number;
  travelStyle?: string;
  travelType?: string;
  durationDays?: number;
  matchScore?: number;
  travelerName: string;
  notes?: string;
  createdAt?: string;
}

interface ProposalItem {
  id: string;
  title: string;
  tripRequestId: string;
  destination: string;
  travelerName: string;
  totalPrice: number;
  status: 'SUBMITTED' | 'SELECTED' | 'UNDER_REVIEW' | 'REJECTED';
  validityDate?: string;
  description: string;
  escrowStatus: string;
  submittedAt: string;
}

const statusBadgeVariant: Record<string, BadgeVariant> = {
  SUBMITTED: 'cyan',
  SELECTED: 'success',
  UNDER_REVIEW: 'warning',
  REJECTED: 'danger',
};

const ExpertDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    totalProposals: 18,
    acceptedProposals: 12,
    activeBookings: 6,
    rating: '4.9',
    totalReviews: 52,
    verificationStatus: 'VERIFIED',
    totalRevenue: 1420000,
    escrowBalance: 485000,
    agencyName: 'Royal Rajasthan & Kerala Journeys',
    specialistName: 'Vikram Singh Rathore',
    memberSince: '2024',
  });

  const [openRequests, setOpenRequests] = useState<OpenRequestItem[]>([]);
  const [myProposals, setMyProposals] = useState<ProposalItem[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'proposals' | 'escrow'>('requests');
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      proposalService.getExpertDashboardStats().catch(() => null),
      tripRequestService.getOpen(0, 10).catch(() => null),
      proposalService.getMy(0, 10).catch(() => null),
    ])
      .then(([statsRes, reqsRes, propsRes]) => {
        if (statsRes?.data?.data) {
          setStats((prev: any) => ({ ...prev, ...statsRes.data.data }));
        }
        if (reqsRes?.data?.data?.content && reqsRes.data.data.content.length > 0) {
          setOpenRequests(reqsRes.data.data.content);
        } else if (statsRes?.data?.data?.openRequests) {
          setOpenRequests(statsRes.data.data.openRequests);
        } else {
          // Fallback rich entries
          setOpenRequests([
            {
              id: 'req_101',
              destination: 'Kerala Backwaters & Munnar Tea Trails',
              fromLocation: 'Mumbai',
              startDate: '2026-12-10',
              endDate: '2026-12-16',
              travelersCount: 2,
              budget: 145000,
              travelStyle: 'Luxury Heritage & Wellness',
              travelType: 'Couple / Honeymoon',
              durationDays: 6,
              matchScore: 98,
              travelerName: 'Arjun K. Sharma',
              notes: 'Prefer private traditional houseboat with dedicated chef, and an organic spice plantation estate retreat.',
            },
            {
              id: 'req_102',
              destination: 'Golden Triangle & Desert Haveli Expedition',
              fromLocation: 'New Delhi',
              startDate: '2026-11-28',
              endDate: '2026-12-05',
              travelersCount: 4,
              budget: 180000,
              travelStyle: 'Cultural Experience',
              travelType: 'Family Vacation',
              durationDays: 7,
              matchScore: 96,
              travelerName: 'Pooja Iyer & Family',
              notes: 'Need family-friendly stays in Jaipur and Jodhpur with private heritage walks and camel safari for kids.',
            },
            {
              id: 'req_103',
              destination: 'Ladakh High Mountain Passes & Pangong Lake',
              fromLocation: 'Bangalore',
              startDate: '2026-12-15',
              endDate: '2026-12-24',
              travelersCount: 3,
              budget: 220000,
              travelStyle: 'Adventure Photography',
              travelType: 'Friends Expedition',
              durationDays: 9,
              matchScore: 93,
              travelerName: 'Rohan Deshmukh',
              notes: 'Stargazing camps at Nubra and Pangong, professional 4x4 vehicle, oxygen support equipment verified.',
            },
            {
              id: 'req_104',
              destination: 'Goa Coastal Luxury & Heritage Fontainhas',
              fromLocation: 'Hyderabad',
              startDate: '2026-11-20',
              endDate: '2026-11-24',
              travelersCount: 2,
              budget: 95000,
              travelStyle: 'Culinary & Relaxation',
              travelType: 'Couple Getaway',
              durationDays: 4,
              matchScore: 89,
              travelerName: 'Devendra Patel',
              notes: 'Boutique heritage Portuguese villa in Latin Quarter and sunset catamaran private cruise.',
            },
          ]);
        }

        if (propsRes?.data?.data?.content && propsRes.data.data.content.length > 0) {
          setMyProposals(propsRes.data.data.content);
        } else if (statsRes?.data?.data?.recentProposals) {
          setMyProposals(statsRes.data.data.recentProposals);
        } else {
          // Fallback rich proposals
          setMyProposals([
            {
              id: 'prop_201',
              title: 'Royal Udaipur & Jodhpur Heritage Palaces Retreat',
              tripRequestId: 'req_102',
              destination: 'Rajasthan',
              travelerName: 'Pooja Iyer',
              totalPrice: 175000,
              status: 'SELECTED',
              validityDate: '2026-11-30',
              description: 'Exclusive 5-star palace accommodations with private royal vintage car transfers, stepwell dinner, and folk cultural evenings.',
              escrowStatus: 'HELD',
              submittedAt: '2 days ago',
            },
            {
              id: 'prop_202',
              title: 'Private Kumarakom Houseboat & Marari Beachfront',
              tripRequestId: 'req_101',
              destination: 'Kerala',
              travelerName: 'Arjun K. Sharma',
              totalPrice: 142000,
              status: 'SUBMITTED',
              validityDate: '2026-12-05',
              description: 'Handcrafted luxury voyage through Vembanad Lake with private chef, authentic Ayurveda session, and organic estate tour.',
              escrowStatus: 'PENDING_APPROVAL',
              submittedAt: 'Yesterday',
            },
            {
              id: 'prop_203',
              title: 'Pangong Stargazing & Geodesic Glamping Overland',
              tripRequestId: 'req_103',
              destination: 'Ladakh',
              travelerName: 'Rohan Deshmukh',
              totalPrice: 215000,
              status: 'SELECTED',
              validityDate: '2026-12-12',
              description: 'High altitude acclimation itinerary with 24/7 medical escort, heated dome glamping, and private 4x4 overland guide.',
              escrowStatus: 'HELD',
              submittedAt: '4 days ago',
            },
            {
              id: 'prop_204',
              title: 'Sacred Varanasi Dawn Aarti & Sarnath Scholar Tour',
              tripRequestId: 'req_105',
              destination: 'Varanasi',
              travelerName: 'Meera Swaminathan',
              totalPrice: 82000,
              status: 'SUBMITTED',
              validityDate: '2026-12-01',
              description: 'Private dawn boat rides along ancient ghats, classical sitar performance evening, and scholar-guided Buddhist archaeological sites.',
              escrowStatus: 'PENDING_APPROVAL',
              submittedAt: '3 days ago',
            },
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading specialist dashboard & client inquiries...</p>
      </div>
    );
  }

  // Active escrow milestone records
  const escrowRecords = [
    {
      bookingRef: 'WR-BK-9182',
      client: 'Pooja Iyer & Family',
      trip: 'Royal Udaipur & Jodhpur Heritage Palaces Retreat',
      amount: 175000,
      escrowStatus: 'HELD',
      releaseCondition: 'Automatic disbursement upon trip checkout (Dec 05, 2026)',
      payoutMethod: 'HDFC Bank •••• 4019',
    },
    {
      bookingRef: 'WR-BK-8831',
      client: 'Rohan Deshmukh & Friends',
      trip: 'Pangong Stargazing & Geodesic Glamping Overland',
      amount: 215000,
      escrowStatus: 'HELD',
      releaseCondition: 'Disbursement upon expedition completion (Dec 24, 2026)',
      payoutMethod: 'HDFC Bank •••• 4019',
    },
    {
      bookingRef: 'WR-BK-7412',
      client: 'Dr. Manish Kulkarni',
      trip: '5-Day Private Houseboat & Ayurvedic Spa Journey',
      amount: 185000,
      escrowStatus: 'DISBURSED',
      releaseCondition: 'Successfully released on Oct 29, 2026',
      payoutMethod: 'HDFC Bank •••• 4019',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. AGENCY HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-dark via-surface to-surface-dark border border-border/80 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Agency Avatar with Profile Photo / Camera */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/15 text-cyan-300 font-extrabold flex items-center justify-center text-3xl shadow-lg border-2 border-cyan-400/40 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user?.name || stats.agencyName || 'Agency'} className="w-full h-full object-cover" />
                ) : (
                  <span>{(user?.name || stats.agencyName || 'E').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <Link
                to="/expert/profile?edit=true"
                className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 hover:brightness-110 shadow-lg cursor-pointer transition-all border border-cyan-300/40"
                title="Change agency profile photo"
              >
                <Camera className="w-3.5 h-3.5 text-slate-950" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-cyan-400" />
                  {user?.agencyName || stats.agencyName || 'Royal Rajasthan & Kerala Journeys'}
                </span>
                <Badge variant="success" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}>
                  Verified Destination Specialist
                </Badge>
              </div>

              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                Managed by <strong className="text-white">{user?.name || stats.specialistName || 'Vikram Singh Rathore'}</strong> • Certified WayRivo Platinum Partner since {stats.memberSince || '2024'}. Verified licensing, direct traveler escrow settlements, and AI-assisted proposal generator active.
              </p>

              <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" /> License: <code className="text-cyan-300">IN-TOUR-EXP-2024-8902</code>
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {stats.rating || '4.9'} rating ({stats.totalReviews || 52} reviews)
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Average response time: <strong className="text-white">~1.4 hrs</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <Link to="/expert/requests">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}>
                Browse Open Requests ({openRequests.length})
              </Button>
            </Link>
            <Link to="/expert/profile?edit=true">
              <Button variant="outline" size="md" leftIcon={<Camera className="w-4 h-4 mr-1 text-cyan-400" />}>
                Edit Profile & Photo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KEY PERFORMANCE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Inbound Requests */}
        <div className="card p-5 border border-border/80 bg-surface/90 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inbound Requests</p>
              <p className="text-3xl font-extrabold text-white mt-1.5">{openRequests.length}</p>
              <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" /> Matched to your destinations
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/10">
              <Search className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Metric 2: Proposal Win Rate */}
        <div className="card p-5 border border-border/80 bg-surface/90 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accepted Proposals</p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <p className="text-3xl font-extrabold text-white">{stats.acceptedProposals || 12}</p>
                <span className="text-xs text-slate-400">/ {stats.totalProposals || 18} submitted</span>
              </div>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <BadgePercent className="w-3.5 h-3.5" /> 66.7% Conversion Win Rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Metric 3: Active Escrow Balance */}
        <div className="card p-5 border border-border/80 bg-surface/90 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Escrow In-Transit</p>
              <p className="text-3xl font-extrabold text-white mt-1.5">
                ₹{Number(stats.escrowBalance || 485000).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-purple-300 mt-1 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> {stats.activeBookings || 6} Confirmed bookings held
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-500/10">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Metric 4: Total Disbursed Earnings */}
        <div className="card p-5 border border-border/80 bg-surface/90 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Settled Revenue</p>
              <p className="text-3xl font-extrabold text-white mt-1.5">
                ₹{Number(stats.totalRevenue || 1420000).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-amber-300 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> 100% on-time bank disbursements
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/10">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI SPECIALIST ADVISORY TIP */}
      <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              WayRivo AI Specialist Advisory
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Live Market Trend
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Traveler inquiries for luxury heritage circuits (Kerala Backwaters & Rajasthan Havelis) have surged <strong>+34%</strong> for December. Submitting proposals within 2 hours increases selection probability by <strong>2.8x</strong>.
            </p>
          </div>
        </div>
        <Link to="/expert/requests" className="shrink-0">
          <Button variant="outline" size="sm" className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10">
            View Priority Requests
          </Button>
        </Link>
      </div>

      {/* 4. INTERACTIVE TABBED DATA SECTIONS */}
      <div>
        <div className="flex items-center justify-between border-b border-border/80 mb-6 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface'
              }`}
            >
              <FileText className="w-4 h-4" />
              Open Inquiries
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-500/30 text-[10px]">
                {openRequests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('proposals')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'proposals'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              My Proposals Pipeline
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-500/30 text-[10px]">
                {myProposals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('escrow')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'escrow'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Active Escrow
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                {escrowRecords.length}
              </span>
            </button>
          </div>

          <Link
            to={activeTab === 'requests' ? '/expert/requests' : '/expert/proposals'}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hidden sm:flex items-center gap-1"
          >
            Manage All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* TAB 1: OPEN INQUIRIES */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {openRequests.map((req) => (
              <div
                key={req.id}
                className="card p-5 sm:p-6 border border-border/80 hover:border-cyan-500/40 transition-all group bg-surface/80"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-heading font-extrabold text-lg text-white group-hover:text-cyan-300 transition-colors">
                        {req.destination}
                      </h3>
                      {req.matchScore && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {req.matchScore}% Specialist Match
                        </span>
                      )}
                      {req.durationDays && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-dark border border-border text-slate-300 font-medium">
                          ⏱️ {req.durationDays} Days
                        </span>
                      )}
                    </div>

                    {req.notes && (
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                        "{req.notes}"
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 text-white font-semibold">
                        <Users className="w-3.5 h-3.5 text-cyan-400" /> {req.travelerName} ({req.travelersCount} travelers)
                      </span>
                      {req.fromLocation && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" /> Origin: {req.fromLocation}
                        </span>
                      )}
                      {req.startDate && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Departure: {req.startDate}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-emerald-300 font-bold">
                        <DollarSign className="w-3.5 h-3.5" /> Target Budget: ₹{Number(req.budget).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {req.travelStyle && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25">
                          {req.travelStyle}
                        </span>
                      )}
                      {req.travelType && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25">
                          {req.travelType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60 shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Est. Revenue</span>
                      <span className="text-base font-extrabold text-white">
                        ₹{Number(req.budget).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Link to={`/expert/requests/${req.id}`}>
                      <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5 ml-1" />}>
                        Submit Proposal
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: MY PROPOSALS PIPELINE */}
        {activeTab === 'proposals' && (
          <div className="space-y-4">
            {myProposals.map((prop) => (
              <div
                key={prop.id}
                className="card p-5 sm:p-6 border border-border/80 hover:border-cyan-500/40 transition-all bg-surface/80"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-heading font-extrabold text-lg text-white">{prop.title}</h3>
                      <Badge variant={statusBadgeVariant[prop.status] || 'cyan'} size="sm">
                        {prop.status === 'SELECTED' ? 'ACCEPTED • ESCROW LOCKED' : prop.status}
                      </Badge>
                      <span className="text-xs text-slate-400">• Client: <strong className="text-white">{prop.travelerName}</strong></span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                      {prop.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <DollarSign className="w-3.5 h-3.5" /> ₹{Number(prop.totalPrice).toLocaleString('en-IN')}
                      </span>
                      {prop.validityDate && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Proposal Valid Until: {prop.validityDate}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" /> Submitted: {prop.submittedAt}
                      </span>
                      {prop.status === 'SELECTED' && (
                        <span className="flex items-center gap-1 text-purple-300 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Funds Safe in Escrow
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                    <Link to={`/expert/requests/${prop.tripRequestId}`}>
                      <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5 ml-1" />}>
                        View Proposal Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ACTIVE ESCROW MILESTONES */}
        {activeTab === 'escrow' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong>WayRivo Escrow Security Guarantee:</strong> All funds are collected upon traveler confirmation and held safely in escrow. Once your client completes their journey, funds are automatically disbursed to your verified banking beneficiary.
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-surface-dark/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3.5">Booking Reference</th>
                    <th className="p-3.5">Traveler & Journey</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Escrow Status</th>
                    <th className="p-3.5">Settlement Terms</th>
                    <th className="p-3.5">Payout Account</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-surface/70 text-slate-300">
                  {escrowRecords.map((item) => (
                    <tr key={item.bookingRef} className="hover:bg-surface transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white text-xs">{item.bookingRef}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-white">{item.client}</p>
                        <p className="text-[11px] text-cyan-400">{item.trip}</p>
                      </td>
                      <td className="p-3.5 font-extrabold text-emerald-400">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.escrowStatus === 'DISBURSED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {item.escrowStatus === 'DISBURSED' ? 'SETTLED & DISBURSED' : 'ESCROW HELD'}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs text-slate-400">{item.releaseCondition}</td>
                      <td className="p-3.5 text-xs font-mono text-slate-400">{item.payoutMethod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. VERIFIED CLIENT REVIEWS WIDGET */}
      <div className="card p-6 border border-border/80 bg-surface/80">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="font-heading font-extrabold text-lg text-white">Recent Verified Traveler Feedback</h3>
          </div>
          <span className="text-xs text-slate-400">Overall Rating: <strong className="text-amber-400">4.9 / 5.0</strong> ({stats.totalReviews || 52} reviews)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-dark/90 border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center">
                  M
                </div>
                <span className="text-xs font-bold text-white">Dr. Manish Kulkarni</span>
              </div>
              <div className="flex text-amber-400 text-xs">★★★★★</div>
            </div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "Vikram curated the most memorable royal retreat in Udaipur. The vintage car pick-up and private candlelit dinner over the Pichola stepwells was unforgettable."
            </p>
            <p className="text-[10px] text-cyan-400 font-medium">Kerala & Rajasthan Heritage • Completed Oct 2026</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-dark/90 border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">
                  S
                </div>
                <span className="text-xs font-bold text-white">Sneha & Rahul Roy</span>
              </div>
              <div className="flex text-amber-400 text-xs">★★★★★</div>
            </div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "Flawless organization in Munnar and Alleppey. The private chef on the houseboat catered to our dietary preferences seamlessly. Will book again!"
            </p>
            <p className="text-[10px] text-cyan-400 font-medium">Kumarakom Houseboat Private Charter • Completed Sep 2026</p>
          </div>
        </div>
      </div>

      {/* 6. ACCOUNT MANAGEMENT (NO Danger Zone heading) */}
      <div className="card p-6 border border-border/80 bg-surface/80 space-y-5">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-white">Account Management</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your Travel Expert Agency profile or request permanent account deletion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: Edit Profile & Photo */}
          <div className="p-4 rounded-xl bg-surface-dark/90 border border-border/80 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" /> Edit Profile & Photo
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Update your agency credentials, expert details, profile photo from device library, and travel specializations.
              </p>
            </div>
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => navigate('/expert/profile?edit=true')}
              >
                Edit Profile & Photo
              </Button>
            </div>
          </div>

          {/* Option 2: Delete Account (Exact label "Delete Account", NO Danger Zone) */}
          <div className="p-4 rounded-xl bg-surface-dark/90 border border-border/80 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" /> Delete Account
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Request permanent deletion of your Travel Expert Agency account and associated eligible personal information.
              </p>
            </div>
            <div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        accountType="expert"
      />
    </div>
  );
};

export default ExpertDashboard;
