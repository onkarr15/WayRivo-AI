import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { userService, paymentService, bookingService } from '../../services';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { staggerContainer, staggerItem } from '../../utils/animations';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  PlaneTakeoff,
  MapPin,
  Bot,
  Compass,
  CreditCard,
  Settings,
  ArrowRight,
  ShieldCheck,
  Printer,
  Sparkles,
  RotateCcw,
  User as UserIcon,
  X,
  ExternalLink,
  Search,
  Receipt,
  Check,
  Lock,
  Edit3,
  Trash2,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { DeleteAccountModal } from '../../components/account/DeleteAccountModal';

const statusBadgeStyles: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ESCROW_HOLD: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  PENDING_PAYMENT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
  REFUNDED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const TravelerDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'trips' | 'itineraries' | 'conversations' | 'payments' | 'preferences'
  >('overview');

  const [tripFilter, setTripFilter] = useState<'all' | 'pending' | 'upcoming' | 'completed'>('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('Change of travel schedule');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Detailed Booking Modal State
  const [detailModalBooking, setDetailModalBooking] = useState<any>(null);

  // Payment Verification & Lookup Input State
  const [paymentLookupInput, setPaymentLookupInput] = useState<string>('');
  const [paymentSearchFilter, setPaymentSearchFilter] = useState<string>('');
  const [verifyingPayment, setVerifyingPayment] = useState<boolean>(false);
  const [paymentLookupResult, setPaymentLookupResult] = useState<any>(null);
  const [paypalSandboxEmail, setPaypalSandboxEmail] = useState<string>(
    () => localStorage.getItem('wayrivo_sandbox_buyer_email') || 'sb-buyer@personal.example.com'
  );

  // Profile preferences edit state
  const [prefDestinations, setPrefDestinations] = useState<string>('');
  const [prefInterests, setPrefInterests] = useState<string>('');
  const [prefBudget, setPrefBudget] = useState<string>('Moderate');
  const [prefCurrency, setPrefCurrency] = useState<string>('INR');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getDashboard();
      const dashData = res.data?.data;
      setData(dashData);

      if (dashData?.user) {
        setPrefDestinations((dashData.user.preferredDestinations || []).join(', '));
        setPrefInterests((dashData.user.travelInterests || []).join(', '));
        setPrefBudget(dashData.user.budgetPreference || 'Moderate');
        setPrefCurrency(dashData.user.preferredCurrency || 'INR');
      }
    } catch (err) {
      console.error('Failed to load user dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRequestCancellation = async () => {
    if (!cancelModalBooking) return;
    setSubmittingCancel(true);
    try {
      const res = await paymentService.requestCancellation(cancelModalBooking.id, cancelReason);
      toast.success(res.data?.data?.message || 'Cancellation request submitted for admin review.');
      setCancelModalBooking(null);
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit cancellation request.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleCancelUnpaidBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this unpaid reservation? You can plan a new trip anytime.')) {
      return;
    }
    try {
      await bookingService.cancelUnpaid(bookingId);
      toast.success('Unpaid booking cancelled successfully.');
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel unpaid booking.');
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await userService.updateProfile({
        preferredDestinations: prefDestinations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        travelInterests: prefInterests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        budgetPreference: prefBudget,
        preferredCurrency: prefCurrency,
      });
      if (paypalSandboxEmail) {
        localStorage.setItem('wayrivo_sandbox_buyer_email', paypalSandboxEmail);
      }
      toast.success('Travel preferences and PayPal sandbox details updated successfully!');
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleVerifyOrViewPayment = async (targetId?: string) => {
    const idToLookup = (targetId || paymentLookupInput).trim();
    if (!idToLookup) {
      toast.warning('Please enter a PayPal Capture ID, Order ID, or Booking Reference.');
      return;
    }

    setVerifyingPayment(true);
    setPaymentLookupResult(null);
    try {
      const res = await paymentService.getPaymentDetails(idToLookup);
      const paymentInfo = res.data?.data;
      if (paymentInfo) {
        setPaymentLookupResult(paymentInfo);
        toast.success(`Verified: ${paymentInfo.bookingReference} (${paymentInfo.status})`);
      }
    } catch (err: any) {
      // If direct backend lookup fails or restricted, check current dashboard payments list
      const matched = (data?.payments || []).find(
        (p: any) =>
          p.paypalCaptureId === idToLookup ||
          p.paypalOrderId === idToLookup ||
          p.booking?.bookingReference === idToLookup ||
          p.bookingId === idToLookup ||
          p.id === idToLookup
      );
      if (matched) {
        setPaymentLookupResult(matched);
        toast.success(`Found in your bookings: ${matched.booking?.bookingReference || matched.id}`);
      } else {
        toast.error(err.response?.data?.error || 'No matching payment record found with that ID.');
      }
    } finally {
      setVerifyingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-9 h-9 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overview = data?.overview || {};
  const upcomingTrips = data?.upcomingTrips || [];
  const completedTrips = data?.completedTrips || [];
  const bookings = data?.bookings || [];
  const pendingTrips = data?.pendingTrips || bookings.filter((b: any) => b.status === 'PENDING_PAYMENT');
  const savedItineraries = data?.savedItineraries || [];
  const conversations = data?.conversations || [];
  const payments = data?.payments || [];
  const user = data?.user || authUser;

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> WayRivo AI Traveler Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-gradient-cyan">{user?.name || 'Traveler'}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Track your upcoming journeys, inspect escrow transactions, resume AI trip planning dialogues, and customize personal travel preferences.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/agent"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Bot className="w-4 h-4" /> Ask AI Travel Agent
            </Link>
            <Link
              to="/itinerary-planner"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Compass className="w-4 h-4 text-cyan-400" /> Plan Itinerary
            </Link>
          </div>
        </div>
      </div>

      {/* OVERVIEW: 5 Key Metrics Display with Animated Counters */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4"
      >
        {/* Total Trips */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Trips</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white font-mono">
            <AnimatedCounter value={overview.totalTrips || 0} />
          </p>
          <span className="text-[10px] text-slate-400">All-time reservations</span>
        </motion.div>

        {/* Upcoming Bookings */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Upcoming Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-cyan-400 font-mono">
            <AnimatedCounter value={overview.upcomingBookingsCount || 0} />
          </p>
          <span className="text-[10px] text-cyan-300/80">Confirmed or Escrow Held</span>
        </motion.div>

        {/* Completed Trips */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed Trips</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            <AnimatedCounter value={overview.completedTripsCount || 0} />
          </p>
          <span className="text-[10px] text-emerald-300/80">Safely concluded tours</span>
        </motion.div>

        {/* Total Travel Expenditure */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expenditure</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white font-mono flex items-center">
            <span>₹</span>
            <AnimatedCounter value={Number(overview.totalExpenditure || 0)} />
          </p>
          <span className="text-[10px] text-slate-400">Escrow & captured total</span>
        </motion.div>

        {/* Pending Payments */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            setActiveTab('trips');
            setTripFilter('pending');
          }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-400/60 transition-all shadow-md col-span-2 sm:col-span-1 cursor-pointer group"
          title="Click to view all pending payment bookings"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Pending Payments</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 group-hover:bg-amber-500/25 flex items-center justify-center text-amber-400 transition-colors">
              <AlertCircle className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">
            <AnimatedCounter value={pendingTrips.length || overview.pendingPaymentsCount || 0} />
          </p>
          <span className="text-[10px] text-amber-300/80 flex items-center gap-1 group-hover:text-amber-200 transition-colors">
            Awaiting PayPal checkout <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </motion.div>
      </motion.div>

      {/* TAB NAVIGATION with Animated Active Indicator */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Briefcase },
          { id: 'trips', label: `My Trips (${bookings.length})`, icon: Calendar },
          { id: 'itineraries', label: `Saved Itineraries (${savedItineraries.length})`, icon: Compass },
          { id: 'conversations', label: `AI Conversations (${conversations.length})`, icon: Bot },
          { id: 'payments', label: `Payment History (${payments.length})`, icon: CreditCard },
          { id: 'preferences', label: 'Travel Preferences & Profile', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="relative px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="travelerTabIndicator"
                  className="absolute inset-0 bg-cyan-500/15 border border-cyan-500/30 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`relative z-10 w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className={`relative z-10 ${isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Action Required: Pending Payments Banner */}
          {pendingTrips.length > 0 && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/40 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Action Required • {pendingTrips.length} {pendingTrips.length === 1 ? 'Booking' : 'Bookings'} Awaiting Checkout
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Complete your PayPal deposit to confirm your itinerary and secure escrow protection
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('trips');
                    setTripFilter('pending');
                  }}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  View all pending ({pendingTrips.length}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {pendingTrips.slice(0, 2).map((trip: any) => (
                  <div
                    key={trip.id}
                    className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/20 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {trip.bookingReference}
                        </span>
                        <span className="text-xs font-black text-white">
                          ₹{Number(trip.totalAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">
                        {trip.itinerary?.title || `Trip to ${trip.tripDestination || trip.destinationLocation || trip.itinerary?.destination?.name || 'India'}`}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          {trip.tripDestination || trip.destinationLocation || trip.itinerary?.destination?.name || 'India'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(trip.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900">
                      <button
                        onClick={() => handleCancelUnpaidBooking(trip.id)}
                        className="text-[11px] font-semibold text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <Link
                        to={`/traveler/booking-confirmation/${trip.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/20 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Pay Now with PayPal
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Trip Spotlight */}
          {upcomingTrips.length > 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Next Upcoming Trip
                </span>
                <Link
                  to="/traveler/bookings"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  View all trips <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {upcomingTrips.slice(0, 1).map((trip: any) => (
                <div
                  key={trip.id}
                  className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                        {trip.bookingReference}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          statusBadgeStyles[trip.status] || 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {(trip.status || 'PLANNING').replace('_', ' ')}
                      </span>
                      {trip.payment?.escrowStatus && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Escrow: {trip.payment.escrowStatus}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {trip.itinerary?.title || `Journey to ${trip.itinerary?.destination?.name || 'India'}`}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {trip.itinerary?.destination?.name || 'India'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {trip.itinerary?.startDate
                          ? new Date(trip.itinerary.startDate).toLocaleDateString('en-IN')
                          : new Date(trip.createdAt).toLocaleDateString('en-IN')}
                      </span>
                      <span className="flex items-center gap-1 text-white font-bold">
                        ₹{Number(trip.totalAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailModalBooking(trip)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      Trip Details
                    </button>
                    <Link
                      to={`/traveler/booking-confirmation/${trip.id}`}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Printable Receipt
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 space-y-3">
              <Compass className="w-10 h-10 mx-auto text-cyan-400" />
              <h3 className="text-sm font-bold text-white">No Upcoming Trips Planned Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Ready for your next adventure? Consult our AI travel agent or generate a custom day-wise itinerary under your budget.
              </p>
              <Link
                to="/itinerary-planner"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
              >
                Launch AI Itinerary Planner <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* PAYPAL TRANSACTION & ESCROW VERIFICATION INPUT WIDGET */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/30 border border-cyan-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> PayPal Developer Sandbox Verified
                </div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  PayPal Escrow Receipt & Transaction Verifier
                </h3>
                <p className="text-xs text-slate-400">
                  Input any verified PayPal Transaction ID, Order ID, or Booking Reference to instantly inspect cryptographic escrow status, capture amounts, and download official receipts.
                </p>
              </div>

              {payments.length > 0 && (
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
                >
                  View All Payments ({payments.length}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search / Verification Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyOrViewPayment();
              }}
              className="flex flex-col sm:flex-row gap-3 pt-1"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={paymentLookupInput}
                  onChange={(e) => {
                    setPaymentLookupInput(e.target.value);
                    if (paymentLookupResult) setPaymentLookupResult(null);
                  }}
                  placeholder="Enter PayPal Capture ID (e.g. CAP-...), Order ID, or Booking Ref..."
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={verifyingPayment || !paymentLookupInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {verifyingPayment ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Verify & Open Receipt
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = (paymentLookupInput || payments[0]?.id || '').trim();
                    if (target) {
                      navigate(`/payment/success?paymentId=${target}`);
                    } else {
                      toast.warning('Please enter a Transaction ID or select one below.');
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Confirmation Screen
                </button>
              </div>
            </form>

            {/* Quick Selection Chips from User's Actual Payments */}
            {payments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-[11px] font-semibold text-slate-400">Quick Select:</span>
                {payments.slice(0, 3).map((p: any) => {
                  const chipLabel = p.paypalCaptureId || p.paypalOrderId || p.booking?.bookingReference || p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPaymentLookupInput(chipLabel);
                        handleVerifyOrViewPayment(chipLabel);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 font-mono text-[11px] transition-colors cursor-pointer"
                    >
                      {chipLabel}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Inline Verification Result Panel */}
            {paymentLookupResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white">Genuine PayPal Escrow Record Verified</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Reference: {paymentLookupResult.bookingReference || paymentLookupResult.booking?.bookingReference}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/payment/details/${paymentLookupResult.id || paymentLookupResult.paypalCaptureId || paymentLookupResult.paypalOrderId}`}
                      className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3 h-3" /> Full Receipt
                    </Link>
                    <Link
                      to={`/payment/success?paymentId=${paymentLookupResult.id || paymentLookupResult.paypalCaptureId}&bookingId=${paymentLookupResult.bookingId || ''}`}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                    >
                      Success Card
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">PayPal Capture ID</span>
                    <span className="font-mono text-cyan-400 font-bold">{paymentLookupResult.paypalCaptureId || 'VERIFIED'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Paid Amount</span>
                    <span className="font-bold text-white">
                      ${paymentLookupResult.chargeAmount || (Number(paymentLookupResult.amount) / 83.5).toFixed(2)} USD
                      <span className="text-slate-400 font-normal"> (₹{Number(paymentLookupResult.amount).toLocaleString('en-IN')})</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Merchant</span>
                    <span className="font-semibold text-slate-200">{paymentLookupResult.merchantName || 'WayRivo AI 2.0'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Escrow Status</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> {paymentLookupResult.escrowStatus || 'HELD IN ESCROW'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Grids: Recent Saved Itineraries & Conversations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Saved Itineraries */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" /> Saved Travel Plans
                </h3>
                <button
                  onClick={() => setActiveTab('itineraries')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  View all
                </button>
              </div>

              {savedItineraries.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No saved itineraries recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {savedItineraries.slice(0, 3).map((itin: any) => (
                    <div
                      key={itin.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">{itin.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {itin.numberOfDays} Days • {itin.travelersCount} Travelers • Est: ₹
                          {Number(itin.totalEstimatedCost).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Link
                        to={`/itinerary-planner?id=${itin.id}`}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs"
                        title="Open Planner"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Agent Dialogue Sessions */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" /> AI Travel Agent Sessions
                </h3>
                <Link to="/agent" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                  New Chat
                </Link>
              </div>

              {conversations.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No AI chat sessions started yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {conversations.slice(0, 3).map((conv: any) => (
                    <Link
                      key={conv.id}
                      to={`/agent?conversationId=${conv.id}`}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-all group"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {conv.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {conv.messageCount} messages • Last active {new Date(conv.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY TRIPS (UPCOMING & COMPLETED) */}
      {activeTab === 'trips' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">All Bookings & Reservations</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review verified reservations, view itineraries, request cancellations, or print receipts
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1">
                <button
                  onClick={() => setTripFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    tripFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({bookings.length})
                </button>
                <button
                  onClick={() => setTripFilter('pending')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                    tripFilter === 'pending'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                      : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  Pending Payment ({pendingTrips.length})
                </button>
                <button
                  onClick={() => setTripFilter('upcoming')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    tripFilter === 'upcoming' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upcoming ({upcomingTrips.length})
                </button>
                <button
                  onClick={() => setTripFilter('completed')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    tripFilter === 'completed' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Completed ({completedTrips.length})
                </button>
              </div>

              <Link
                to="/itinerary-planner"
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
              >
                + New Trip
              </Link>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-white">No Bookings Found</p>
              <p className="text-xs text-slate-400 mt-1">
                You have not booked any trips yet. Generate an itinerary to proceed to checkout!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(tripFilter === 'pending'
                ? pendingTrips
                : tripFilter === 'upcoming'
                ? upcomingTrips
                : tripFilter === 'completed'
                ? completedTrips
                : bookings
              ).map((b: any) => {
                const isConfirmed = b.status === 'CONFIRMED' || b.status === 'ESCROW_HOLD';
                const isPending = b.status === 'PENDING_PAYMENT';
                const isCancelled = b.status === 'CANCELLED';
                const isRefunded = b.status === 'REFUNDED';

                return (
                  <div
                    key={b.id}
                    className={`p-5 rounded-2xl transition-all space-y-3 ${
                      isPending
                        ? 'bg-slate-900/95 border-2 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                            {b.bookingReference}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              statusBadgeStyles[b.status] || 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {(b.status || 'CONFIRMED').replace('_', ' ')}
                          </span>

                          {b.payment?.escrowStatus && (
                            <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                              Escrow: {b.payment.escrowStatus}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white">
                          {b.itinerary?.title || `Trip ${b.bookingReference}`}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          {b.departureLocation && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <PlaneTakeoff className="w-3.5 h-3.5 text-cyan-400" />
                              From: <strong className="text-white font-semibold">{b.departureLocation}</strong>
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            To: <strong className="text-white font-semibold">{b.tripDestination || b.destinationLocation || b.itinerary?.destination?.name || 'India'}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(b.createdAt).toLocaleDateString('en-IN')}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                            {b.itinerary?.travelersCount || 2} Travelers
                          </span>
                          <span className="font-bold text-white text-sm">
                            ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setDetailModalBooking(b)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                        >
                          View Details
                        </button>

                        {isPending && (
                          <>
                            <Link
                              to={`/traveler/booking-confirmation/${b.id}`}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-md shadow-amber-400/20 flex items-center gap-1.5 cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Pay Now with PayPal
                            </Link>

                            <button
                              onClick={() => handleCancelUnpaidBooking(b.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs font-semibold border border-slate-700 hover:border-red-500/30 cursor-pointer transition-colors"
                            >
                              Cancel Booking
                            </button>
                          </>
                        )}

                        {isConfirmed && (
                          <>
                            <Link
                              to={`/traveler/booking-confirmation/${b.id}`}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5"
                            >
                              <Printer className="w-3 h-3" /> Receipt
                            </Link>

                            <button
                              onClick={() => {
                                setCancelModalBooking(b);
                                setCancelReason('Requesting trip cancellation & admin refund review.');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/20 cursor-pointer"
                            >
                              Request Cancellation
                            </button>
                          </>
                        )}

                        {b.itineraryId && (
                          <Link
                            to={`/itinerary-planner?id=${b.itineraryId}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700"
                          >
                            View Itinerary
                          </Link>
                        )}

                        {isCancelled && (
                          <span className="text-xs font-bold text-red-400 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20">
                            Cancellation Pending
                          </span>
                        )}

                        {isRefunded && (
                          <span className="text-xs font-bold text-purple-400 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20">
                            Refund Processed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED ITINERARIES */}
      {activeTab === 'itineraries' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Saved Bespoke Itineraries</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Plans generated by our Google Gemini Travel Agent or the Interactive Planner
              </p>
            </div>
            <Link
              to="/itinerary-planner"
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
            >
              + Create New Itinerary
            </Link>
          </div>

          {savedItineraries.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
              <Compass className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-white">No Saved Itineraries</p>
              <p className="text-xs text-slate-400 mt-1">
                You can save multi-day schedules in the Itinerary Planner dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedItineraries.map((itin: any) => (
                <div
                  key={itin.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                      {itin.destination?.name || 'India'}
                    </span>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{itin.title}</h3>
                    <p className="text-xs text-slate-400">
                      {itin.numberOfDays} Days • {itin.travelersCount} Travelers
                    </p>
                    <p className="text-sm font-bold text-white">
                      Est. ₹{Number(itin.totalEstimatedCost).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <Link
                      to={`/itinerary-planner?id=${itin.id}`}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      Open in Planner <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI CONVERSATIONS */}
      {activeTab === 'conversations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">AI Travel Conversations</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Previous chat transcripts and tool calling sessions stored securely in PostgreSQL
              </p>
            </div>
            <Link
              to="/agent"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
            >
              + New Conversation
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
              <Bot className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-white">No Chat Sessions Found</p>
              <p className="text-xs text-slate-400 mt-1">Start a conversation with our AI agent to explore destinations!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conversations.map((c: any) => (
                <Link
                  key={c.id}
                  to={`/agent?conversationId=${c.id}`}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3 group block"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <Bot className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{c.messageCount} messages recorded</p>
                  </div>
                  <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Continue chat <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PAYMENT HISTORY */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Payment & Escrow History</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified PayPal Developer Sandbox transactions and cryptographic escrow deposit receipts
              </p>
            </div>

            {/* Quick Input to Search / Filter Payments */}
            <div className="w-full sm:w-72 relative">
              <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={paymentSearchFilter}
                onChange={(e) => setPaymentSearchFilter(e.target.value)}
                placeholder="Filter by Capture ID or Ref..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
              />
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
              <CreditCard className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-white">No Payment Records</p>
              <p className="text-xs text-slate-400 mt-1">Completed checkout payments will appear here with capture IDs.</p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto shadow-md">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Reference</th>
                    <th className="p-3">PayPal Order ID</th>
                    <th className="p-3">Capture ID</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Escrow Status</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {payments
                    .filter((p: any) => {
                      if (!paymentSearchFilter.trim()) return true;
                      const term = paymentSearchFilter.toLowerCase().trim();
                      return (
                        (p.paypalCaptureId && p.paypalCaptureId.toLowerCase().includes(term)) ||
                        (p.paypalOrderId && p.paypalOrderId.toLowerCase().includes(term)) ||
                        (p.booking?.bookingReference && p.booking.bookingReference.toLowerCase().includes(term)) ||
                        (p.id && p.id.toLowerCase().includes(term))
                      );
                    })
                    .map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-cyan-400">
                          <Link
                            to={`/traveler/booking-confirmation/${p.bookingId}`}
                            className="hover:underline flex items-center gap-1"
                          >
                            {p.booking?.bookingReference || 'N/A'}
                          </Link>
                        </td>
                        <td className="p-3 font-mono text-slate-300">{p.paypalOrderId}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{p.paypalCaptureId || 'PENDING'}</td>
                        <td className="p-3 font-bold text-white">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {p.escrowStatus || 'HELD'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/payment/details/${p.id || p.paypalOrderId}`}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                              title="Inspect Full Electronic Payment Receipt"
                            >
                              <Receipt className="w-3 h-3" /> Receipt
                            </Link>
                            <Link
                              to={`/payment/success?paymentId=${p.id}&bookingId=${p.bookingId}`}
                              className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] transition-colors"
                              title="Open Payment Success Confirmation Card"
                            >
                              Status
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: TRAVEL PREFERENCES & PROFILE */}
      {activeTab === 'preferences' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" /> Travel Preferences & Customization
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Customize your travel style so our Google Gemini AI Agent can suggest ideal destinations and hotels
              </p>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Preferred Destinations (comma-separated)
                </label>
                <input
                  type="text"
                  value={prefDestinations}
                  onChange={(e) => setPrefDestinations(e.target.value)}
                  placeholder="e.g. Goa, Kerala, Himachal Pradesh, Rajasthan"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Travel Interests (comma-separated)
                </label>
                <input
                  type="text"
                  value={prefInterests}
                  onChange={(e) => setPrefInterests(e.target.value)}
                  placeholder="e.g. Beaches, Trekking, Culinary, Water sports, Heritage"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Budget Preference</label>
                  <select
                    value={prefBudget}
                    onChange={(e) => setPrefBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Budget Backpacker">Budget Backpacker (under ₹15,000)</option>
                    <option value="Moderate">Moderate (₹15,000 - ₹35,000)</option>
                    <option value="Luxury / Premium">Luxury / Premium (₹35,000+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Currency</label>
                  <select
                    value={prefCurrency}
                    onChange={(e) => setPrefCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                  </select>
                </div>
              </div>

              {/* PayPal Sandbox Account Input */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                  PayPal Developer Sandbox Buyer Account (Test Email)
                </label>
                <input
                  type="email"
                  value={paypalSandboxEmail}
                  onChange={(e) => setPaypalSandboxEmail(e.target.value)}
                  placeholder="e.g. sb-buyer@personal.example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Saved test buyer credentials used when previewing PayPal Sandbox approvals.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingPrefs ? 'Saving Preferences...' : 'Save Travel Preferences'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Management Card (NO Danger Zone heading) */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Account Management</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your personal profile information or request permanent account deletion.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Edit Profile
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Update your personal and account information.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/traveler/profile?edit=true')}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete Account
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Request permanent deletion of your WayRivo account and associated eligible personal information.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full py-2 px-3 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        accountType="traveler"
      />

      {/* BOOKING DETAILS MODAL */}
      {detailModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  {detailModalBooking.bookingReference}
                </span>
                <h3 className="text-base font-bold text-white mt-1">Reservation Breakdown</h3>
              </div>
              <button
                onClick={() => setDetailModalBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 text-slate-400 border-b border-slate-800/60">
                <span>Status:</span>
                <span className="font-bold text-white">{detailModalBooking.status}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400 border-b border-slate-800/60">
                <span>Total Amount:</span>
                <span className="font-bold text-white">₹{Number(detailModalBooking.totalAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400 border-b border-slate-800/60">
                <span>Booked Date:</span>
                <span className="text-slate-200">{new Date(detailModalBooking.createdAt).toLocaleString()}</span>
              </div>
              {detailModalBooking.specialRequests && (
                <div className="py-1 text-slate-400 border-b border-slate-800/60">
                  <span className="block mb-1 font-semibold text-slate-300">Special Requests / Notes:</span>
                  <p className="text-slate-300 bg-slate-950 p-2 rounded-lg text-[11px]">
                    {detailModalBooking.specialRequests}
                  </p>
                </div>
              )}

              {/* Line Items */}
              {detailModalBooking.items && detailModalBooking.items.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-bold text-white mb-2">Booked Services & Inventory</h4>
                  <div className="space-y-1.5">
                    {detailModalBooking.items.map((it: any) => (
                      <div key={it.id} className="p-2 rounded-lg bg-slate-950 flex justify-between">
                        <div>
                          <p className="font-semibold text-white">{it.title}</p>
                          <p className="text-[10px] text-slate-400">Qty: {it.quantity}</p>
                        </div>
                        <p className="font-mono font-bold text-cyan-300">
                          ₹{Number(it.totalPrice).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setDetailModalBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <Link
                to={`/traveler/booking-confirmation/${detailModalBooking.id}`}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Printable Receipt
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION REQUEST MODAL */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-400" /> Request Cancellation
              </h3>
              <button onClick={() => setCancelModalBooking(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              You are requesting cancellation for booking{' '}
              <strong className="text-cyan-400">{cancelModalBooking.bookingReference}</strong> (₹
              {Number(cancelModalBooking.totalAmount).toLocaleString('en-IN')}).
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              <ShieldCheck className="w-4 h-4 inline mr-1.5 text-amber-400" />
              <strong>Escrow Protection Notice:</strong> In accordance with payment security regulations, refunds are not automatically processed merely upon user request. An administrator will review your cancellation within 24 hours.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Cancellation</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={handleRequestCancellation}
                disabled={submittingCancel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {submittingCancel ? 'Submitting...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelerDashboard;
