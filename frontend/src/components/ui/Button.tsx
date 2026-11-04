import React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-lg',
    md: 'text-sm px-5 py-2.5 gap-2 rounded-xl',
    lg: 'text-base px-6 py-3.5 gap-2.5 rounded-2xl',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-cyan-400 via-cyan-500 to-teal-400 text-slate-950 font-bold hover:from-cyan-300 hover:to-teal-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 border border-cyan-300/30',
    secondary:
      'bg-surface-elevated text-slate-100 hover:bg-surface-hover border border-border-light hover:border-cyan/40 shadow-sm',
    gold:
      'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-300 text-slate-950 font-bold hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/20 border border-amber-300/30',
    outline:
      'border-2 border-cyan/70 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 shadow-sm',
    ghost:
      'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent',
    danger:
      'bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 border border-red-400/30',
    success:
      'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 border border-emerald-400/30',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const hoverScale = disabled || isLoading || shouldReduceMotion ? 1 : 1.02;
  const tapScale = disabled || isLoading || shouldReduceMotion ? 1 : 0.98;

  return (
    <motion.button
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: tapScale }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};
