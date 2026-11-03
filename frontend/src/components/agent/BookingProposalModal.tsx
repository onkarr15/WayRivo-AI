import React from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BookingProposalModalProps {
  proposal: any;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingProposalModal: React.FC<BookingProposalModalProps> = ({
  proposal,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  if (!isOpen || !proposal) return null;

  const handleProceedToCheckout = () => {
    onClose();
    // Navigate to bookings or checkout
    navigate(`/traveler/bookings`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-navy-card border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-950/50 to-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {proposal.bookingReference || 'WR-2026-PROPOSAL'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Unconfirmed Proposal
                </span>
              </div>
              <h3 className="text-base font-black text-white">Booking Proposal Ready</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Trust Banner */}
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-cyan-200">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white leading-tight">PayPal Developer Sandbox Escrow Protection</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Funds are held in neutral escrow and only disbursed to agencies 24 hours after arrival inspection.
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Itemized Proposal Breakdown</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {(proposal.items || []).map((item: any, i: number) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white leading-tight">{item.title}</p>
                      <span className="text-[10px] text-slate-400">Qty: {item.quantity || 1}</span>
                    </div>
                  </div>
                  <span className="font-bold text-cyan-300">
                    ₹{Number(item.totalPrice || item.unitPrice || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-cyan-500/20 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Total Escrow Amount</span>
              <span className="text-xs text-slate-500">Includes all verified taxes and agency fees</span>
            </div>
            <span className="text-2xl font-black text-white">
              ₹{Number(proposal.totalAmount || 25000).toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-[10px] text-slate-400 italic text-center">
            * This proposal does not charge your account. Explicit confirmation and PayPal Escrow authorization are required.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 bg-slate-900/60">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Review Later
          </button>
          <button
            onClick={handleProceedToCheckout}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>View Bookings & Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

