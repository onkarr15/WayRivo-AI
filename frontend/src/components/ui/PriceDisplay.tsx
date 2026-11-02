import React from 'react';

export interface PriceDisplayProps {
  amount: number | string;
  currency?: string;
  originalAmount?: number | string;
  period?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'cyan' | 'gold' | 'white';
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  currency = 'INR',
  originalAmount,
  period = 'per person',
  size = 'md',
  variant = 'cyan',
  className = '',
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;

  const formattedAmount = typeof amount === 'number' ? amount.toLocaleString('en-IN') : amount;
  const formattedOriginal = typeof originalAmount === 'number' ? originalAmount.toLocaleString('en-IN') : originalAmount;

  const sizeStyles = {
    sm: { amount: 'text-base font-bold', period: 'text-[11px]' },
    md: { amount: 'text-xl font-extrabold', period: 'text-xs' },
    lg: { amount: 'text-2xl sm:text-3xl font-extrabold', period: 'text-xs sm:text-sm' },
    xl: { amount: 'text-3xl sm:text-4xl font-black tracking-tight', period: 'text-sm' },
  }[size];

  const variantStyles = {
    cyan: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]',
    gold: 'text-amber-400 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]',
    white: 'text-white',
  }[variant];

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-baseline gap-2">
        {formattedOriginal && (
          <span className="text-xs sm:text-sm text-slate-500 line-through font-medium">
            {currencySymbol}{formattedOriginal}
          </span>
        )}
        <span className={`${sizeStyles.amount} ${variantStyles} font-mono tracking-tight`}>
          {currencySymbol}{formattedAmount}
        </span>
      </div>
      {period && (
        <span className={`${sizeStyles.period} text-slate-400 font-medium capitalize mt-0.5`}>
          {period}
        </span>
      )}
    </div>
  );
};
