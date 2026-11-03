import React from 'react';
import { Wallet, ShieldCheck, AlertCircle } from 'lucide-react';

interface BudgetSummaryProps {
  budget: {
    destination?: string;
    numberOfDays?: number;
    travelersCount?: number;
    travelStyle?: string;
    totalCalculatedCost: number;
    userBudget?: number;
    remainingBalance?: number;
    budgetStatus: 'OPTIMAL' | 'TIGHT' | 'EXCEEDED' | 'LUXURY_SURPLUS';
    breakdown?: {
      accommodation: number;
      activities: number;
      mealsAndDining: number;
      localTransport: number;
    };
    breakdownPercentage?: {
      accommodation: number;
      activities: number;
      mealsAndDining: number;
      localTransport: number;
    };
    notes?: string;
  };
}

export const BudgetSummaryCard: React.FC<BudgetSummaryProps> = ({ budget }) => {
  const statusConfig = {
    OPTIMAL: {
      label: 'Optimal Budget',
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-300',
      border: 'border-cyan-500/30',
      icon: ShieldCheck,
    },
    LUXURY_SURPLUS: {
      label: 'Surplus Buffer',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
      icon: ShieldCheck,
    },
    TIGHT: {
      label: 'Tight Allocation',
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      icon: AlertCircle,
    },
    EXCEEDED: {
      label: 'Exceeds Target',
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
      icon: AlertCircle,
    },
  };

  const status = statusConfig[budget.budgetStatus] || statusConfig.OPTIMAL;
  const StatusIcon = status.icon;

  const pct = budget.breakdownPercentage || {
    accommodation: 45,
    activities: 20,
    mealsAndDining: 25,
    localTransport: 10,
  };

  return (
    <div className="rounded-2xl bg-navy-card/95 border border-cyan-500/25 p-4 my-3 shadow-xl shadow-cyan-950/20">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Estimated Expenditure</h4>
            <span className="text-[10px] text-slate-400">
              {budget.numberOfDays || 5} Days • {budget.travelersCount || 2} Travelers • {budget.travelStyle || 'Curated'}
            </span>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.bg} ${status.text} ${status.border}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {/* Main Total Comparison */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/60 border border-white/5 mb-3">
        <div>
          <span className="text-[10px] text-slate-400 block">Total Calculated Cost</span>
          <span className="text-xl font-black text-white">
            ₹{Number(budget.totalCalculatedCost).toLocaleString('en-IN')}
          </span>
        </div>
        {budget.userBudget && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Target Budget</span>
            <span className="text-xl font-black text-cyan-300">
              ₹{Number(budget.userBudget).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Segmented Progress Bar */}
      <div className="space-y-1.5 mb-3">
        <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
          <div
            style={{ width: `${pct.accommodation}%` }}
            className="bg-cyan-500 transition-all duration-500"
            title={`Stay: ${pct.accommodation}%`}
          />
          <div
            style={{ width: `${pct.activities}%` }}
            className="bg-teal-400 transition-all duration-500"
            title={`Activities: ${pct.activities}%`}
          />
          <div
            style={{ width: `${pct.mealsAndDining}%` }}
            className="bg-amber-400 transition-all duration-500"
            title={`Dining: ${pct.mealsAndDining}%`}
          />
          <div
            style={{ width: `${pct.localTransport}%` }}
            className="bg-purple-400 transition-all duration-500"
            title={`Transport: ${pct.localTransport}%`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] pt-1">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
            <span className="truncate">
              Stay: <strong>₹{budget.breakdown?.accommodation?.toLocaleString('en-IN') || 0}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
            <span className="truncate">
              Acts: <strong>₹{budget.breakdown?.activities?.toLocaleString('en-IN') || 0}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="truncate">
              Food: <strong>₹{budget.breakdown?.mealsAndDining?.toLocaleString('en-IN') || 0}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
            <span className="truncate">
              Trans: <strong>₹{budget.breakdown?.localTransport?.toLocaleString('en-IN') || 0}</strong>
            </span>
          </div>
        </div>
      </div>

      {budget.notes && (
        <p className="text-[11px] text-slate-400 italic pt-2 border-t border-white/5">
          {budget.notes}
        </p>
      )}
    </div>
  );
};
