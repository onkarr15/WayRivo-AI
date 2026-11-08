import React from 'react';
import { AeroWMark } from './AeroWMark';
import { type WayRivoIconProps } from './branding.types';

export const WayRivoIcon: React.FC<WayRivoIconProps> = ({
  size = 'md',
  width,
  height,
  theme = 'primary',
  color,
  glow = false,
  animated = false,
  rounded = true,
  border = true,
  background = true,
  className = '',
  title = 'WayRivo AI — Aero W Icon',
}) => {
  // Container size mapping
  const containerSizeMap: Record<string, string> = {
    xs: 'w-6 h-6 p-0.5',
    sm: 'w-8 h-8 p-1',
    md: 'w-9 h-9 sm:w-10 sm:h-10 p-1.5',
    lg: 'w-12 h-12 p-2',
    xl: 'w-16 h-16 p-2.5',
    '2xl': 'w-24 h-24 p-3.5',
  };

  const containerClasses = typeof size === 'string' ? containerSizeMap[size] || 'w-10 h-10 p-1.5' : '';
  const customDimensions =
    width || height || typeof size === 'number'
      ? {
          width: width ?? (typeof size === 'number' ? size : undefined),
          height: height ?? (typeof size === 'number' ? size : undefined),
        }
      : {};

  // Theme-specific styling for the container
  const bgClasses = background
    ? theme === 'light'
      ? 'bg-slate-100/90 shadow-sm'
      : 'bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-[#071B33] shadow-lg shadow-cyan-500/15'
    : '';

  const borderClasses = border
    ? theme === 'light'
      ? 'border border-slate-200'
      : 'border border-cyan-500/25 hover:border-cyan-400/50'
    : '';

  const roundedClasses = rounded ? 'rounded-xl sm:rounded-2xl' : '';

  return (
    <div
      style={customDimensions}
      className={`inline-flex items-center justify-center relative overflow-hidden transition-all duration-300 ${containerClasses} ${roundedClasses} ${bgClasses} ${borderClasses} ${className}`}
    >
      {/* Subtle inner top highlight */}
      {background && theme !== 'light' && (
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-cyan-400/10 to-transparent pointer-events-none" />
      )}

      <AeroWMark
        width="100%"
        height="100%"
        theme={theme}
        color={color}
        glow={glow}
        animated={animated}
        title={title}
      />
    </div>
  );
};

export default WayRivoIcon;
