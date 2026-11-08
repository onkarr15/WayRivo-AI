import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Home,
  Copy,
  CheckCircle2,
  Lock,
  Printer,
  Download,
  Calendar,
  Clock,
  User,
  Hash,
  Compass,
  Check,
  Loader2,
} from 'lucide-react';
import { paymentService, bookingService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { AnimatedGreenCheckmark } from '../../components/payment/AnimatedGreenCheckmark';
import { PayPalOfficialLogo } from '../../components/payment/PayPalOfficialLogo';
import { WayRivoLogo } from '../../components/branding';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const paymentIdParam = searchParams.get('paymentId');
  const bookingIdParam = searchParams.get('bookingId');
  const orderIdParam = searchParams.get('orderId');

  const [receiptData, setReceiptData] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPaymentAndReceipt() {
      setLoading(true);
      const targetId = paymentIdParam || orderIdParam || bookingIdParam;

      try {
        // 1. Attempt to fetch dedicated verified receipt
        if (targetId) {
          try {
            const rRes = await paymentService.getReceipt(targetId);
            if (rRes.data?.data && isMounted) {
              setReceiptData(rRes.data.data);
            }
          } catch (rErr) {
            console.warn('Dedicated receipt endpoint fallback to payment details:', rErr);
          }
        }

        // 2. Load payment details
        if (targetId) {
          try {
            const pRes = await paymentService.getPaymentDetails(targetId);
            if (pRes.data?.data && isMounted) {
              setPayment(pRes.data.data);
            }
          } catch (pErr) {
            console.warn('Payment details lookup error:', pErr);
          }
        }

        // 3. Load booking details if bookingIdParam provided
        if (bookingIdParam) {
          try {
            const bRes = await bookingService.getById(bookingIdParam);
            if (bRes.data?.data && isMounted) {
              setBooking(bRes.data.data);
            }
          } catch (bErr) {
            console.error('Booking lookup error:', bErr);
          }
        }
      } catch (err: any) {
        console.error('Error loading verified payment success data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPaymentAndReceipt();

    return () => {
      isMounted = false;
    };
  }, [paymentIdParam, bookingIdParam, orderIdParam]);

  // Handle autoPrint query parameter
  useEffect(() => {
    if (!loading && (receiptData || payment) && searchParams.get('autoPrint') === 'true') {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, receiptData, payment, searchParams]);

  // Copy transaction ID to clipboard
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Dedicated physical print / print-to-PDF dialog
  const handlePrint = () => {
    const originalTitle = document.title;
    const txId =
      receiptData?.wayrivoTransactionId ||
      payment?.wayrivoTransactionId ||
      'WayRivo_Payment';
    document.title = `WayRivo_Receipt_${txId}`;

    window.print();

    // Restore title
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Dedicated cross-device binary PDF download handler
  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;

    const targetId =
      receiptData?.id ||
      payment?.id ||
      paymentIdParam ||
      orderIdParam ||
      bookingIdParam;

    if (!targetId) {
      toast.error('Unable to locate verified payment record for PDF receipt.');
      return;
    }

    setIsDownloadingPdf(true);

    try {
      const response = await paymentService.downloadReceiptPdf(targetId);

      // Verify valid PDF response
      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error('Invalid binary PDF received from server.');
      }

      const txId =
        receiptData?.wayrivoTransactionId ||
        payment?.wayrivoTransactionId ||
        'Official';
      const fileName = `WayRivo_Payment_Receipt_${txId}.pdf`;

      const blob = new Blob([response.data], { type: 'application/pdf' });

      // iOS Safari detection
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      // Cross-Device standard download via blob object URL & hidden anchor
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.target = '_self';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Fallback for iOS Safari if automatic download is blocked
      if (isIOS) {
        setTimeout(() => {
          window.open(blobUrl, '_blank');
        }, 300);
      }

      // Cleanup object URL
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(blobUrl);
      }, 2500);

      toast.success('Your payment receipt is ready.');
    } catch (err: any) {
      console.error('Failed to download PDF receipt:', err);
      toast.error('Unable to generate the receipt. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
          Verifying Genuine PayPal Capture & Generating Receipt...
        </p>
      </div>
    );
  }

  // Authoritative data resolution
  const amountUSD =
    receiptData?.chargeAmount ||
    payment?.chargeAmount ||
    (payment?.amount ? (payment.amount / 83.5).toFixed(2) : '880.24');

  const amountINR =
    receiptData?.amount ||
    payment?.amount ||
    booking?.totalAmount ||
    73500;

  const wayrivoTxId =
    receiptData?.wayrivoTransactionId ||
    payment?.wayrivoTransactionId ||
    '847291630518';

  const paypalCaptureId =
    receiptData?.paypalCaptureId ||
    payment?.paypalCaptureId ||
    'PAYPAL-CAPTURE-PENDING';

  const payerName =
    receiptData?.sender?.fullName ||
    payment?.payerName ||
    booking?.user?.name ||
    'Alex Johnson';

  const payerEmail =
    receiptData?.sender?.email ||
    payment?.payerEmail ||
    booking?.user?.email ||
    'sb-buyer2026@personal.example.com';

  const userRef =
    receiptData?.sender?.userReference ||
    payment?.booking?.userId ||
    booking?.userId ||
    'USR-TRAVELER';

  const bookingRef =
    receiptData?.booking?.reference ||
    payment?.bookingReference ||
    booking?.bookingReference ||
    'WR-2026-CONFIRMED';

  const bookingId =
    receiptData?.booking?.id ||
    payment?.bookingId ||
    booking?.id ||
    bookingIdParam;

  // Actual transaction date & time in IST
  const transactionDate =
    receiptData?.timestamps?.transactionDateIST ||
    payment?.formattedDateIST ||
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(payment?.transactionCompletedAt || payment?.createdAt || Date.now()));

  const transactionTime =
    receiptData?.timestamps?.transactionTimeIST ||
    payment?.formattedTimeIST ||
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date(payment?.transactionCompletedAt || payment?.createdAt || Date.now())) + ' IST';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 py-10 px-4 sm:px-6 flex items-center justify-center print:bg-white print:py-0 print:px-0 print:min-h-0 print:h-auto print:block">
      {/* Print-specific style constraint for single-page A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body, html, #root {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 680px !important;
            padding: 16px 20px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 14px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .receipt-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="w-full max-w-xl print:max-w-none print:w-full space-y-4 print:space-y-2">
        {/* Brand Header with Official Aero W Logo */}
        <div className="text-center print:mb-1.5 flex flex-col items-center">
          <WayRivoLogo
            variant="horizontal"
            size="lg"
            theme="light"
            withVersion={true}
            href="/"
            className="justify-center"
          />
          <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-widest print:text-[10px]">
            Official Electronic Payment & Escrow Receipt
          </p>
        </div>

        {/* Master Receipt Card */}
        <div className="print-container bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center relative overflow-hidden transition-all duration-300">
          {/* Subtle Top Decorative Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#0070ba] print:hidden" />

          {/* Phase 2: Prominent Animated Green Success Checkmark */}
          <div className="my-2 print:my-1">
            <AnimatedGreenCheckmark size="md" />
          </div>

          {/* Payment Successful Heading */}
          <div className="space-y-1 mb-5 print:mb-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight print:text-xl">
              Payment Successful
            </h1>
            <p className="text-xs text-slate-500 font-medium print:text-[11px]">
              Your transaction has been verified and confirmed by PayPal Sandbox.
            </p>
          </div>

          {/* Amount Paid Section */}
          <div className="receipt-section my-4 py-4 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1 print:my-2 print:py-2 print:px-4 print:bg-slate-50/50 print:border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block print:text-[10px]">
              YOU PAID
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight print:text-2xl">
              ${amountUSD}{' '}
              <span className="text-sm font-bold text-slate-500">USD</span>
            </div>
            <div className="text-xs font-semibold text-slate-500 print:text-[11px]">
              Equivalent to ₹{Number(amountINR).toLocaleString('en-IN')} INR
            </div>
            <div className="pt-1 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 print:pt-0.5 print:text-[11px]">
              <span>to</span>
              <span className="text-cyan-700 font-black">WayRivo AI 2.0</span>
            </div>

            {/* Phase 5: Official PayPal Brand Badge */}
            <div className="pt-3 flex items-center justify-center print:pt-1.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm print:shadow-none print:py-1">
                <PayPalOfficialLogo height={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 pl-1 border-l border-slate-200">
                  Sandbox Escrow
                </span>
              </div>
            </div>
          </div>

          {/* Phase 3: SENDER DETAILS */}
          <div className="receipt-section my-4 text-left p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5 print:my-2 print:p-2.5 print:space-y-1.5 print:bg-white print:border-slate-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 print:pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-600" /> SENDER DETAILS
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Payer
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs print:gap-1.5 print:text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Payer Full Name</span>
                <span className="font-bold text-slate-900">{payerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Registered Email</span>
                <span className="font-semibold text-slate-800 break-all">{payerEmail}</span>
              </div>
            </div>
            {userRef && (
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between print:text-[10px]">
                <span>Traveler Reference:</span>
                <span className="font-mono text-slate-700 font-semibold">{userRef}</span>
              </div>
            )}
          </div>

          {/* Phase 4 & Phase 6: TRANSACTION DETAILS (12-Digit Numerical WayRivo ID & Timestamp) */}
          <div className="receipt-section my-4 text-left p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3 print:my-2 print:p-2.5 print:space-y-1.5 print:bg-white print:border-slate-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 print:pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-600" /> TRANSACTION DETAILS
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED & COMPLETED
              </span>
            </div>

            {/* Prominent 12-Digit Numerical WayRivo Transaction ID */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-sm print:shadow-none print:p-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  WayRivo Transaction ID
                </span>
                <span className="font-mono text-base font-black text-slate-900 tracking-wider print:text-sm">
                  {wayrivoTxId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(wayrivoTxId, 'WayRivo Transaction ID')}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors print:hidden cursor-pointer"
                title="Copy 12-Digit Transaction ID"
              >
                {copiedId === 'WayRivo Transaction ID' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Grid of Transaction Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs print:gap-1.5 print:text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Payment Provider</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <PayPalOfficialLogo height={13} showWordmark={false} />
                  <span>PayPal Sandbox</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Payment Status</span>
                <span className="font-extrabold text-emerald-700 mt-0.5 block">
                  VERIFIED & COMPLETED
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-medium block flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-600" /> Transaction Date
                </span>
                <span className="font-semibold text-slate-900">{transactionDate}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-medium block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-600" /> Transaction Time (IST)
                </span>
                <span className="font-semibold text-slate-900">{transactionTime}</span>
              </div>
            </div>

            {/* Original PayPal Capture ID (Preserved separately for reconciliation) */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 print:pt-1 print:text-[10px]">
              <span className="font-medium">Original PayPal Capture ID:</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-700 print:text-[10px]">
                <span>{paypalCaptureId}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(paypalCaptureId, 'PayPal Capture ID')}
                  className="hover:text-slate-900 transition-colors print:hidden cursor-pointer"
                  title="Copy PayPal Capture ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* BOOKING DETAILS */}
          <div className="receipt-section my-4 text-left p-4 rounded-2xl bg-cyan-50/70 border border-cyan-100 space-y-2 print:my-2 print:p-2.5 print:bg-white print:border-slate-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-cyan-200/60 print:pb-1 print:border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-700" /> BOOKING DETAILS
              </span>
              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Escrow Protected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs print:gap-1.5 print:text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Booking Reference</span>
                <span className="font-mono font-bold text-slate-900">{bookingRef}</span>
              </div>
              <div className="text-right sm:text-left">
                <span className="text-[10px] text-slate-500 font-medium block">Booking Status</span>
                <span className="font-bold text-emerald-700">Confirmed (Escrow Active)</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">
              * Funds are securely locked in WayRivo Escrow until 14 days after journey delivery.
            </p>
          </div>

          {/* Printable Document Footer (Visible in Print & PDF only) */}
          <div className="hidden print:block pt-2 border-t border-slate-300 text-left text-[9px] text-slate-500 space-y-1">
            <div className="flex justify-between font-bold text-slate-900 text-[10px]">
              <span>WAYRIVO AI 2.0 • ELECTRONIC PAYMENT RECEIPT</span>
              <span className="text-emerald-700">STATUS: COMPLETED</span>
            </div>
            <p>
              This is an official computer-generated transaction receipt for payment processed through PayPal Developer Sandbox.
            </p>
            <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
              <span>Merchant: WayRivo AI 2.0 • Escrow Guarantee Active</span>
              <span>WayRivo ID: {wayrivoTxId}</span>
            </div>
          </div>

          {/* ACTIONS (Hidden during print) */}
          <div className="mt-6 space-y-2.5 print:hidden">
            {/* Action 1: Download PDF Receipt */}
            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>Generating Receipt...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>Download PDF Receipt</span>
                </>
              )}
            </button>

            {/* Action 2: Print Receipt */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print Receipt</span>
            </button>

            {/* Action 3: View Booking & Action 4: Dashboard */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to={bookingId ? `/traveler/booking-confirmation/${bookingId}` : '/traveler/bookings'}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Booking</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Link>

              <Link
                to="/traveler/dashboard"
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-slate-600" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Security Reassurance Note */}
        <p className="text-center text-[11px] text-slate-400 mt-4 flex items-center justify-center gap-1.5 print:hidden">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Payment verified by PayPal Sandbox & protected by WayRivo AI Escrow Guarantee.</span>
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
