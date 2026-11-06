import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

export const PaymentCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get('bookingId');
  const reason = searchParams.get('reason') || 'Payment approval was not completed.';

  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 text-xl font-black tracking-wider text-white">
            WAY<span className="text-gradient-cyan">RIVO</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              AI 2.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Secure Escrow Travel Engine</p>
        </div>

        {/* Cancellation Notice Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Payment Not Completed
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            The PayPal checkout process was cancelled or interrupted. Rest assured,{' '}
            <strong className="text-white">no funds have been deducted</strong> from your account or
            card.
          </p>

          {/* Details Box */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Notice:</span>
              <span className="text-amber-400 font-semibold">{reason}</span>
            </div>
            {bookingId && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Booking Reference:</span>
                <span className="font-mono text-cyan-300">{bookingId}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Reservation Status:</span>
              <span className="text-slate-300 font-semibold">Saved (Pending Payment)</span>
            </div>
          </div>

          {/* Escrow Assurance */}
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center gap-2 text-left mb-6">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>Your reservation is safely saved in your account. You can complete payment at any time.</span>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {bookingId ? (
              <Link
                to={`/traveler/booking-confirmation/${bookingId}`}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Return to Checkout & Retry</span>
              </Link>
            ) : (
              <Link
                to="/traveler/bookings"
                className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Go to My Bookings</span>
              </Link>
            )}

            <Link
              to="/traveler/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Traveler Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
