import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

export interface PaymentCountdownTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  onRestart?: () => void;
  onReturnToBooking?: () => void;
  isExpired?: boolean;
  className?: string;
}

export const PaymentCountdownTimer: React.FC<PaymentCountdownTimerProps> = ({
  expiresAt,
  onExpire,
  onRestart,
  onReturnToBooking,
  isExpired: initialExpired = false,
  className = '',
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (initialExpired) return 0;
    const target = new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((target - Date.now()) / 1000));
  });

  const [hasExpired, setHasExpired] = useState<boolean>(initialExpired);
  const onExpireCalledRef = useRef<boolean>(false);

  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));

      setSecondsRemaining(diff);

      if (diff === 0) {
        setHasExpired(true);
        if (!onExpireCalledRef.current) {
          onExpireCalledRef.current = true;
          onExpire?.();
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  // Format seconds into MM:SS
  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // State thresholds:
  // Normal state: > 2 minutes (> 120s)
  // Warning state: < 2 minutes (<= 120s and > 60s)
  // Critical state: < 1 minute (<= 60s and > 0s)
  // Expired: 0s
  const isCritical = secondsRemaining > 0 && secondsRemaining <= 60;
  const isWarning = secondsRemaining > 60 && secondsRemaining <= 120;

  // Dedicated Expired State Screen
  if (hasExpired || secondsRemaining === 0) {
    return (
      <div
        className={`w-full p-6 sm:p-8 rounded-3xl bg-rose-950/80 border-2 border-rose-500/80 shadow-[0_0_40px_rgba(244,63,94,0.25)] text-center space-y-4 animate-in fade-in duration-300 print:hidden ${className}`}
      >
        <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-300 shadow-inner">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30">
            PAYMENT SESSION EXPIRED
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Reservation Hold Expired
          </h3>
          <p className="text-xs text-rose-200/90 leading-relaxed">
            Your 6-minute payment session has timed out. To prevent double bookings and release reserved inventory, please renew your payment session.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onReturnToBooking && (
            <button
              type="button"
              onClick={onReturnToBooking}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Booking
            </button>
          )}
          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-rose-500/30"
            >
              <RefreshCw className="w-4 h-4" /> Start New Payment
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active Prominent Centered Timer Panel
  return (
    <div
      className={`w-full rounded-3xl p-6 sm:p-7 text-center transition-all duration-300 border shadow-2xl relative overflow-hidden print:hidden ${
        isCritical
          ? 'bg-gradient-to-b from-rose-950/80 via-slate-900 to-slate-950 border-rose-500/70 shadow-[0_0_35px_rgba(244,63,94,0.22)]'
          : isWarning
          ? 'bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-950 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.18)]'
          : 'bg-gradient-to-b from-slate-900/95 via-slate-900 to-slate-950 border-cyan-500/40 shadow-[0_0_35px_rgba(0,240,255,0.14)]'
      } ${className}`}
    >
      {/* Top Accent Glow Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          isCritical
            ? 'bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600 animate-pulse'
            : isWarning
            ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600'
            : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500'
        }`}
      />

      <div className="flex flex-col items-center justify-center space-y-2.5">
        {/* Eyebrow Label with Pulsing Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border">
          <span
            className={`w-2 h-2 rounded-full animate-ping ${
              isCritical ? 'bg-rose-400' : isWarning ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
          />
          <span
            className={`${
              isCritical
                ? 'text-rose-300'
                : isWarning
                ? 'text-amber-300'
                : 'text-cyan-300'
            }`}
          >
            {isCritical
              ? 'CRITICAL • SESSION EXPIRING'
              : isWarning
              ? 'WARNING • EXPIRING SOON'
              : 'PAYMENT SESSION'}
          </span>
        </div>

        {/* Prominent Large Numerical Digits (e.g. 05:42) */}
        <div className="py-1">
          <div
            className={`font-mono text-4xl sm:text-5xl font-black tracking-widest leading-none drop-shadow-md select-none ${
              isCritical
                ? 'text-rose-400 animate-pulse'
                : isWarning
                ? 'text-amber-400'
                : 'text-white'
            }`}
          >
            {formatTime(secondsRemaining)}
          </div>
        </div>

        {/* Supporting Guidance Text */}
        <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-sm mx-auto leading-relaxed">
          Complete your payment before the payment session expires.
        </p>

        {/* Warning / Critical Banner */}
        {isCritical && (
          <div className="w-full mt-2 pt-2.5 border-t border-rose-500/30 flex items-center justify-center gap-2 text-xs font-bold text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 animate-pulse" />
            <span>Less than 60 seconds left! Complete transaction to avoid session reset.</span>
          </div>
        )}
        {isWarning && (
          <div className="w-full mt-2 pt-2.5 border-t border-amber-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Under 2 minutes remaining on your temporary escrow reservation hold.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCountdownTimer;
