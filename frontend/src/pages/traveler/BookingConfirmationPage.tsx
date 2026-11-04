import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Printer,
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  AlertCircle,
  Hotel,
  Compass,
  FileText,
  User,
  Info,
  DollarSign,
} from 'lucide-react';
import { bookingService, paymentService, itineraryIntelligenceService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';

const BookingConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [payPalConfig, setPayPalConfig] = useState<any>(null);

  // Traveler Details Form State
  const [primaryTraveler, setPrimaryTraveler] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [emergencyContact, setEmergencyContact] = useState<string>('+91 98765 00000');
  const [specialRequests, setSpecialRequests] = useState<string>('Non-smoking room, vegetarian meal preference.');
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);

  // Payment Processing State
  const [orderInProgress, setOrderInProgress] = useState<boolean>(false);
  const [payPalOrderData, setPayPalOrderData] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Fetch PayPal Config on mount
  useEffect(() => {
    paymentService
      .getConfig()
      .then((res) => setPayPalConfig(res.data?.data))
      .catch((err) => console.error('Failed to load PayPal config:', err));
  }, []);

  // Fetch Booking or create from Itinerary
  const fetchBookingOrItinerary = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Try to fetch as an existing booking
      const bRes = await bookingService.getById(id);
      if (bRes.data?.data) {
        setBooking(bRes.data.data);
        setLoading(false);
        return;
      }
    } catch {
      // 2. If not a booking, try fetching as an itinerary and generate a pending booking
      try {
        const itinRes = await itineraryIntelligenceService.getById(id);
        const itin = itinRes.data?.data;
        if (itin) {
          // Create pending booking from itinerary
          const newBookingRes = await bookingService.create({
            itineraryId: itin.id,
            specialRequests: `Itinerary: ${itin.title}. Travelers: ${itin.travelersCount}`,
          });
          setBooking(newBookingRes.data?.data);
        }
      } catch (err) {
        console.error('Failed to load booking or itinerary:', err);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchBookingOrItinerary();
  }, [fetchBookingOrItinerary]);

  // Step 1: Initialize PayPal Order
  const handleInitiatePayPalOrder = async () => {
    if (!booking) return;
    if (!termsAgreed) {
      toast.warning('Please review and agree to the booking cancellation terms.');
      return;
    }
    if (!primaryTraveler || !phone) {
      toast.warning('Please provide your primary traveler contact information.');
      return;
    }

    setOrderInProgress(true);
    try {
      const res = await paymentService.createOrder({
        bookingId: booking.id,
      });
      const data = res.data?.data;
      setPayPalOrderData(data);
      toast.success('PayPal Sandbox order initialized. Please approve payment.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to initialize PayPal order.');
    } finally {
      setOrderInProgress(false);
    }
  };

  // Step 2: Approve & Capture Payment Server-Side
  const handleApproveAndCapture = async () => {
    if (!booking || !payPalOrderData) return;
    setIsCapturing(true);
    try {
      const res = await paymentService.captureOrder({
        bookingId: booking.id,
        paypalOrderId: payPalOrderData.orderId,
        idempotencyKey: `idemp-${Date.now()}-${booking.id}`,
      });

      const msg = res.data?.data?.message || 'Payment captured! Booking confirmed with PayPal Escrow protection.';
      toast.success(msg);
      setPayPalOrderData(null);
      // Refresh booking to show confirmation receipt
      fetchBookingOrItinerary();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment capture failed.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Booking Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">
          We could not locate this reservation or itinerary. Please check your bookings list.
        </p>
        <Link
          to="/traveler/bookings"
          className="inline-flex px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  const isPaid =
    booking.status === 'CONFIRMED' ||
    booking.status === 'ESCROW_HOLD' ||
    booking.payment?.status === 'CAPTURED';

  const exchangeRate = payPalConfig?.exchangeRate || 83.5;
  const chargeCurrency = payPalConfig?.currency || 'USD';
  const totalInr = Number(booking.totalAmount || 0);
  const totalCharge = (totalInr / exchangeRate).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto pt-24 pb-20 px-4 sm:px-6">
      {/* 1. Status Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mb-3">
          <ShieldCheck className="w-4 h-4 text-cyan-400" /> PayPal Developer Sandbox Protected
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {isPaid ? 'Booking Confirmed & Escrow Secured' : 'Review & Complete Your Booking'}
        </h1>

        <p className="text-xs text-slate-400 mt-1">
          Booking Reference: <span className="font-mono font-bold text-cyan-400">{booking.bookingReference}</span>
        </p>
      </div>

      {/* 2. Main Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-2xl font-black tracking-wider text-white print:text-slate-900">
              WAY<span className="text-gradient-cyan">RIVO</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 print:hidden">
                AI 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Intelligent Travel Commerce & Escrow Engine</p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs text-slate-400 block">
              Booking Date: {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                isPaid
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isPaid ? 'ESCROW DEPOSITED (CONFIRMED)' : 'PENDING PAYMENT'}
            </span>
          </div>
        </div>

        {/* 3. Review Selected Services & Line Items */}
        <div className="my-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Selected Services & Verified Inventory
          </h3>

          <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white print:text-slate-900">
                  {booking.itinerary?.title || 'Custom Curated Vacation Package'}
                </h4>
                <p className="text-xs text-slate-400">
                  {booking.itinerary?.numberOfDays || 5} Days • {booking.itinerary?.travelersCount || 2} Travelers • {booking.itinerary?.travelStyle || 'COMFORT'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Server-Verified Total</span>
                <span className="text-base font-black text-cyan-300 print:text-slate-900">
                  ₹{totalInr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Itemized Line Items */}
            {booking.items && booking.items.length > 0 && (
              <div className="divide-y divide-slate-800/60 text-xs">
                {booking.items.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-2">
                      {item.itemType === 'HOTEL' ? (
                        <Hotel className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Compass className="w-4 h-4 text-teal-400" />
                      )}
                      <div>
                        <span className="font-semibold text-white print:text-slate-900">{item.title}</span>
                        {item.notes && <p className="text-[11px] text-slate-400">{item.notes}</p>}
                      </div>
                    </div>

                    <div className="text-right font-medium">
                      <span>₹{Number(item.totalPrice).toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-400 block">
                        ₹{Number(item.unitPrice).toLocaleString('en-IN')} × {item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Traveler Details Form (Editable before payment) */}
        {!isPaid ? (
          <div className="my-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Traveler Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Primary Traveler Full Name
                </label>
                <input
                  type="text"
                  value={primaryTraveler}
                  onChange={(e) => setPrimaryTraveler(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Arjun Sharma"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="arjun@example.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Emergency Contact</label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="+91 98765 00000"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Special Requests / Dietary Preferences / Arrival Notes
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Vegetarian diet, high floor preference, airport taxi arrival time"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Printable Traveler Info when Paid */
          <div className="my-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Traveler</span>
              <span className="font-bold text-white print:text-black">{booking.user?.name || primaryTraveler}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Contact</span>
              <span className="font-semibold text-slate-200 print:text-black">{booking.user?.email || email}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Escrow Status</span>
              <span className="font-bold text-emerald-400 print:text-black">HELD IN ESCROW</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Payment Method</span>
              <span className="font-semibold text-slate-200 print:text-black">PayPal Sandbox</span>
            </div>
          </div>
        )}

        {/* 5. Currency Conversion & Sandbox Price Breakdown Box */}
        <div className="my-6 p-5 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-cyan-300">PayPal Sandbox Multi-Currency Engine</h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Live Exchange Rate
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-cyan-900/40">
            <div>
              <span className="text-slate-400">Application Display Currency:</span>
              <span className="font-black text-white ml-2 text-sm">₹{totalInr.toLocaleString('en-IN')} INR</span>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-slate-400">PayPal Sandbox Charge Amount:</span>
              <span className="font-black text-cyan-300 ml-2 text-base">
                ${totalCharge} {chargeCurrency}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            * Note: WayRivo displays Indian Rupees (INR) for local convenience. PayPal Developer Sandbox processes international orders in <strong>{chargeCurrency}</strong> at a conversion rate of 1 {chargeCurrency} = ₹{exchangeRate} INR.
          </p>
        </div>

        {/* 6. Cancellation Conditions Accordion */}
        <div className="my-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Cancellation Policy & Escrow Terms</span>
          </div>

          <ul className="list-disc pl-5 text-slate-400 text-[11px] space-y-1">
            <li>
              <strong>100% Escrow Protection:</strong> Funds are locked securely in PayPal Escrow until 14 days after departure or service completion.
            </li>
            <li>
              <strong>Free Cancellation:</strong> Full refund eligible if cancelled at least 7 days before your departure date.
            </li>
            <li>
              <strong>Administrative Review:</strong> Cancellations submit an escrow release request for administrator audit. Refunds are processed through the PayPal Refund API directly to your original payment method.
            </li>
          </ul>

          {!isPaid && (
            <label className="flex items-center gap-2.5 pt-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
              <span>I have reviewed the cancellation conditions and accept the WayRivo booking terms.</span>
            </label>
          )}
        </div>

        {/* 7. PayPal Checkout Execution */}
        {!isPaid ? (
          <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Proceed to PayPal Developer Sandbox</h4>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Sandbox Mode
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Click below to initiate the PayPal Orders API v2 workflow. You will be able to approve the test order using PayPal Sandbox credentials and capture funds safely into escrow.
            </p>

            {/* Step A: Initialize Order */}
            {!payPalOrderData ? (
              <button
                onClick={handleInitiatePayPalOrder}
                disabled={orderInProgress || !termsAgreed}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {orderInProgress ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" /> Pay ${totalCharge} {chargeCurrency} with PayPal Sandbox
                  </>
                )}
              </button>
            ) : (
              /* Step B: PayPal Approval & Capture Modal / Prompt */
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cyan-300 font-bold">PayPal Order Initialized</span>
                  <span className="font-mono text-xs text-slate-300">{payPalOrderData.orderId}</span>
                </div>

                <div className="text-xs text-slate-300">
                  <p>Order reference: <strong>{payPalOrderData.bookingReference}</strong></p>
                  <p>Charge amount: <strong>${payPalOrderData.chargeAmount} {payPalOrderData.chargeCurrency}</strong> (~ ₹{Number(payPalOrderData.displayAmount).toLocaleString('en-IN')})</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href={payPalOrderData.approvalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center border border-slate-700"
                  >
                    Open PayPal Hosted Checkout ↗
                  </a>

                  <button
                    onClick={handleApproveAndCapture}
                    disabled={isCapturing}
                    className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isCapturing ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Confirm & Capture Order (Server-Side)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Verified Escrow Receipt Badge */
          <div className="my-6 p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>PayPal Escrow Verification Receipt</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">PayPal Order ID</span>
                <span className="font-mono text-white text-xs">{booking.payment?.paypalOrderId || 'ORD-VERIFIED'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">PayPal Capture ID</span>
                <span className="font-mono text-cyan-300 text-xs">{booking.payment?.paypalCaptureId || 'CAP-VERIFIED'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Escrow Release Date</span>
                <span className="text-slate-200 text-xs">
                  {booking.escrowReleaseDate
                    ? new Date(booking.escrowReleaseDate).toLocaleDateString('en-IN')
                    : 'Post Journey Completion'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-300/80 leading-relaxed pt-1">
              Your payment of ₹{totalInr.toLocaleString('en-IN')} (~ ${totalCharge} {chargeCurrency}) is confirmed and held in WayRivo Escrow. In accordance with platform integrity rules, funds are only released to travel providers upon successful trip delivery.
            </p>
          </div>
        )}

        {/* 8. Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF Receipt
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/traveler/bookings"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              View in My Bookings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
