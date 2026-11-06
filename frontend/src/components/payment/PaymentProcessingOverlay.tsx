import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';

export interface PaymentProcessingOverlayProps {
  isOpen: boolean;
  amount?: string;
  currency?: string;
  stageMessage?: string;
}

export const PaymentProcessingOverlay: React.FC<PaymentProcessingOverlayProps> = ({
  isOpen,
  amount,
  currency = 'USD',
  stageMessage = 'Waiting For The Successful Transaction...',
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-payment-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      {/* Centered Premium Modal Card with Clean Light-Neutral Surface */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center relative transform transition-all duration-300 scale-100 p-8 sm:p-10 space-y-6">
        {/* Subtle Decorative Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-700 via-cyan-500 to-[#0070ba]" />

        {/* Brand Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-2xl font-black tracking-wider text-[#003087]">
            WAY<span className="text-cyan-500">RIVO</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-cyan-50 text-cyan-700 border border-cyan-200">
              AI 2.0
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
            Intelligent Travel Escrow Platform
          </p>
        </div>

        {/* Polished Animated Dual-Ring Loading Spinner */}
        <div className="relative w-24 h-24 mx-auto my-4 flex items-center justify-center">
          {/* Outer glowing pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping opacity-60" />
          
          {/* Subtle outer static ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          
          {/* Primary animated spinning ring with gradient edge */}
          <div className="absolute inset-0 rounded-full border-4 border-[#0070ba] border-t-cyan-400 border-r-transparent animate-spin duration-1000" />
          
          {/* Secondary counter-spinning inner accent */}
          <div className="absolute inset-3 rounded-full border-2 border-slate-200 border-b-cyan-500 border-l-transparent animate-spin duration-700" />

          {/* Centered Shield & Lock Icon */}
          <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-[#003087] to-[#0070ba] flex items-center justify-center text-white shadow-md">
            <Lock className="w-5 h-5 text-cyan-300" />
          </div>
        </div>

        {/* Primary Typography & Message */}
        <div className="space-y-2">
          <h2
            id="processing-payment-title"
            className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
          >
            Processing Your Payment
          </h2>
          <p className="text-sm sm:text-base font-extrabold text-[#0070ba] animate-pulse">
            "{stageMessage}"
          </p>
          {amount && (
            <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
              Amount: <span className="font-black text-slate-900">${amount} {currency}</span>
            </div>
          )}
        </div>

        {/* Instructional & Reassurance Copy */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600 leading-relaxed text-center">
          <p className="font-semibold text-slate-800">
            Please do not close this window or refresh the page.
          </p>
          <p className="text-[11px] text-slate-500">
            Your payment is being securely processed through PayPal Sandbox.
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            This may take a few seconds.
          </p>
        </div>

        {/* Security Trust Badges */}
        <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-500 border-t border-slate-100">
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified PayPal Gateway
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            <Lock className="w-3.5 h-3.5 text-[#0070ba]" />
            WayRivo Escrow Protected
          </span>
        </div>
      </div>
    </div>
  );
};

