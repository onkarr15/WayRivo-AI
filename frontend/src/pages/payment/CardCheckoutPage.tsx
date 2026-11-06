import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';
import { bookingService, paymentService, itineraryIntelligenceService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';

interface TestCardPreset {
  label: string;
  brand: string;
  number: string;
  exp: string;
  cvv: string;
  name: string;
}

const TEST_CARDS: TestCardPreset[] = [
  {
    label: 'Sandbox Visa',
    brand: 'Visa',
    number: '4012 8888 8888 1881',
    exp: '12/28',
    cvv: '123',
    name: 'Alex Johnson',
  },
  {
    label: 'Sandbox Mastercard',
    brand: 'Mastercard',
    number: '5425 2334 3456 7890',
    exp: '09/27',
    cvv: '456',
    name: 'Sarah Connor',
  },
  {
    label: 'Sandbox Amex',
    brand: 'Amex',
    number: '3782 8224 6310 005',
    exp: '05/29',
    cvv: '1234',
    name: 'Michael Scott',
  },
];

export const CardCheckoutPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitStage, setSubmitStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [cardholderName, setCardholderName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('110001');
  const [country, setCountry] = useState<string>('India');
  const [saveCard, setSaveCard] = useState<boolean>(false);

  // Card Brand Detection
  const detectCardBrand = (num: string): string => {
    const clean = num.replace(/\s+/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'American Express';
    if (/^(6011|65)/.test(clean)) return 'Discover';
    return 'Card';
  };

  const currentBrand = detectCardBrand(cardNumber);

  // Load Booking Details (with Itinerary Fallback)
  useEffect(() => {
    let isMounted = true;
    if (!bookingId) return;

    const targetId = bookingId;
    async function loadBookingOrItinerary() {
      setLoading(true);
      try {
        const bRes = await bookingService.getById(targetId);
        if (bRes.data?.data) {
          const b = bRes.data.data;
          if (isMounted) {
            setBooking(b);
            if (b?.user?.name || user?.name) {
              setCardholderName(b?.user?.name || user?.name || '');
            }
          }
          return;
        }
      } catch {
        // Fallback: If passed an itinerary ID, auto-resolve or create pending booking
        try {
          const itinRes = await itineraryIntelligenceService.getById(targetId);
          const itin = itinRes.data?.data;
          if (itin) {
            const newBookingRes = await bookingService.create({
              itineraryId: itin.id,
              specialRequests: `Itinerary: ${itin.title}. Travelers: ${itin.travelersCount}`,
            });
            const b = newBookingRes.data?.data;
            if (isMounted) {
              setBooking(b);
              if (b?.user?.name || user?.name) {
                setCardholderName(b?.user?.name || user?.name || '');
              }
            }
            return;
          }
        } catch (err) {
          console.error('Failed to load booking or itinerary for card checkout:', err);
          if (isMounted) {
            setError('Unable to load booking details for payment processing.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBookingOrItinerary();

    return () => {
      isMounted = false;
    };
  }, [bookingId, user]);

  // Format Card Number (with spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Expiry (MM / YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setExpiry(raw);
  };

  // Format CVV (3 or 4 digits)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(raw);
  };

  // One-click Sandbox Test Card Quick-Fill
  const applyTestCard = (preset: TestCardPreset) => {
    setCardNumber(preset.number);
    setExpiry(preset.exp);
    setCvv(preset.cvv);
    setCardholderName(preset.name);
    toast.success(`Applied ${preset.label} test credentials!`);
  };

  // Payment Execution & Capture
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (!cardholderName.trim()) {
      setError('Please provide the cardholder name.');
      return;
    }
    if (cleanNum.length < 15 || cleanNum.length > 16) {
      setError('Please enter a valid 15 or 16-digit card number.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError('Please enter a valid expiration date in MM/YY format.');
      return;
    }
    const [expMonth, expYear] = expiry.split('/').map(Number);
    if (expMonth < 1 || expMonth > 12) {
      setError('Expiration month must be between 01 and 12.');
      return;
    }
    const currentYearShort = new Date().getFullYear() % 100;
    if (expYear < currentYearShort) {
      setError('Card expiration year cannot be in the past.');
      return;
    }
    if (cvv.length < 3) {
      setError('Please enter a valid 3 or 4-digit CVV security code.');
      return;
    }

    const effectiveBookingId = booking?.id || bookingId;
    if (!effectiveBookingId) {
      setError('Missing booking reference.');
      return;
    }

    try {
      setSubmitting(true);

      // Step 1: Initialize PayPal Order
      setSubmitStage('Initializing Secure PayPal Order...');
      const orderRes = await paymentService.createOrder({
        bookingId: effectiveBookingId,
        returnUrl: `${window.location.origin}/payment/success?bookingId=${effectiveBookingId}`,
        cancelUrl: `${window.location.origin}/traveler/booking-confirmation/${effectiveBookingId}`,
      });

      const orderData = orderRes.data?.data;
      if (!orderData?.orderId) {
        throw new Error('PayPal did not return a valid order identifier.');
      }

      // Step 2: Capture Order with Verified Card Details
      setSubmitStage('Verifying Card & Capturing into WayRivo Escrow...');
      const idempotencyKey = `card-${Date.now()}-${effectiveBookingId}`;
      const captureRes = await paymentService.captureOrder({
        bookingId: effectiveBookingId,
        paypalOrderId: orderData.orderId,
        idempotencyKey,
        cardDetails: {
          cardholderName: cardholderName.trim(),
          cardBrand: currentBrand,
          last4: cleanNum.slice(-4),
        },
      });

      const result = captureRes.data?.data;
      toast.success(
        result?.message || 'Payment successfully captured into WayRivo Escrow!'
      );

      // Step 3: Redirect to Verified Success Page
      const paymentId = result?.payment?.id || result?.captureId || effectiveBookingId;
      navigate(
        `/payment/success?paymentId=${paymentId}&bookingId=${effectiveBookingId}&orderId=${orderData.orderId}&method=card`
      );
    } catch (err: any) {
      console.error('Card payment processing error:', err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Card payment could not be processed. Please check details or try again.';
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
      setSubmitStage('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-slate-400">
          Loading secure card checkout portal...
        </p>
      </div>
    );
  }

  const totalAmountINR = booking?.totalAmount ? Number(booking.totalAmount) : 0;
  const totalAmountUSD = (totalAmountINR / 83.5).toFixed(2);
  const itinerary = booking?.itinerary;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              to={`/traveler/booking-confirmation/${bookingId}`}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Return to Booking Confirmation"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Debit or Credit Card Checkout
                </h1>
                <span className="text-[10px] uppercase font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  PayPal Gateway
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Processed via PayPal Sandbox. Escrow secured by WayRivo AI 2.0.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-bold">256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{error}</p>
              <p className="text-[11px] text-rose-400/80 mt-1">
                Verify your card credentials or select one of the sandbox test card chips below.
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-400 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Card Input Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick Sandbox Test Cards Selector */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">
                    PayPal Sandbox Test Cards
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">1-Click Auto-Fill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TEST_CARDS.map((tc) => (
                  <button
                    key={tc.brand}
                    type="button"
                    onClick={() => applyTestCard(tc)}
                    disabled={submitting}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white group-hover:text-cyan-300">
                        {tc.brand}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        •• {tc.number.slice(-4)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Exp: {tc.exp}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Form Card */}
            <form
              onSubmit={handleCardSubmit}
              className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Card Details
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      currentBrand === 'Visa'
                        ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                        : currentBrand === 'Mastercard'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : currentBrand === 'American Express'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {currentBrand}
                  </span>
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-sm outline-none transition-all placeholder:text-slate-600 disabled:opacity-50"
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4012 8888 8888 1881"
                    maxLength={19}
                    disabled={submitting}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white font-mono text-sm tracking-widest outline-none transition-all placeholder:text-slate-600 disabled:opacity-50"
                  />
                  <CreditCard className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM / YY"
                    maxLength={5}
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white font-mono text-sm tracking-wider text-center outline-none transition-all placeholder:text-slate-600 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Security Code (CVV)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={cvv}
                      onChange={handleCvvChange}
                      placeholder="123"
                      maxLength={4}
                      disabled={submitting}
                      className="w-full pl-4 pr-9 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white font-mono text-sm tracking-widest text-center outline-none transition-all placeholder:text-slate-600 disabled:opacity-50"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Country & Postal Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Postal / Zip Code
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Save Card Checkbox */}
              <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  disabled={submitting}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <span>Save card securely for future WayRivo AI trip bookings</span>
              </label>

              {/* Submit CTA Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>{submitStage || 'Processing Transaction...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        Pay ${totalAmountUSD} USD (₹{totalAmountINR.toLocaleString('en-IN')})
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Footnote */}
              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Protected by WayRivo Escrow Guarantee. Direct PayPal Sandbox capture.
                </span>
              </div>
            </form>
          </div>

          {/* RIGHT: Booking & Escrow Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-6 sticky top-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Order Summary
                </h3>
                <span className="font-mono text-xs font-bold text-cyan-400">
                  {booking?.bookingReference || 'BK-PENDING'}
                </span>
              </div>

              {/* Trip Overview */}
              {itinerary && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <h4 className="text-sm font-bold text-white">
                    {itinerary.title || 'Curated Journey'}
                  </h4>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    {itinerary.destination?.name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {itinerary.destination.name}
                      </span>
                    )}
                    {itinerary.numberOfDays && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        {itinerary.numberOfDays} Days
                      </span>
                    )}
                    {itinerary.travelersCount && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        {itinerary.travelersCount} Travelers
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Itinerary Package Base</span>
                  <span className="font-mono text-slate-200">
                    ₹{totalAmountINR.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>WayRivo Escrow Security</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    FREE (Included)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>PayPal Sandbox Processing</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    $0.00 USD
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Exchange Rate (USD/INR)</span>
                  <span className="font-mono text-slate-300">~ 83.50</span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold text-slate-300 block">
                      Total Payable
                    </span>
                    <span className="text-[11px] text-slate-500">
                      INR Equivalent: ₹{totalAmountINR.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-cyan-400 font-mono">
                      ${totalAmountUSD}
                    </span>
                    <span className="text-xs font-bold text-slate-400 ml-1">
                      USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Escrow Shield Callout */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>WayRivo Escrow Protection</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your payment is safely escrowed and will not be transferred to providers until your journey is complete. Full refund guaranteed if services cannot be fulfilled.
                </p>
              </div>

              {/* Back to Booking Link */}
              <div className="pt-2 text-center">
                <Link
                  to={`/traveler/booking-confirmation/${bookingId}`}
                  className="text-xs text-slate-400 hover:text-white transition-colors underline cursor-pointer"
                >
                  Return to Booking Confirmation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardCheckoutPage;
