import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Sparkles,
  Wallet,
  Building2,
  Info,
  RefreshCw,
} from 'lucide-react';
import { bookingService, paymentService, itineraryIntelligenceService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PaymentCountdownTimer } from '../../components/payment/PaymentCountdownTimer';
import { PaymentProcessingOverlay } from '../../components/payment/PaymentProcessingOverlay';
import { PaymentRedirectLoader } from '../../components/payment/PaymentRedirectLoader';

export const PayPalLoginPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 6-Minute Payment Countdown Session State
  const [paymentSession, setPaymentSession] = useState<any>(null);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  // 5–6 Second Payment Processing Overlay & Failure State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>('Waiting For The Successful Transaction...');
  const [paymentFailed, setPaymentFailed] = useState<boolean>(false);
  const [failureReason, setFailureReason] = useState<string>('');

  // Authentication Step State
  // 'login' = Enter email/mobile & password
  // 'review' = Review amount, funding source & click Complete Purchase
  const [step, setStep] = useState<'login' | 'review'>('login');

  // Login Form Fields
  const [identifier, setIdentifier] = useState<string>('sb-buyer2026@personal.example.com');
  const [password, setPassword] = useState<string>('SandboxPass2026!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [stayLoggedIn, setStayLoggedIn] = useState<boolean>(true);

  // Buyer & Funding Selection
  const [buyerName, setBuyerName] = useState<string>('Alex Johnson');
  const [selectedFunding, setSelectedFunding] = useState<'balance' | 'bank'>('balance');

  // Load Booking Details & Authoritative 6-Minute Payment Session
  useEffect(() => {
    let isMounted = true;
    if (!bookingId) return;

    const targetId = bookingId;
    async function loadBookingOrItinerary() {
      setLoading(true);
      let loadedBooking: any = null;
      try {
        const bRes = await bookingService.getById(targetId);
        if (bRes.data?.data) {
          loadedBooking = bRes.data.data;
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
            loadedBooking = newBookingRes.data?.data;
          }
        } catch (err) {
          console.error('Failed to load booking or itinerary for PayPal Sandbox login:', err);
          if (isMounted) {
            setError('Unable to load booking details for PayPal authentication.');
          }
        }
      }

      if (loadedBooking && isMounted) {
        // If booking is already captured and confirmed under escrow, redirect directly to success
        if (loadedBooking.status === 'CONFIRMED' || loadedBooking.status === 'ESCROW_HOLD') {
          navigate(`/payment/success?bookingId=${loadedBooking.id}&method=paypal`);
          return;
        }

        setBooking(loadedBooking);
        if (loadedBooking?.user?.name) setBuyerName(loadedBooking.user.name);

        // Initialize or resume authoritative 6-minute payment session
        try {
          const sessionRes = await paymentService.createSession({ bookingId: loadedBooking.id });
          if (sessionRes.data?.data && isMounted) {
            const s = sessionRes.data.data;
            setPaymentSession(s);
            if (s.remainingSeconds === 0 || s.status === 'EXPIRED') {
              setIsSessionExpired(true);
            } else {
              setIsSessionExpired(false);
            }
          }
        } catch (sErr) {
          console.error('Failed to initialize 6-minute payment session:', sErr);
        }
      }

      if (isMounted) setLoading(false);
    }

    loadBookingOrItinerary();

    return () => {
      isMounted = false;
    };
  }, [bookingId, user]);

  // Handle Session Expiration
  const handleExpire = async () => {
    setIsSessionExpired(true);
    const effectiveBookingId = booking?.id || bookingId;
    if (effectiveBookingId) {
      try {
        await paymentService.expireSession({ bookingId: effectiveBookingId });
      } catch (err) {
        console.warn('Backend expire call:', err);
      }
    }
    toast.error('Payment session has expired. Booking reservation released.');
  };

  // Handle Start New Payment (Renews 6-Minute Session)
  const handleRestart = async () => {
    const effectiveBookingId = booking?.id || bookingId;
    if (!effectiveBookingId) return;
    try {
      setLoading(true);
      setError(null);
      const sessionRes = await paymentService.createSession({ bookingId: effectiveBookingId });
      if (sessionRes.data?.data) {
        setPaymentSession(sessionRes.data.data);
        setIsSessionExpired(false);
        toast.success('New 6-minute payment session initiated.');
      }
    } catch (err: any) {
      console.error('Failed to restart payment session:', err);
      toast.error('Unable to renew payment session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick-Fill Test Account
  const handleQuickFill = (email: string, pass: string, name: string) => {
    setIdentifier(email);
    setPassword(pass);
    setBuyerName(name);
    toast.success(`Applied ${name} PayPal Sandbox credentials`);
  };

  // Step 1: Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSessionExpired) {
      setError('Your 6-minute payment session has expired. Click "Start New Payment" above to renew.');
      toast.error('Payment session has expired.');
      return;
    }

    if (!identifier.trim()) {
      setError('Please enter your email address or mobile number.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Please enter your valid PayPal Sandbox password (min 6 characters).');
      return;
    }

    // Set buyer name from email or traveler
    if (identifier.includes('personal.example.com')) {
      setBuyerName('Alex J. Johnson');
    } else if (user?.name) {
      setBuyerName(user.name);
    }

    // Stage 2 Buffering: Logging In To PayPal...
    setIsLoggingIn(true);
  };

  const handleLoginLoaderComplete = () => {
    setIsLoggingIn(false);
    toast.success('Authenticated with PayPal Sandbox Buyer Account!');
    setStep('review');
  };

  // Step 2: Complete Purchase & Capture into Escrow with 5–6 Second Processing Display
  const handleCompletePurchase = async () => {
    const effectiveBookingId = booking?.id || bookingId;
    if (!effectiveBookingId) {
      setError('Missing booking reference.');
      return;
    }

    if (isSessionExpired) {
      setError('Your 6-minute payment session has expired. Click "Start New Payment" above to renew.');
      toast.error('Payment session has expired.');
      return;
    }

    if (submitting || isProcessing) {
      return;
    }

    const TARGET_MIN_DISPLAY_MS = 5500; // Target 5.5 to 6.0 seconds minimum processing animation
    const processingStartTime = Date.now();

    try {
      setSubmitting(true);
      setIsProcessing(true);
      setPaymentFailed(false);
      setError(null);
      setProcessingStage('Waiting For The Successful Transaction...');

      // 1. Initialize Order on Backend immediately without artificial upfront delay
      const orderRes = await paymentService.createOrder({
        bookingId: effectiveBookingId,
        returnUrl: `${window.location.origin}/payment/success?bookingId=${effectiveBookingId}`,
        cancelUrl: `${window.location.origin}/traveler/booking-confirmation/${effectiveBookingId}`,
      });

      const orderData = orderRes.data?.data;
      if (!orderData?.orderId) {
        throw new Error('PayPal did not return a valid order identifier.');
      }

      // 2. Capture Verified Order with Buyer Details immediately
      const idempotencyKey = `paypal-${Date.now()}-${effectiveBookingId}`;
      const captureRes = await paymentService.captureOrder({
        bookingId: effectiveBookingId,
        paypalOrderId: orderData.orderId,
        idempotencyKey,
        payerEmail: identifier.trim(),
        payerName: buyerName.trim(),
      });

      const result = captureRes.data?.data;
      if (!result) {
        throw new Error('Unable to confirm payment capture status with server.');
      }

      // 3. Enforce 5–6 Second Processing Display Duration
      const elapsedMs = Date.now() - processingStartTime;
      const remainingWaitMs = Math.max(0, TARGET_MIN_DISPLAY_MS - elapsedMs);
      if (remainingWaitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingWaitMs));
      }

      toast.success(
        result?.message || 'Payment successfully captured into WayRivo Escrow!'
      );

      // 4. Redirect to Verified Success Screen
      const paymentId = result?.payment?.id || result?.captureId || effectiveBookingId;
      navigate(
        `/payment/success?paymentId=${paymentId}&bookingId=${effectiveBookingId}&orderId=${orderData.orderId}&method=paypal`
      );
    } catch (err: any) {
      console.error('PayPal Sandbox purchase capture error:', err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        'We could not verify your payment successfully.';

      // Allow brief moment so overlay exit transition isn't instantaneous
      const elapsedMs = Date.now() - processingStartTime;
      const remainingWaitMs = Math.max(0, 1500 - elapsedMs);
      if (remainingWaitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingWaitMs));
      }

      setIsProcessing(false);
      setSubmitting(false);
      setPaymentFailed(true);
      setFailureReason(msg);
      setError(msg);
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#0070ba] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-bold text-slate-600">
          Connecting to PayPal Sandbox Gateway...
        </p>
      </div>
    );
  }

  const totalAmountINR = booking?.totalAmount ? Number(booking.totalAmount) : 0;
  const totalAmountUSD = (totalAmountINR / 83.5).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 text-slate-800 py-10 px-4 sm:px-6">
      {/* 5–6 Second Payment Processing Overlay */}
      <PaymentProcessingOverlay
        isOpen={isProcessing}
        amount={totalAmountUSD}
        currency="USD"
        stageMessage={processingStage}
      />

      <div className="max-w-md mx-auto space-y-4">
        {/* Top Sandbox Notice */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-2">
          <Link
            to={`/traveler/booking-confirmation/${bookingId}`}
            className="flex items-center gap-1.5 hover:text-slate-800 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and return to WayRivo AI</span>
          </Link>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] uppercase border border-amber-300">
            Sandbox Environment
          </span>
        </div>

        {/* Server-Authoritative 6-Minute Payment Countdown Timer Banner */}
        {paymentSession?.expiresAt && (
          <PaymentCountdownTimer
            expiresAt={paymentSession.expiresAt}
            isExpired={isSessionExpired}
            onExpire={handleExpire}
            onRestart={handleRestart}
            onReturnToBooking={() =>
              navigate(`/traveler/booking-confirmation/${booking?.id || bookingId}`)
            }
          />
        )}

        {/* Phase 7: Payment Failure Card */}
        {paymentFailed && (
          <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-300 text-rose-950 shadow-xl space-y-4 text-center animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
                PAYMENT UNCONFIRMED
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Payment Could Not Be Completed
              </h3>
              <p className="text-xs text-rose-700 leading-relaxed">
                We could not verify your payment successfully. Please check your payment status before trying again.
              </p>
              {failureReason && (
                <div className="p-2.5 rounded-xl bg-rose-100/80 border border-rose-200 text-[11px] text-rose-900 text-left">
                  <span className="font-bold block mb-0.5">Details:</span>
                  <span className="font-mono break-words">{failureReason}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPaymentFailed(false);
                  setError(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all cursor-pointer"
              >
                Return to Checkout
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentFailed(false);
                  setError(null);
                  handleCompletePurchase();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0070ba] hover:bg-[#003087] text-white font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Payment
              </button>
              <Link
                to={`/traveler/booking-confirmation/${booking?.id || bookingId}`}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all cursor-pointer text-center"
              >
                View Booking
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-600 hover:text-rose-900 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main PayPal Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center">
          {/* Authentic PayPal Logo */}
          <div className="flex justify-center items-center mb-6">
            <div className="inline-flex items-center select-none">
              <span className="text-3xl font-black italic tracking-tight text-[#003087]">
                Pay
              </span>
              <span className="text-3xl font-black italic tracking-tight text-[#0079C1]">
                Pal
              </span>
            </div>
          </div>

          {/* Amount Badge */}
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between text-left">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Pay to Merchant
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                WayRivo AI 2.0
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-slate-900">
                ${totalAmountUSD}{' '}
                <span className="text-xs font-bold text-slate-500">USD</span>
              </span>
              <span className="text-[11px] text-slate-400 block">
                ₹{totalAmountINR.toLocaleString('en-IN')} INR
              </span>
            </div>
          </div>

          {/* STEP 1: LOGIN FORM */}
          {step === 'login' ? (
            <div className="text-left space-y-4">
              <div className="text-center sm:text-left mb-2">
                <h2 className="text-lg font-black text-slate-900">
                  Log in to PayPal Sandbox
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your email address/mobile number and password.
                </p>
              </div>

              {/* Sandbox Quick-Fill Chips */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Sandbox Test Credentials
                  </span>
                  <span>1-Click Auto-Fill</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFill(
                        'sb-buyer2026@personal.example.com',
                        'SandboxPass2026!',
                        'Alex J. Johnson'
                      )
                    }
                    className="text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0070ba] text-xs transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-mono text-slate-700 text-[11px]">
                      sb-buyer2026@personal.example.com
                    </span>
                    <span className="text-[10px] font-bold text-[#0070ba]">
                      Use
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFill(
                        user?.email || 'traveler.sandbox@wayrivo.ai',
                        'Traveler2026!',
                        user?.name || 'Arjun K. Sharma'
                      )
                    }
                    className="text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0070ba] text-xs transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-mono text-slate-700 text-[11px]">
                      {user?.email || 'traveler.sandbox@wayrivo.ai'}
                    </span>
                    <span className="text-[10px] font-bold text-[#0070ba]">
                      Use
                    </span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
                {/* Email or Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email address or mobile number
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="sb-buyer@personal.example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 font-mono"
                  />
                </div>

                {/* Password with Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <span className="text-[11px] text-[#0070ba] hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Stay Logged In */}
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={stayLoggedIn}
                    onChange={(e) => setStayLoggedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0070ba] focus:ring-[#0070ba] cursor-pointer"
                  />
                  <span>Stay logged in for faster checkout</span>
                </label>

                {/* Log In Button */}
                <button
                  type="submit"
                  disabled={submitting || isSessionExpired || isLoggingIn}
                  className="w-full py-3.5 px-4 rounded-full bg-[#0070ba] hover:bg-[#003087] text-white font-extrabold text-sm transition-all shadow-md cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSessionExpired ? 'Payment Session Expired' : isLoggingIn ? 'Connecting...' : 'Log In to PayPal Sandbox'}
                </button>
              </form>
            </div>
          ) : (
            /* STEP 2: REVIEW & COMPLETE PURCHASE */
            <div className="text-left space-y-5 animate-in fade-in duration-200">
              {/* Authenticated Buyer Card */}
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {buyerName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {identifier}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="text-xs text-[#0070ba] hover:underline cursor-pointer font-bold"
                >
                  Change
                </button>
              </div>

              {/* Funding Options */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                  Select Payment Method
                </span>

                {/* Option 1: PayPal Balance */}
                <label
                  onClick={() => setSelectedFunding('balance')}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedFunding === 'balance'
                      ? 'border-[#0070ba] bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-[#0070ba]" />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        PayPal Balance
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        $2,500.00 USD Available
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="funding"
                    checked={selectedFunding === 'balance'}
                    onChange={() => setSelectedFunding('balance')}
                    className="text-[#0070ba] focus:ring-[#0070ba]"
                  />
                </label>

                {/* Option 2: Linked Sandbox Bank */}
                <label
                  onClick={() => setSelectedFunding('bank')}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedFunding === 'bank'
                      ? 'border-[#0070ba] bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-600" />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        Sandbox Bank Checking
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Chase Bank •••• 5678
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="funding"
                    checked={selectedFunding === 'bank'}
                    onChange={() => setSelectedFunding('bank')}
                    className="text-[#0070ba] focus:ring-[#0070ba]"
                  />
                </label>
              </div>

              {/* Escrow Terms Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#0070ba] shrink-0 mt-0.5" />
                <p>
                  Your payment of <strong className="text-slate-800">${totalAmountUSD} USD</strong> will be safely deposited into WayRivo Escrow until journey delivery.
                </p>
              </div>

              {/* Complete Purchase Button */}
              <button
                type="button"
                onClick={handleCompletePurchase}
                disabled={submitting || isProcessing || isSessionExpired}
                className="w-full py-4 px-6 rounded-full bg-[#0070ba] hover:bg-[#003087] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting || isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Transaction...</span>
                  </>
                ) : isSessionExpired ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-300" />
                    <span>Payment Session Expired</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Complete Purchase (${totalAmountUSD} USD)</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  ← Back to Credentials
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust Badges Footer */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 text-center pt-2">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            PayPal Sandbox Protection
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0070ba]" />
            WayRivo Escrow Vault
          </span>
        </div>
      </div>

      {/* Stage 2 Buffering Overlay: Logging In To PayPal... */}
      <PaymentRedirectLoader
        isOpen={isLoggingIn}
        title="Logging In To PayPal..."
        description="Please wait while PayPal Sandbox securely processes your request."
        supportingText="Your payment approval is being securely processed."
        minimumDisplayDuration={2500}
        onComplete={handleLoginLoaderComplete}
      />
    </div>
  );
};

export default PayPalLoginPage;
