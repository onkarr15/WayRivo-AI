import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookingService, paymentService } from '../../services';
import {
  Briefcase,
  Calendar,
  MapPin,
  ShieldCheck,
  CreditCard,
  FileText,
  AlertCircle,
  ArrowRight,
  X,
  PlaneTakeoff,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

const statusBadgeStyles: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ESCROW_HOLD: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  PENDING_PAYMENT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
  REFUNDED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const Bookings: React.FC = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  // Cancellation Modal State
  const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Personal schedule conflict');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await bookingService.getMy();
      const list = res.data?.data?.bookings || res.data?.data || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load traveler bookings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRequestCancellation = async () => {
    if (!cancelingBookingId) return;
    setIsSubmittingCancel(true);
    try {
      const res = await paymentService.requestCancellation(cancelingBookingId, cancelReason);
      toast.success(res.data?.data?.message || 'Cancellation request submitted for escrow review.');
      setCancelingBookingId(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit cancellation request.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleCancelUnpaid = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this unpaid reservation? You can re-book anytime.')) {
      return;
    }
    try {
      await bookingService.cancelUnpaid(bookingId);
      toast.success('Unpaid reservation cancelled successfully.');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel unpaid booking.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING_PAYMENT');
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'ESCROW_HOLD');
  const otherBookings = bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REFUNDED');

  const filteredBookings =
    filter === 'pending'
      ? pendingBookings
      : filter === 'confirmed'
      ? confirmedBookings
      : filter === 'cancelled'
      ? otherBookings
      : bookings;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Trips & <span className="text-gradient-cyan">Bookings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your verified travel reservations and PayPal Escrow deposits
          </p>
        </div>

        <Link
          to="/itinerary-planner"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
        >
          Plan New Itinerary <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Action Required Callout for Pending Bookings */}
      {pendingBookings.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Action Required • {pendingBookings.length} {pendingBookings.length === 1 ? 'Booking' : 'Bookings'} Awaiting Checkout
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Complete your PayPal deposit to confirm reservation details and lock in specialist escrow coverage.
              </p>
            </div>
          </div>
          {filter !== 'pending' && (
            <button
              onClick={() => setFilter('pending')}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 self-start sm:self-auto cursor-pointer shadow-md shadow-amber-400/20"
            >
              Filter Pending ({pendingBookings.length})
            </button>
          )}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
            filter === 'all'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All ({bookings.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
            filter === 'pending'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
              : 'bg-amber-500/10 text-amber-400 hover:text-amber-300 border border-amber-500/20'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Pending Payment ({pendingBookings.length})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
            filter === 'confirmed'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Confirmed & Escrow ({confirmedBookings.length})
        </button>
        {otherBookings.length > 0 && (
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'cancelled'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Cancelled / Refunded ({otherBookings.length})
          </button>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Bookings Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Your planned vacations, hotel reservations, and excursions will appear here once booked.
          </p>
          <Link
            to="/itinerary-planner"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30"
          >
            Explore AI Travel Planner
          </Link>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          <p className="text-xs font-semibold">No bookings match the selected filter ({filter}).</p>
          <button
            onClick={() => setFilter('all')}
            className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-300 text-xs font-semibold"
          >
            Show All Bookings
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b: any) => {
            const isConfirmed = b.status === 'CONFIRMED' || b.status === 'ESCROW_HOLD';
            const isPending = b.status === 'PENDING_PAYMENT';
            const isRefunded = b.status === 'REFUNDED';
            const isCancelled = b.status === 'CANCELLED';

            return (
              <div
                key={b.id}
                className={`p-5 sm:p-6 rounded-2xl transition-all shadow-lg ${
                  isPending
                    ? 'bg-slate-900/95 border-2 border-amber-500/40 shadow-amber-500/5'
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
                          statusBadgeStyles[b.status] || 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {(b.status || 'CONFIRMED') === 'ESCROW_HOLD' ? 'Escrow Secured' : (b.status || 'CONFIRMED').replace('_', ' ')}
                      </span>

                      {b.payment?.paypalCaptureId && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Capture: {b.payment.paypalCaptureId}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {b.itinerary?.title || `Reservation ${b.bookingReference}`}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {b.departureLocation && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <PlaneTakeoff className="w-3.5 h-3.5 text-cyan-400" />
                          From: <strong className="text-white font-semibold">{b.departureLocation}</strong>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-teal-400" />
                        To: <strong className="text-white font-semibold">{b.destinationLocation || b.itinerary?.destination?.name || 'India'}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {b.itinerary?.startDate
                          ? `Start: ${new Date(b.itinerary.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : `Booked: ${new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      </span>
                      <span className="font-black text-cyan-300 text-sm">
                        ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {b.items && b.items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {b.items.map((item: any, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-slate-300 border border-slate-800"
                          >
                            {item.title} (×{item.quantity})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                    <Link
                      to={`/traveler/booking-confirmation/${b.id}`}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {isConfirmed ? 'View Escrow Receipt' : 'Review Booking'}
                    </Link>

                    {isPending && (
                      <>
                        <button
                          onClick={() => handleCancelUnpaid(b.id)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-semibold text-xs border border-slate-700 hover:border-red-500/30 cursor-pointer transition-colors"
                        >
                          Cancel Booking
                        </button>
                        <Link
                          to={`/traveler/booking-confirmation/${b.id}`}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Complete PayPal Deposit
                        </Link>
                      </>
                    )}

                    {isConfirmed && (
                      <button
                        onClick={() => {
                          setCancelingBookingId(b.id);
                          setCancelReason('Travel plan change');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-950/50 text-red-400 font-semibold text-xs border border-red-800/40 cursor-pointer"
                      >
                        Request Cancellation
                      </button>
                    )}

                    {isCancelled && (
                      <span className="px-3 py-1.5 rounded-xl bg-red-950/30 text-red-400 text-xs font-semibold border border-red-800/40">
                        Cancelled
                      </span>
                    )}

                    {isRefunded && (
                      <span className="px-3 py-1.5 rounded-xl bg-purple-950/30 text-purple-300 text-xs font-semibold border border-purple-800/40">
                        Refunded to PayPal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Request Modal (Part D - Does not auto-refund) */}
      {cancelingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" /> Request Booking Cancellation
              </h3>
              <button
                onClick={() => setCancelingBookingId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with WayRivo platform integrity rules, funds are held in PayPal Escrow. Submitting a cancellation notifies our administrative escrow team to verify eligibility and process a refund to your original PayPal account.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                placeholder="Please state why you are cancelling..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelingBookingId(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Keep Booking
              </button>

              <button
                onClick={handleRequestCancellation}
                disabled={isSubmittingCancel}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmittingCancel ? 'Submitting...' : 'Submit Escrow Cancellation Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
