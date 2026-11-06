import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Lock,
  AlertCircle,
  Copy,
  Check,
  PlaneTakeoff,
} from 'lucide-react';
import { paymentService } from '../../services';
import { useToast } from '../../components/ui/Toast';

export const PaymentDetailsPage: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!paymentId) return;

    setLoading(true);
    paymentService
      .getPaymentDetails(paymentId)
      .then((res) => {
        if (isMounted) {
          setPayment(res.data?.data);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load payment details:', err);
        if (isMounted) {
          setError(
            err.response?.data?.error ||
              'Payment record not found or you are not authorized to view this transaction.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [paymentId]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-slate-400">Loading verified payment receipt...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Payment Record Unavailable</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Unable to locate this payment record.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/traveler/bookings"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              My Bookings
            </Link>
            <Link
              to="/traveler/dashboard"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const booking = payment.booking;
  const itinerary = booking?.itinerary;
  const captureId = payment.paypalCaptureId || 'PENDING_CAPTURE';
  const orderId = payment.paypalOrderId || 'PENDING_ORDER';
  const paymentDate = new Date(payment.createdAt || Date.now()).toLocaleString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Bar (Hidden during print) */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            {payment.bookingId && (
              <Link
                to={`/traveler/booking-confirmation/${payment.bookingId}`}
                className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors"
              >
                View Trip Details
              </Link>
            )}
          </div>
        </div>

        {/* Main Printable Transaction Receipt Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-10 relative overflow-hidden print:border-none print:shadow-none print:bg-white print:p-6 print:text-black">
          {/* Top Brand Watermark & Escrow Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4 print:border-slate-300">
            <div>
              <div className="flex items-center gap-1.5 text-2xl font-black tracking-wider text-white print:text-black">
                WAY<span className="text-cyan-400 print:text-cyan-700">RIVO</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 print:border-slate-300 print:text-slate-700">
                  AI 2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                Official Electronic Payment Receipt & Escrow Guarantee
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 print:border-emerald-600 print:text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-400 print:text-emerald-700" />
                {payment.status === 'CAPTURED' ? 'PAYMENT COMPLETED' : payment.status}
              </span>
              <span className="block text-[11px] text-slate-400 print:text-slate-600 mt-1">
                Merchant: <strong>{payment.merchantName || 'WayRivo AI 2.0'}</strong>
              </span>
            </div>
          </div>

          {/* Amount Paid Highlight */}
          <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-slate-50 print:border-slate-300">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-cyan-400 print:text-slate-600 block">
                Total Amount Paid
              </span>
              <div className="text-3xl font-black text-white print:text-black mt-0.5">
                ${payment.chargeAmount}{' '}
                <span className="text-lg font-bold text-slate-400 print:text-slate-600">
                  {payment.chargeCurrency || 'USD'}
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Equivalent to ₹{Number(payment.amount).toLocaleString('en-IN')}{' '}
                {payment.currency || 'INR'} at 1 USD = ₹{payment.exchangeRate || 83.5} INR
              </p>
            </div>

            <div className="sm:text-right bg-slate-900/80 p-3 rounded-xl border border-slate-800 print:border-slate-300 print:bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Escrow Security Status
              </span>
              <span className="text-xs font-black text-emerald-400 print:text-emerald-700 flex items-center sm:justify-end gap-1 mt-0.5">
                <Lock className="w-3.5 h-3.5" /> Funds Held in Escrow
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Protected until journey completion
              </span>
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 text-xs">
            {/* PayPal Capture ID */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                PayPal Capture / Transaction ID
              </span>
              <div className="flex items-center justify-between mt-1 gap-2">
                <span className="font-mono font-bold text-cyan-300 print:text-slate-900 text-xs break-all">
                  {captureId}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(captureId, 'captureId')}
                  className="p-1 rounded text-slate-400 hover:text-white print:hidden cursor-pointer"
                  title="Copy"
                >
                  {copiedKey === 'captureId' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* PayPal Order ID */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                PayPal Order ID
              </span>
              <div className="flex items-center justify-between mt-1 gap-2">
                <span className="font-mono font-bold text-slate-200 print:text-slate-900 text-xs break-all">
                  {orderId}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(orderId, 'orderId')}
                  className="p-1 rounded text-slate-400 hover:text-white print:hidden cursor-pointer"
                  title="Copy"
                >
                  {copiedKey === 'orderId' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Booking Reference */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Booking Reference
              </span>
              <span className="font-mono font-bold text-white print:text-black text-xs block mt-1">
                {payment.bookingReference || booking?.bookingReference || 'N/A'}
              </span>
            </div>

            {/* Transaction Date & Time */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Payment Timestamp
              </span>
              <span className="font-semibold text-slate-200 print:text-black text-xs block mt-1">
                {paymentDate}
              </span>
            </div>

            {/* Payer Information */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Payer Details
              </span>
              <span className="font-bold text-white print:text-black text-xs block mt-1">
                {payment.payerName || booking?.user?.name || 'Verified Traveler'}
              </span>
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">
                {payment.payerEmail || booking?.user?.email || 'N/A'}
              </span>
            </div>

            {/* Payment Method */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Funding Source & Processor
              </span>
              <span className="font-bold text-white print:text-black text-xs block mt-1">
                {payment.paymentMethod === 'CREDIT_DEBIT_CARD'
                  ? `Debit / Credit Card (${payment.cardBrand || 'Card'} •••• ${payment.cardLast4 || 'XXXX'})`
                  : 'PayPal Sandbox Wallet'}
              </span>
              <span className="text-[11px] text-cyan-400 print:text-cyan-700 block">
                Processor: PayPal REST v2 • Direct Escrow
              </span>
            </div>
          </div>

          {/* Associated Trip Context if available */}
          {itinerary && (
            <div className="my-6 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-2 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-2 text-cyan-400 print:text-cyan-800 font-bold">
                <PlaneTakeoff className="w-4 h-4" />
                <span>Associated Travel Itinerary</span>
              </div>
              <h4 className="text-sm font-black text-white print:text-black">
                {itinerary.title || 'WayRivo Customized Travel Experience'}
              </h4>
              <div className="flex flex-wrap gap-4 text-slate-400 print:text-slate-600 text-[11px]">
                {itinerary.destination?.name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" /> {itinerary.destination.name}
                  </span>
                )}
                {itinerary.numberOfDays && <span>• {itinerary.numberOfDays} Days Trip</span>}
                {itinerary.travelersCount && <span>• {itinerary.travelersCount} Traveler(s)</span>}
              </div>
            </div>
          )}

          {/* Escrow Terms Disclosure */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-400 print:border-slate-300 print:text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-300 print:text-black mb-1">
              Escrow Protection Terms & Refund Notice:
            </p>
            <p>
              This transaction is guaranteed by WayRivo AI's Escrow Vault. Under platform policy,
              payments made prior to trip commencement remain locked in escrow until after arrival or
              trip completion. If you need to request cancellation or an administrative review, visit
              your booking dashboard. All approved refunds are credited through PayPal Developer
              Sandbox directly to the original funding account.
            </p>
          </div>
        </div>

        {/* Action Bar Footer (Hidden during print) */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:hidden">
          <Link
            to="/traveler/bookings"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            ← Back to All Bookings
          </Link>

          <div className="flex items-center gap-3">
            {payment.bookingId && (
              <Link
                to={`/traveler/booking-confirmation/${payment.bookingId}`}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
              >
                Booking Confirmation Receipt
              </Link>
            )}
            <Link
              to="/traveler/dashboard"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
            >
              Traveler Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsPage;
