import React from 'react';

export type BadgeVariant = 'cyan' | 'gold' | 'turquoise' | 'success' | 'warning' | 'danger' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  glow?: boolean;
  dot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  glow = false,
  dot = false,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full tracking-wide select-none transition-all';

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles: Record<BadgeVariant, string> = {
    cyan: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    gold: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    turquoise: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    danger: 'bg-red-500/15 text-red-300 border border-red-500/30',
    neutral: 'bg-slate-800/80 text-slate-300 border border-slate-700/80',
  };

  const glowStyles: Record<BadgeVariant, string> = {
    cyan: 'shadow-[0_0_12px_rgba(0,240,255,0.3)]',
    gold: 'shadow-[0_0_12px_rgba(212,175,55,0.3)]',
    turquoise: 'shadow-[0_0_12px_rgba(20,184,166,0.3)]',
    success: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    warning: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    danger: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
    neutral: 'shadow-[0_0_10px_rgba(100,116,139,0.2)]',
  };

  const dotColor: Record<BadgeVariant, string> = {
    cyan: 'bg-cyan-400',
    gold: 'bg-amber-400',
    turquoise: 'bg-teal-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${glow ? glowStyles[variant] : ''} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor[variant]} animate-pulse`} />}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
