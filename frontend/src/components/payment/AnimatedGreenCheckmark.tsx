import React from 'react';
import { Check } from 'lucide-react';

export interface AnimatedGreenCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimatedGreenCheckmark: React.FC<AnimatedGreenCheckmarkProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20 sm:w-24 sm:h-24',
    lg: 'w-28 h-28',
  };

  const iconSizes = {
    sm: 'w-7 h-7 stroke-[3.5]',
    md: 'w-10 h-10 sm:w-12 sm:h-12 stroke-[3.5]',
    lg: 'w-14 h-14 stroke-[4]',
  };

  return (
    <div
      className={`mx-auto flex items-center justify-center print:animate-none ${className}`}
      aria-label="Payment Successful Checkmark"
    >
      <div className="relative">
        {/* Outer glowing pulsing ring (hidden in print) */}
        <div
          className={`absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-60 print:hidden`}
        />

        {/* Outer subtle soft halo */}
        <div
          className={`rounded-full p-2 bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center print:bg-transparent print:border-none print:p-0`}
        >
          {/* Inner solid circular green indicator */}
          <div
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/25 transition-transform duration-500 scale-100 animate-in zoom-in-75 print:shadow-none print:bg-emerald-600`}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
            }}
          >
            {/* Crisp white checkmark */}
            <Check
              className={`${iconSizes[size]} text-white transition-all duration-300 animate-in zoom-in-50`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

