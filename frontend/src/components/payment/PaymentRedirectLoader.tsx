import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { PayPalOfficialLogo } from './PayPalOfficialLogo';

export interface PaymentRedirectLoaderProps {
  isOpen: boolean;
  title: string;
  description: string;
  supportingText?: string;
  minimumDisplayDuration?: number; // milliseconds (e.g. 2500ms)
  onComplete?: () => void;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const PaymentRedirectLoader: React.FC<PaymentRedirectLoaderProps> = ({
  isOpen,
  title,
  description,
  supportingText = 'Connecting to PayPal Developer Sandbox securely.',
  minimumDisplayDuration = 2500,
  onComplete,
  isError = false,
  errorMessage,
  onRetry,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Minimum display duration countdown
    const timer = setTimeout(() => {
      if (!isError && onComplete) {
        onComplete();
      }
    }, minimumDisplayDuration);

    return () => clearTimeout(timer);
  }, [isOpen, minimumDisplayDuration, isError, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          aria-busy={!isError}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.18)] text-center relative overflow-hidden"
          >
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-[#0079C1]" />

            {/* Error State */}
            {isError ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-inner">
                  <AlertCircle className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                    CONNECTION FAILED
                  </span>
                  <h3 className="text-lg font-bold text-white">Connection Error</h3>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    {errorMessage || 'Unable to establish secure connection with PayPal Sandbox. Please try again.'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-cyan-500/20"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Try Again
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Loading / Buffering State */
              <div className="space-y-5">
                {/* Brand Monogram Row */}
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5 text-base font-black tracking-wider text-white">
                    WAY<span className="text-cyan-400">RIVO</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      AI 2.0
                    </span>
                  </div>
                  <span className="text-slate-600 text-xs">•</span>
                  <div className="bg-white/95 px-2.5 py-1 rounded-full border border-slate-700/40 flex items-center shadow-sm">
                    <PayPalOfficialLogo height={13} showWordmark={true} />
                  </div>
                </div>

                {/* Animated Circular Spinner with Glow */}
                <div className="relative w-20 h-20 mx-auto my-2 flex items-center justify-center">
                  {/* Outer Pulsing Glow */}
                  <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />

                  {/* SVG Rotating Ring */}
                  <svg className="w-20 h-20 animate-spin" viewBox="0 0 100 100" fill="none">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#spinner-gradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="180 70"
                    />
                    <defs>
                      <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00F0FF" />
                        <stop offset="50%" stopColor="#14B8A6" />
                        <stop offset="100%" stopColor="#0079C1" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Center Lock / Shield Icon */}
                  <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                {/* Heading & Supporting Text */}
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Subtle PayPal / WayRivo Escrow Security Note */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{supportingText}</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentRedirectLoader;
