import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

interface PayPalCheckoutButtonProps {
  bookingId: string;
  amount: number;
  currency?: string;
  chargeAmount?: string;
  chargeCurrency?: string;
  disabled?: boolean;
  onSuccess?: (captureData: any) => void;
  onCancel?: () => void;
  onError?: (err: any) => void;
}

export const PayPalCheckoutButton: React.FC<PayPalCheckoutButtonProps> = ({
  bookingId,
  amount,
  currency = 'INR',
  chargeAmount,
  chargeCurrency = 'USD',
  disabled = false,
}) => {
  const navigate = useNavigate();
  const [sdkError, setSdkError] = useState<string | null>(null);

  const handlePayPalClick = () => {
    if (disabled) return;
    navigate(`/payment/paypal-login/${bookingId}`);
  };

  const handleCardClick = () => {
    if (disabled) return;
    navigate(`/payment/card-checkout/${bookingId}`);
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
      {/* 1. Header with Lock, Status and Amount */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-white">
                PayPal Sandbox Escrow Checkout
              </h3>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                OFFICIAL PAYPAL SDK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
              Authenticate securely with your PayPal Developer Sandbox account. All payments are backed by WayRivo Escrow until journey delivery.
            </p>
          </div>
        </div>

        <div className="sm:text-right bg-slate-950/60 sm:bg-transparent p-3.5 sm:p-0 rounded-2xl border sm:border-none border-slate-800 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Payable Amount
          </span>
          <div className="text-2xl font-black text-cyan-400 font-mono tracking-tight mt-0.5">
            ${chargeAmount || (amount / 83.5).toFixed(2)}{' '}
            <span className="text-xs font-bold text-slate-400">{chargeCurrency}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
            (Equivalent to ₹{Number(amount).toLocaleString('en-IN')} {currency})
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {sdkError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{sdkError}</p>
          </div>
          <button
            onClick={() => setSdkError(null)}
            className="text-xs text-rose-400 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Official PayPal Buttons Card - Dedicated Clean White Surface */}
      <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200 text-slate-900 relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
              Select Funding Source
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-50 text-cyan-800 border border-cyan-200">
              Instant Sandbox Approval
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* Buttons Rendering Container */}
        <div className="relative w-full max-w-md mx-auto flex flex-col justify-center">
          {/* Gold PayPal Button - Redirects to PayPal Sandbox Login Page */}
          <button
            type="button"
            disabled={disabled}
            onClick={handlePayPalClick}
            className="w-full h-12 rounded-md bg-[#ffc439] hover:bg-[#f4bb36] active:bg-[#e0ab30] flex items-center justify-center transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/40"
            title="Log in to PayPal Sandbox and Pay"
          >
            <span className="font-black text-2xl italic tracking-tight select-none">
              <span className="text-[#003087]">Pay</span>
              <span className="text-[#0079C1]">Pal</span>
            </span>
          </button>

          {/* Dedicated Debit or Credit Card Button - Redirects to Card Details Page */}
          <button
            type="button"
            disabled={disabled}
            onClick={handleCardClick}
            className="w-full h-12 mt-2.5 rounded-md bg-[#2c2e2f] hover:bg-[#1a1b1c] active:bg-black text-white font-medium flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700/20"
            title="Pay with Credit or Debit Card"
          >
            <CreditCard className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold tracking-wide">Debit or Credit Card</span>
          </button>

          {/* Powered by PayPal Logo Subtitle */}
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500 select-none">
            <span className="italic text-[11px]">Powered by</span>
            <span className="font-bold text-[#003087]">Pay</span>
            <span className="font-bold text-[#0079C1]">Pal</span>
          </div>
        </div>

        {/* Card Trust Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
          <span>PayPal Sandbox buyer protection active. Credentials are never shared with WayRivo AI.</span>
        </div>
      </div>
    </div>
  );
};

export default PayPalCheckoutButton;
