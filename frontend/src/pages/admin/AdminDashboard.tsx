import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services';
import {
  Users,
  Briefcase,
  DollarSign,
  ShieldCheck,
  MapPin,
  TrendingUp,
  CreditCard,
  History,
  ArrowRight,
  PlaneTakeoff,
  PlaneLanding,
  Search,
  Download,
  RefreshCw,
  Eye,
  Clock,
  Compass,
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  Camera,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { staggerContainer, staggerItem, fadeUp } from '../../utils/animations';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { downloadCsv } from '../../utils/exportCsv';

type DashboardTab = 'overview' | 'trips' | 'payments' | 'travellers' | 'revenue' | 'pending';

const paymentBadgeStyles: Record<string, { label: string; variant: 'cyan' | 'gold' | 'turquoise' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
  CAPTURED: { label: 'COMPLETED (ESCROW)', variant: 'success' },
  ESCROW_LOCKED: { label: 'ESCROW HELD', variant: 'cyan' },
  RELEASED: { label: 'RELEASED', variant: 'success' },
  CREATED: { label: 'PENDING CHECKOUT', variant: 'gold' },
  APPROVED: { label: 'APPROVED (AWAITING CAPTURE)', variant: 'warning' },
  REFUNDED: { label: 'REFUNDED', variant: 'neutral' },
  FAILED: { label: 'FAILED', variant: 'danger' },
  EXPIRED: { label: 'SESSION EXPIRED', variant: 'danger' },
  CANCELLED: { label: 'CANCELLED', variant: 'neutral' },
};

const tripStatusStyles: Record<string, { label: string; variant: 'cyan' | 'gold' | 'turquoise' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
  CONFIRMED: { label: 'CONFIRMED', variant: 'success' },
  COMPLETED: { label: 'COMPLETED', variant: 'neutral' },
  PROPOSED: { label: 'PROPOSED', variant: 'cyan' },
  DRAFT: { label: 'DRAFT', variant: 'gold' },
  CANCELLED: { label: 'CANCELLED', variant: 'danger' },
};

const PIE_COLORS = ['#10B981', '#F59E0B', '#00F2FE', '#EF4444', '#64748B', '#8B5CF6'];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 1. Overview Telemetry
  const [overviewData, setOverviewData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // 2. Recent Trips State
  const [trips, setTrips] = useState<any[]>([]);
  const [tripPage, setTripPage] = useState<number>(0);
  const [tripTotalPages, setTripTotalPages] = useState<number>(1);
  const [tripSearch, setTripSearch] = useState<string>('');
  const [tripStatusFilter, setTripStatusFilter] = useState<string>('');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState<boolean>(false);

  // 3. Recent Payment History State
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentPage, setPaymentPage] = useState<number>(0);
  const [paymentTotalPages, setPaymentTotalPages] = useState<number>(1);
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  // 4. Traveller Revenue State
  const [travellers, setTravellers] = useState<any[]>([]);
  const [travellerPage, setTravellerPage] = useState<number>(0);
  const [travellerTotalPages, setTravellerTotalPages] = useState<number>(1);
  const [travellerSearch, setTravellerSearch] = useState<string>('');
  const [selectedTravellerProfile, setSelectedTravellerProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [isTravellerModalOpen, setIsTravellerModalOpen] = useState<boolean>(false);

  // 5. Platform Revenue & Charts State
  const [revenueOverview, setRevenueOverview] = useState<any>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // 6. Pending Payments State
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [pendingPage, setPendingPage] = useState<number>(0);
  const [pendingTotalPages, setPendingTotalPages] = useState<number>(1);
  const [pendingSearch, setPendingSearch] = useState<string>('');
  const [pendingStatusFilter, setPendingStatusFilter] = useState<string>('');

  // Main Data Synchronization
  const fetchAllDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        overviewRes,
        analyticsRes,
        auditRes,
        tripsRes,
        paymentsRes,
        travellersRes,
        revenueRes,
        monthlyRes,
        pendingRes,
      ] = await Promise.all([
        adminService.getDashboardOverview(),
        adminService.getAnalytics(),
        adminService.getAuditLogs(15),
        adminService.getRecentTrips(tripPage, 10, tripSearch, tripStatusFilter),
        adminService.getRecentPayments(paymentPage, 10, paymentSearch, paymentStatusFilter),
        adminService.getTravellerRevenue(travellerPage, 10, travellerSearch),
        adminService.getRevenueOverview(),
        adminService.getMonthlyRevenue(selectedYear),
        adminService.getPendingPayments(pendingPage, 10, pendingSearch, pendingStatusFilter),
      ]);

      setOverviewData(overviewRes.data?.data);
      setAnalytics(analyticsRes.data?.data);
      setAuditLogs(auditRes.data?.data?.content || auditRes.data?.data?.logs || []);

      // Trips
      setTrips(tripsRes.data?.data?.content || []);
      setTripTotalPages(tripsRes.data?.data?.totalPages || 1);

      // Payments
      setPayments(paymentsRes.data?.data?.content || []);
      setPaymentTotalPages(paymentsRes.data?.data?.totalPages || 1);

      // Travellers
      setTravellers(travellersRes.data?.data?.content || []);
      setTravellerTotalPages(travellersRes.data?.data?.totalPages || 1);

      // Revenue & Charts
      setRevenueOverview(revenueRes.data?.data);
      setMonthlyRevenue(monthlyRes.data?.data?.monthlyData || []);

      // Pending
      setPendingPayments(pendingRes.data?.data?.content || []);
      setPendingTotalPages(pendingRes.data?.data?.totalPages || 1);

      if (isManual) toast.success('Admin Dashboard telemetry synchronized.');
    } catch (err) {
      console.error('Failed to load comprehensive admin dashboard telemetry:', err);
      if (isManual) toast.error('Failed to refresh some dashboard modules.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    tripPage,
    tripSearch,
    tripStatusFilter,
    paymentPage,
    paymentSearch,
    paymentStatusFilter,
    travellerPage,
    travellerSearch,
    selectedYear,
    pendingPage,
    pendingSearch,
    pendingStatusFilter,
    toast,
  ]);

  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  // Safe Payment Reconciliation Handler
  const handleReconcilePayment = async (paymentId: string) => {
    setReconcilingId(paymentId);
    try {
      const res = await adminService.reconcilePayment(paymentId);
      const data = res.data?.data;
      toast.success(data?.note || 'Payment reconciled with PayPal Sandbox records.');
      fetchAllDashboardData(false);
      if (selectedPayment && selectedPayment.id === paymentId) {
        setSelectedPayment((prev: any) => ({
          ...prev,
          paymentStatus: data?.reconciledStatus || prev.paymentStatus,
        }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Reconciliation failed.');
    } finally {
      setReconcilingId(null);
    }
  };

  // Inspect Traveller Revenue Profile
  const handleOpenTravellerProfile = async (travellerId: string) => {
    setIsTravellerModalOpen(true);
    setLoadingProfile(true);
    setSelectedTravellerProfile(null);
    try {
      const res = await adminService.getTravellerRevenueProfile(travellerId);
      setSelectedTravellerProfile(res.data?.data);
    } catch {
      toast.error('Failed to load traveller financial dossier.');
    } finally {
      setLoadingProfile(false);
    }
  };

  // CSV Export Handlers
  const exportTripsCsv = () => {
    const headers = [
      'Trip ID',
      'Title',
      'Traveller Name',
      'Traveller Email',
      'Destination',
      'Start Date',
      'End Date',
      'Travelers',
      'Style',
      'Budget (INR)',
      'Trip Status',
      'Booking Status',
      'Booking Reference',
    ];
    const rows = trips.map((t) => [
      t.id,
      t.title,
      t.travellerName,
      t.travellerEmail,
      t.destination,
      t.startDate,
      t.endDate,
      t.travelersCount,
      t.travelStyle,
      t.estimatedBudget,
      t.tripStatus,
      t.bookingStatus,
      t.bookingReference || 'None',
    ]);
    downloadCsv('WayRivo_Recent_Trips', headers, rows);
    toast.success('Recent Trips exported to CSV.');
  };

  const exportPaymentsCsv = () => {
    const headers = [
      'WayRivo Transaction ID',
      'PayPal Capture ID',
      'PayPal Order ID',
      'Traveller Name',
      'Traveller Email',
      'Booking Reference',
      'Amount',
      'Currency',
      'Provider',
      'Status',
      'Escrow Status',
      'Date',
      'Time',
    ];
    const rows = payments.map((p) => [
      p.wayrivoTransactionId,
      p.paypalCaptureId,
      p.paypalOrderId,
      p.travellerName,
      p.travellerEmail,
      p.bookingReference,
      p.paymentAmount,
      p.currency,
      p.paymentMethod,
      p.paymentStatus,
      p.escrowStatus,
      p.paymentDate,
      p.paymentTime,
    ]);
    downloadCsv('WayRivo_Payment_History', headers, rows);
    toast.success('Payment History exported to CSV.');
  };

  const exportTravellerRevenueCsv = () => {
    const headers = [
      'Traveller ID',
      'Traveller Name',
      'Traveller Email',
      'Total Trips',
      'Total Bookings',
      'Successful Payments',
      'Pending Payments',
      'Gross Captured (INR)',
      'Total Refunded (INR)',
      'Net Captured (INR)',
      'Total Pending (INR)',
      'Last Transaction Date',
    ];
    const rows = travellers.map((tr) => [
      tr.travellerId,
      tr.travellerName,
      tr.travellerEmail,
      tr.totalTrips,
      tr.totalBookings,
      tr.successfulPayments,
      tr.pendingPayments,
      tr.totalSuccessfullyPaid,
      tr.totalRefundedAmount,
      tr.netCapturedAmount,
      tr.totalPendingAmount,
      tr.lastTransactionDate,
    ]);
    downloadCsv('WayRivo_Traveller_Revenue', headers, rows);
    toast.success('Traveller Revenue Analytics exported to CSV.');
  };

  const exportPendingPaymentsCsv = () => {
    const headers = [
      'WayRivo TxID',
      'PayPal Order ID',
      'Traveller Name',
      'Traveller Email',
      'Booking Reference',
      'Destination',
      'Amount',
      'Currency',
      'Created Date',
      'Status',
      'Expired Flag',
      'Failure / Pending Reason',
    ];
    const rows = pendingPayments.map((p) => [
      p.wayrivoTransactionId,
      p.paypalOrderId,
      p.travellerName,
      p.travellerEmail,
      p.bookingReference,
      p.destination,
      p.paymentAmount,
      p.currency,
      p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : 'N/A',
      p.paymentStatus,
      p.isExpired ? 'EXPIRED' : 'ACTIVE',
      p.failureReason,
    ]);
    downloadCsv('WayRivo_Pending_Payments', headers, rows);
    toast.success('Pending Payments queue exported to CSV.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Synchronizing Supabase database telemetry...</p>
      </div>
    );
  }

  // 6 Primary Executive Cards
  const cards = overviewData || {};
  const primarySixCards = [
    {
      title: 'TOTAL TRIPS',
      mainNumber: cards.trips?.total ?? 0,
      isCurrency: false,
      icon: Compass,
      color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
      badge: 'TRAVEL VOLUME',
      subStats: [
        { label: 'Confirmed', val: cards.trips?.confirmed ?? 0, color: 'text-emerald-400' },
        { label: 'Completed', val: cards.trips?.completed ?? 0, color: 'text-slate-300' },
        { label: 'Cancelled', val: cards.trips?.cancelled ?? 0, color: 'text-rose-400' },
      ],
    },
    {
      title: 'TOTAL BOOKINGS',
      mainNumber: cards.bookings?.total ?? 0,
      isCurrency: false,
      icon: Briefcase,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30',
      badge: 'RESERVATIONS',
      subStats: [
        { label: 'Confirmed', val: cards.bookings?.confirmed ?? 0, color: 'text-emerald-400' },
        { label: 'Pending', val: cards.bookings?.pending ?? 0, color: 'text-amber-400' },
        { label: 'Cancelled', val: cards.bookings?.cancelled ?? 0, color: 'text-rose-400' },
      ],
    },
    {
      title: 'TOTAL PAYMENTS',
      mainNumber: cards.payments?.totalCount ?? 0,
      isCurrency: false,
      icon: CreditCard,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      badge: 'PAYPAL SDK',
      subStats: [
        { label: 'Successful', val: cards.payments?.successful ?? 0, color: 'text-emerald-400' },
        { label: 'Pending', val: cards.payments?.pending ?? 0, color: 'text-amber-400' },
        { label: 'Refunded', val: cards.payments?.refunded ?? 0, color: 'text-purple-400' },
      ],
    },
    {
      title: 'TOTAL REVENUE',
      mainNumber: cards.revenue?.netCaptured ?? 0,
      isCurrency: true,
      icon: DollarSign,
      color: 'from-emerald-500/20 to-emerald-950/30 text-emerald-300 border-emerald-500/40',
      badge: 'NET CAPTURED',
      subStats: [
        { label: 'This Month', val: `₹${(cards.revenue?.currentMonth ?? 0).toLocaleString('en-IN')}`, color: 'text-cyan-300' },
        { label: 'This Year', val: `₹${(cards.revenue?.currentYear ?? 0).toLocaleString('en-IN')}`, color: 'text-emerald-300' },
        { label: 'USD Eq.', val: `$${((cards.revenue?.netCaptured ?? 0) / 83.5).toFixed(0)}`, color: 'text-amber-300' },
      ],
    },
    {
      title: 'PENDING PAYMENTS',
      mainNumber: cards.pendingPayments?.count ?? 0,
      isCurrency: false,
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
      badge: 'UNSETTLED',
      subStats: [
        { label: 'Pending Volume', val: `₹${(cards.pendingPayments?.totalAmount ?? 0).toLocaleString('en-IN')}`, color: 'text-amber-400' },
        { label: 'Awaiting', val: `${cards.pendingPayments?.bookingsAwaitingPayment ?? 0} bookings`, color: 'text-slate-300' },
      ],
    },
    {
      title: 'ACTIVE TRAVELLERS',
      mainNumber: cards.activeTravellers?.totalRegistered ?? 0,
      isCurrency: false,
      icon: Users,
      color: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30',
      badge: 'CUSTOMER BASE',
      subStats: [
        { label: 'With Trips', val: cards.activeTravellers?.withTrips ?? 0, color: 'text-cyan-300' },
        { label: 'With Bookings', val: cards.activeTravellers?.withConfirmedBookings ?? 0, color: 'text-emerald-400' },
      ],
    },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* 1. Header & Live Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Admin Avatar with Photo Upload Shortcut */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-purple-500/20 border border-purple-400/40 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user?.name || 'Administrator'} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                )}
              </div>
              <Link
                to="/admin/profile"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:brightness-110 shadow-lg cursor-pointer transition-all border border-purple-300/40"
                title="Change admin profile photo"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </Link>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Platform Security & Financial Intelligence
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Executive Admin & <span className="text-gradient-cyan">Financial Analytics</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Supervise all traveler trip itineraries, PayPal Developer Sandbox escrow captures, pending transactions, traveler-wise revenue distribution, and operational reconciliation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/profile"
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 hover:text-white font-semibold text-xs border border-purple-500/40 flex items-center gap-1.5 shadow transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-purple-400" /> Admin Profile & Photo
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAllDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-slate-300 border-slate-700 hover:bg-slate-800 cursor-pointer shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh Telemetry'}</span>
            </Button>
            <Link
              to="/admin/users"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5 shadow"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" /> Users ({cards.activeTravellers?.totalRegistered || 0})
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Enhanced Phase 2: 6 Summary Overview Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {primarySixCards.map((c) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.title}
              variants={staggerItem}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-2xl bg-gradient-to-br ${c.color} bg-slate-900 border shadow-lg space-y-2 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{c.title}</span>
                  <div className="p-1.5 rounded-lg bg-slate-950/40 border border-white/5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-center mt-1">
                  {c.isCurrency && <span className="text-sm mr-0.5">₹</span>}
                  <AnimatedCounter value={c.mainNumber} />
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-0.5">
                {c.subStats.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{s.label}:</span>
                    <span className={`font-bold font-mono ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 3. Section Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview & Charts', icon: TrendingUp },
          { key: 'trips', label: `Recent Trips (${cards.trips?.total || trips.length})`, icon: Compass },
          { key: 'payments', label: `Payment History (${cards.payments?.totalCount || payments.length})`, icon: CreditCard },
          { key: 'travellers', label: `Traveller Revenue (${travellers.length})`, icon: Users },
          { key: 'revenue', label: 'Platform Revenue', icon: DollarSign },
          { key: 'pending', label: `Pending Payments (${cards.pendingPayments?.count || pendingPayments.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as DashboardTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: EXECUTIVE OVERVIEW & CHARTS */}
      {activeTab === 'overview' && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-8">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Booking & Revenue Velocity */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> Booking & Revenue Timeline
                  </h3>
                  <p className="text-[11px] text-slate-400">Captured payments and bookings over time</p>
                </div>
                <Badge variant="success" size="sm">Live PostgreSQL Synced</Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.bookingTrends || []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#00F2FE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#00F2FE', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#00F2FE" fillOpacity={1} fill="url(#colorRev)" name="Revenue (₹)" />
                    <Area type="monotone" dataKey="bookings" stroke="#38bdf8" fill="#38bdf8" name="Bookings" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Popular Destination Performance */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" /> Popular Destination Revenue
                  </h3>
                  <p className="text-[11px] text-slate-400">Total volume by catalog destination</p>
                </div>
                <Badge variant="cyan" size="sm">Top Destinations</Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.popularDestinations || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#00F2FE', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="revenue" fill="#4FACFE" name="Revenue (₹)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="bookingCount" fill="#FAD961" name="Bookings" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Previews Row: Recent Trips & Payments Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Trips Quick View */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" /> Latest Trip Requests & Itineraries
                  </h3>
                  <p className="text-[11px] text-slate-400">Recent itineraries submitted by registered travelers</p>
                </div>
                <button
                  onClick={() => setActiveTab('trips')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  View all ({trips.length}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] font-bold uppercase">
                    <tr>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Traveler</th>
                      <th className="p-3 text-right">Budget</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {trips.slice(0, 5).map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => {
                          setSelectedTrip(t);
                          setIsTripModalOpen(true);
                        }}
                        className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                      >
                        <td className="p-3 font-semibold text-white max-w-[150px] truncate">{t.destination}</td>
                        <td className="p-3 text-slate-300 max-w-[120px] truncate">{t.travellerName}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          ₹{Number(t.estimatedBudget || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={tripStatusStyles[t.tripStatus]?.variant || 'neutral'} size="sm">
                            {t.tripStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Payments Quick View */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" /> Recent PayPal Escrow Transactions
                  </h3>
                  <p className="text-[11px] text-slate-400">Verified captures and pending session telemetry</p>
                </div>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  View all ({payments.length}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] font-bold uppercase">
                    <tr>
                      <th className="p-3">TxID</th>
                      <th className="p-3">Traveler</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {payments.slice(0, 5).map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => {
                          setSelectedPayment(p);
                          setIsPaymentModalOpen(true);
                        }}
                        className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                      >
                        <td className="p-3 font-mono font-bold text-cyan-400">{p.wayrivoTransactionId}</td>
                        <td className="p-3 text-slate-300 max-w-[120px] truncate">{p.travellerName}</td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          ₹{Number(p.paymentAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={paymentBadgeStyles[p.paymentStatus]?.variant || 'neutral'} size="sm">
                            {p.paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" /> Platform Security & Financial Audit Trail
                </h3>
                <p className="text-[11px] text-slate-400">Immutable PostgreSQL audit records for financial and admin actions</p>
              </div>
              <span className="text-xs text-slate-400">{auditLogs.length} recent records</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Entity ID</th>
                    <th className="p-3">Initiator</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {auditLogs.slice(0, 6).map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-bold text-white">{log.action}</td>
                      <td className="p-3 text-slate-400">{log.entityType}</td>
                      <td className="p-3 font-mono text-[11px] text-cyan-400">{log.entityId}</td>
                      <td className="p-3 text-slate-300">{log.user?.name || log.user?.email || 'System Admin'}</td>
                      <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: RECENT TRIPS TABLE (PHASE 3) */}
      {activeTab === 'trips' && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" /> Recent Trips Monitor
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full traveler itineraries, destination details, booking state, and budget specifications
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search traveler, email, ID..."
                  value={tripSearch}
                  onChange={(e) => setTripSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={tripStatusFilter}
                onChange={(e) => setTripStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROPOSED">Proposed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={exportTripsCsv}
                className="flex items-center gap-1.5 text-xs border-slate-700 hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Trip ID</th>
                    <th className="py-3 px-4">Traveller</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Travel Dates</th>
                    <th className="py-3 px-4">Party</th>
                    <th className="py-3 px-4 text-right">Budget</th>
                    <th className="py-3 px-4 text-center">Booking Status</th>
                    <th className="py-3 px-4 text-center">Created</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                        No trips found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    trips.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400">#{t.id.slice(-6)}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{t.travellerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{t.travellerEmail}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-200">{t.destination}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono">
                          {t.startDate} → {t.endDate}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{t.travelersCount} Guests</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ₹{Number(t.estimatedBudget || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={tripStatusStyles[t.bookingStatus]?.variant || 'neutral'} size="sm">
                            {t.bookingStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTrip(t);
                              setIsTripModalOpen(true);
                            }}
                            className="text-xs text-cyan-400 hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {tripTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Page {tripPage + 1} of {tripTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={tripPage === 0}
                  onClick={() => setTripPage(Math.max(0, tripPage - 1))}
                  className="text-xs text-slate-300 border-slate-800"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={tripPage >= tripTotalPages - 1}
                  onClick={() => setTripPage(tripPage + 1)}
                  className="text-xs text-slate-300 border-slate-800"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 3: RECENT PAYMENT HISTORY (PHASE 4) */}
      {activeTab === 'payments' && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" /> Recent Payment History
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified 12-Digit WayRivo TxIDs, PayPal Capture IDs, buyer reconciliation, and Escrow status
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search TxID, Capture ID, Ref..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Statuses</option>
                <option value="CAPTURED">Captured / Completed</option>
                <option value="CREATED">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REFUNDED">Refunded</option>
                <option value="FAILED">Failed</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={exportPaymentsCsv}
                className="flex items-center gap-1.5 text-xs border-slate-700 hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">WayRivo TxID</th>
                    <th className="py-3 px-4">PayPal Capture ID</th>
                    <th className="py-3 px-4">PayPal Order ID</th>
                    <th className="py-3 px-4">Traveller</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4 text-center">Date & Time</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-xs text-slate-400">
                        No payments found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const cfg = paymentBadgeStyles[p.paymentStatus] || { label: p.paymentStatus, variant: 'neutral' };
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                            {p.wayrivoTransactionId}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400 whitespace-nowrap">
                            {p.paypalCaptureId}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                            {p.paypalOrderId}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-white block">{p.travellerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{p.travellerEmail}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                            {p.bookingReference}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-white whitespace-nowrap">
                            ₹{Number(p.paymentAmount || 0).toLocaleString('en-IN')}
                            <span className="text-[10px] text-slate-400 ml-1">({p.currency})</span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{p.paymentMethod}</td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="text-white block">{p.paymentDate}</span>
                            <span className="text-[10px] text-slate-500 block">{p.paymentTime}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={cfg.variant} size="sm">
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(p);
                                setIsPaymentModalOpen(true);
                              }}
                              className="text-xs text-cyan-400 hover:text-white"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {paymentTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Page {paymentPage + 1} of {paymentTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paymentPage === 0}
                  onClick={() => setPaymentPage(Math.max(0, paymentPage - 1))}
                  className="text-xs text-slate-300 border-slate-800"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paymentPage >= paymentTotalPages - 1}
                  onClick={() => setPaymentPage(paymentPage + 1)}
                  className="text-xs text-slate-300 border-slate-800"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 4: TRAVELLER-WISE REVENUE ANALYTICS (PHASE 5) */}
      {activeTab === 'travellers' && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Traveller Revenue Analytics
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact financial performance by traveller: verified net captures, gross bookings, refunds, and pending pipelines
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search traveler by name or email..."
                  value={travellerSearch}
                  onChange={(e) => setTravellerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={exportTravellerRevenueCsv}
                className="flex items-center gap-1.5 text-xs border-slate-700 hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Traveller</th>
                    <th className="py-3 px-4 text-center">Trips</th>
                    <th className="py-3 px-4 text-center">Bookings</th>
                    <th className="py-3 px-4 text-center">Successful Pymts</th>
                    <th className="py-3 px-4 text-center">Pending Pymts</th>
                    <th className="py-3 px-4 text-right">Gross Paid</th>
                    <th className="py-3 px-4 text-right">Refunded</th>
                    <th className="py-3 px-4 text-right text-emerald-400">Net Captured</th>
                    <th className="py-3 px-4 text-right text-amber-400">Pending Amount</th>
                    <th className="py-3 px-4 text-center">Last Activity</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {travellers.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-xs text-slate-400">
                        No traveler records located.
                      </td>
                    </tr>
                  ) : (
                    travellers.map((tr) => (
                      <tr key={tr.travellerId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleOpenTravellerProfile(tr.travellerId)}
                            className="text-left group cursor-pointer"
                          >
                            <span className="font-bold text-white group-hover:text-cyan-400 transition-colors block">
                              {tr.travellerName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">{tr.travellerEmail}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-200">{tr.totalTrips}</td>
                        <td className="py-3 px-4 text-center font-bold text-cyan-300">{tr.totalBookings}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">{tr.successfulPayments}</td>
                        <td className="py-3 px-4 text-center font-bold text-amber-400">{tr.pendingPayments}</td>
                        <td className="py-3 px-4 text-right font-mono text-white font-medium">
                          ₹{Number(tr.totalSuccessfullyPaid || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-purple-400">
                          ₹{Number(tr.totalRefundedAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                          ₹{Number(tr.netCapturedAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-400 font-semibold">
                          ₹{Number(tr.totalPendingAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 whitespace-nowrap font-mono">
                          {tr.lastTransactionDate}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenTravellerProfile(tr.travellerId)}
                            className="text-xs text-cyan-400 hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Profile
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {travellerTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Page {travellerPage + 1} of {travellerTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={travellerPage === 0}
                  onClick={() => setTravellerPage(Math.max(0, travellerPage - 1))}
                  className="text-xs text-slate-300 border-slate-800"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={travellerPage >= travellerTotalPages - 1}
                  onClick={() => setTravellerPage(travellerPage + 1)}
                  className="text-xs text-slate-300 border-slate-800"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 5: PLATFORM REVENUE ANALYTICS & CHARTS (PHASE 6 & 7) */}
      {activeTab === 'revenue' && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
          {/* Revenue Summary KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Gross Captured</span>
              <div className="text-2xl font-black text-white font-mono">
                ₹{Number(revenueOverview?.grossCaptured || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-slate-400">Verified PayPal Escrow Deposits</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Refunded</span>
              <div className="text-2xl font-black text-purple-400 font-mono">
                ₹{Number(revenueOverview?.refundedAmount || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-slate-400">Processed refund transactions</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-400 block">Net Captured Revenue</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                ₹{Number(revenueOverview?.netCaptured || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-emerald-300/80">Gross Captured minus Refunds</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 block">Pending Pipeline Amount</span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                ₹{Number(revenueOverview?.pendingAmount || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-slate-400">Unsettled checkout sessions</p>
            </div>
          </div>

          {/* Notice on Commission Integrity */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>
                <strong>Platform Accounting Principle:</strong> Displaying verified <strong>Total Booking Payment Volume</strong> and <strong>Net Captured Escrow Amount</strong>. Platform does not fabricate arbitrary commission margins.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportTravellerRevenueCsv}
              className="text-xs border-slate-700"
            >
              <Download className="w-3 h-3 mr-1" /> Export Revenue Dossier
            </Button>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Monthly Captured Revenue */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> Monthly Captured Payments ({selectedYear})
                  </h3>
                  <p className="text-[11px] text-slate-400">Monthly breakdown of successful PayPal deposits</p>
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                >
                  <option value={2026}>Year 2026</option>
                  <option value={2027}>Year 2027</option>
                  <option value={2025}>Year 2025</option>
                </select>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#00F2FE', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="revenue" fill="#10B981" name="Captured (₹)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Payment Status Distribution */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-cyan-400" /> Payment Status Distribution
                  </h3>
                  <p className="text-[11px] text-slate-400">Total volume distributed by transaction state</p>
                </div>
                <Badge variant="cyan" size="sm">Audit Distribution</Badge>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={revenueOverview?.distribution || []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {(revenueOverview?.distribution || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Legend
                      formatter={(val) => <span className="text-xs text-slate-300 font-mono">{val}</span>}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 6: PENDING PAYMENTS MANAGEMENT (PHASE 8) */}
      {activeTab === 'pending' && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Pending Payments & Reconciliation Queue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor unconfirmed checkout sessions, expired timers, and reconcile against PayPal Sandbox API
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search buyer, order ID, TxID..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={pendingStatusFilter}
                onChange={(e) => setPendingStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Pending States</option>
                <option value="CREATED">Created (Awaiting Click)</option>
                <option value="APPROVED">Approved (Awaiting Capture)</option>
                <option value="EXPIRED">Session Expired</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={exportPendingPaymentsCsv}
                className="flex items-center gap-1.5 text-xs border-slate-700 hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">WayRivo TxID</th>
                    <th className="py-3 px-4">PayPal Order ID</th>
                    <th className="py-3 px-4">Traveller</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Session State</th>
                    <th className="py-3 px-4">Pending / Failure Reason</th>
                    <th className="py-3 px-4 text-right">Reconciliation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {pendingPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                        No pending or failed payment sessions in queue.
                      </td>
                    </tr>
                  ) : (
                    pendingPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                          {p.wayrivoTransactionId}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{p.paypalOrderId}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{p.travellerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{p.travellerEmail}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-200">{p.destination}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                          ₹{Number(p.paymentAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {p.isExpired ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              EXPIRED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              ACTIVE (PENDING)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-400 max-w-xs truncate">{p.failureReason}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(p);
                              setIsPaymentModalOpen(true);
                            }}
                            className="text-xs text-cyan-400 hover:text-white"
                          >
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={reconcilingId === p.id}
                            onClick={() => handleReconcilePayment(p.id)}
                            className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 mr-1 ${reconcilingId === p.id ? 'animate-spin' : ''}`} />
                            Reconcile
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pendingTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Page {pendingPage + 1} of {pendingTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingPage === 0}
                  onClick={() => setPendingPage(Math.max(0, pendingPage - 1))}
                  className="text-xs text-slate-300 border-slate-800"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingPage >= pendingTotalPages - 1}
                  onClick={() => setPendingPage(pendingPage + 1)}
                  className="text-xs text-slate-300 border-slate-800"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* =========================================================================
          MODAL 1: TRIP DETAILS INSPECTION MODAL (PHASE 3)
      ========================================================================= */}
      <Modal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        title={selectedTrip ? `Trip #${selectedTrip.id.slice(-8)} Details` : 'Trip Information'}
        subtitle="Full traveler itinerary details, selected excursions, and booking linkage"
      >
        {selectedTrip && (
          <div className="space-y-5 text-xs pt-1">
            {/* Identity & Status */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest">
                  Destination Target
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedTrip.destination}</h3>
                <p className="text-[11px] text-slate-400">Origin: {selectedTrip.sourceLocation}</p>
              </div>
              <div>
                <Badge variant={tripStatusStyles[selectedTrip.tripStatus]?.variant || 'neutral'} size="sm">
                  {selectedTrip.tripStatus}
                </Badge>
              </div>
            </div>

            {/* Traveler Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Traveler Information</span>
                <p className="font-bold text-white text-sm">{selectedTrip.travellerName}</p>
                <p className="text-slate-400 font-mono text-[11px]">{selectedTrip.travellerEmail}</p>
                <p className="text-slate-500 text-[11px]">Phone: {selectedTrip.travellerPhone}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Travel Timeline</span>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <PlaneTakeoff className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Departure: {selectedTrip.startDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <PlaneLanding className="w-3.5 h-3.5 text-teal-400" />
                  <span>Return: {selectedTrip.endDate}</span>
                </div>
                <p className="text-slate-400 text-[11px]">{selectedTrip.numberOfDays} Days • {selectedTrip.travelersCount} Guests</p>
              </div>
            </div>

            {/* Trip Specs */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Travel Style</span>
                <span className="font-bold text-cyan-300">{selectedTrip.travelStyle}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Estimated Budget</span>
                <span className="font-mono font-black text-white text-sm">
                  ₹{Number(selectedTrip.estimatedBudget || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">USD Equivalent</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ${(Number(selectedTrip.estimatedBudget || 0) / 83.5).toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Booking & Payment Details */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Associated Reservation & Payment</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Booking Reference:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedTrip.bookingReference || 'NO_BOOKING'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Booking Status:</span>
                  <span className="font-semibold text-white">{selectedTrip.bookingStatus}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Status:</span>
                  <span className="font-semibold text-emerald-400">{selectedTrip.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">TxID:</span>
                  <span className="font-mono text-slate-300">{selectedTrip.paymentTransactionId || 'Awaiting Payment'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* =========================================================================
          MODAL 2: PAYMENT DETAILS INSPECTION MODAL (PHASE 4)
      ========================================================================= */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={selectedPayment ? `Payment Record: ${selectedPayment.wayrivoTransactionId}` : 'Payment Details'}
        subtitle="Reconciliation telemetry, PayPal Capture verification, and traveler audit"
      >
        {selectedPayment && (
          <div className="space-y-5 text-xs pt-1">
            {/* Payment Header */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest block">
                  WayRivo Transaction ID (12-Digit)
                </span>
                <h3 className="text-lg font-black text-white font-mono mt-0.5">{selectedPayment.wayrivoTransactionId}</h3>
                <p className="text-slate-400 text-[11px]">Provider: {selectedPayment.paymentMethod}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 font-mono block">
                  ₹{Number(selectedPayment.paymentAmount || 0).toLocaleString('en-IN')}
                </span>
                <Badge
                  variant={paymentBadgeStyles[selectedPayment.paymentStatus]?.variant || 'neutral'}
                  size="sm"
                >
                  {selectedPayment.paymentStatus}
                </Badge>
              </div>
            </div>

            {/* IDs & Reconciliation Record */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Gateway Identifiers</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">PayPal Capture ID:</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedPayment.paypalCaptureId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">PayPal Order ID:</span>
                  <span className="font-mono text-cyan-300">{selectedPayment.paypalOrderId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Booking Reference:</span>
                  <span className="font-mono text-white">{selectedPayment.bookingReference}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Escrow State:</span>
                  <span className="font-bold text-cyan-400">{selectedPayment.escrowStatus || 'HELD'}</span>
                </div>
              </div>
            </div>

            {/* Buyer Context */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Payer / Traveler</span>
              <p className="font-bold text-white text-sm">{selectedPayment.travellerName}</p>
              <p className="text-slate-400 font-mono text-[11px]">{selectedPayment.travellerEmail}</p>
              <p className="text-slate-400 text-[11px]">Destination: {selectedPayment.destination}</p>
            </div>

            {/* Reconcile Action Button */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Safe Audit Reconciliation</span>
                <span className="text-[11px] text-slate-400">Verifies transaction state against PayPal records without duplicates.</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={reconcilingId === selectedPayment.id}
                onClick={() => handleReconcilePayment(selectedPayment.id)}
                className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${reconcilingId === selectedPayment.id ? 'animate-spin' : ''}`} />
                Reconcile
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =========================================================================
          MODAL 3: TRAVELLER REVENUE PROFILE (PHASE 5)
      ========================================================================= */}
      <Modal
        isOpen={isTravellerModalOpen}
        onClose={() => setIsTravellerModalOpen(false)}
        title={selectedTravellerProfile ? `Traveller Financial Profile: ${selectedTravellerProfile.profile?.name}` : 'Traveller Profile'}
        subtitle="Individual financial dossier, net captured bookings, refund balance, and trip history"
      >
        {loadingProfile ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-2">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading traveler financial records...</p>
          </div>
        ) : selectedTravellerProfile ? (
          <div className="space-y-5 text-xs pt-1">
            {/* Profile Overview */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0">
                  {selectedTravellerProfile.profile?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedTravellerProfile.profile?.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedTravellerProfile.profile?.email}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Registered: {new Date(selectedTravellerProfile.profile?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant="cyan" size="sm">TRAVELER DOSSIER</Badge>
            </div>

            {/* Financial Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Gross Paid</span>
                <span className="font-bold text-white text-sm font-mono">
                  ₹{Number(selectedTravellerProfile.financialSummary?.totalSuccessfullyPaid || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Refunded</span>
                <span className="font-bold text-purple-400 text-sm font-mono">
                  ₹{Number(selectedTravellerProfile.financialSummary?.totalRefundedAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 block font-bold">Net Captured</span>
                <span className="font-black text-emerald-400 text-base font-mono">
                  ₹{Number(selectedTravellerProfile.financialSummary?.netCapturedAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-amber-400 block">Pending</span>
                <span className="font-bold text-amber-400 text-sm font-mono">
                  ₹{Number(selectedTravellerProfile.financialSummary?.totalPendingAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-500 block">Trips Created:</span>
                <span className="font-bold text-white text-sm">{selectedTravellerProfile.activity?.totalTrips || 0}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Bookings:</span>
                <span className="font-bold text-cyan-400 text-sm">{selectedTravellerProfile.activity?.totalBookings || 0}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Avg Booking Val:</span>
                <span className="font-bold text-emerald-400 text-sm">₹{selectedTravellerProfile.financialSummary?.averageBookingValue?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Successful Pymts:</span>
                <span className="font-bold text-white text-sm">{selectedTravellerProfile.financialSummary?.totalSuccessfulPayments || 0}</span>
              </div>
            </div>

            {/* Payment History List */}
            <div className="space-y-2">
              <span className="font-bold text-white block">Verified Transactions</span>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[9px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-2">TxID</th>
                      <th className="p-2">Booking Ref</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {selectedTravellerProfile.paymentHistory?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-slate-500">No payment records logged.</td>
                      </tr>
                    ) : (
                      selectedTravellerProfile.paymentHistory?.map((ph: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2 font-mono text-cyan-400 font-bold">{ph.transactionId}</td>
                          <td className="p-2 text-slate-300 font-mono">{ph.bookingReference}</td>
                          <td className="p-2 text-right font-mono font-bold text-white">₹{Number(ph.amount).toLocaleString('en-IN')}</td>
                          <td className="p-2 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">
                              {ph.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">No profile data available.</div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
