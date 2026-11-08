import React, { useId } from 'react';
import { type AeroWMarkProps, type BrandSize } from './branding.types';

const SIZE_MAP: Record<string, number> = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 42,
  xl: 60,
  '2xl': 88,
};

function resolveDimension(size: BrandSize | undefined, fallback: number): number {
  if (typeof size === 'number') return size;
  if (typeof size === 'string' && SIZE_MAP[size]) return SIZE_MAP[size];
  return fallback;
}

export const AeroWMark: React.FC<AeroWMarkProps> = ({
  size = 'md',
  width,
  height,
  theme = 'primary',
  color,
  glow = false,
  animated = false,
  className = '',
  title = 'Aero W — WayRivo AI Official Brand Symbol',
}) => {
  const uid = useId().replace(/:/g, '');
  const dimension = resolveDimension(size, 32);
  const finalWidth = width ?? dimension;
  const finalHeight = height ?? dimension;

  // Palette definitions according to WayRivo Official Brand Guide
  // Midnight Navy: #071B33, Ocean Blue: #1677D2, Electric Cyan: #35D6E8, Cloud White: #F8FAFC, Gold: #D6B778
  const isMonochrome = theme === 'monochrome' || theme === 'white' || theme === 'black';
  const monoFill =
    color ||
    (theme === 'white' ? '#FFFFFF' : theme === 'black' ? '#071B33' : 'currentColor');

  const gradPrimaryId = `aero-primary-${uid}`;
  const gradWingId = `aero-wing-${uid}`;
  const gradFlightArcId = `aero-arc-${uid}`;
  const glowFilterId = `aero-glow-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={finalWidth}
      height={finalHeight}
      fill="none"
      className={`shrink-0 select-none ${animated ? 'transition-transform duration-300 hover:scale-105 will-change-transform' : ''} ${className}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      <defs>
        {/* Drop shadow / Ambient Glow Filter */}
        {glow && (
          <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#35D6E8" floodOpacity="0.45" />
          </filter>
        )}

        {/* 1. Primary Outer Wing Gradient: Ocean Blue to Electric Cyan */}
        <linearGradient id={gradPrimaryId} x1="0%" y1="100%" x2="100%" y2="0%">
          {theme === 'light' ? (
            <>
              <stop offset="0%" stopColor="#071B33" />
              <stop offset="70%" stopColor="#1677D2" />
              <stop offset="100%" stopColor="#0284C7" />
            </>
          ) : theme === 'dark' ? (
            <>
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="60%" stopColor="#35D6E8" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#1677D2" />
              <stop offset="60%" stopColor="#35D6E8" />
              <stop offset="100%" stopColor="#7EE7F2" />
            </>
          )}
        </linearGradient>

        {/* 2. Inner Aircraft Monogram Gradient: Electric Cyan to Ocean Blue */}
        <linearGradient id={gradWingId} x1="0%" y1="0%" x2="100%" y2="100%">
          {theme === 'light' ? (
            <>
              <stop offset="0%" stopColor="#1677D2" />
              <stop offset="100%" stopColor="#071B33" />
            </>
          ) : theme === 'dark' ? (
            <>
              <stop offset="0%" stopColor="#35D6E8" />
              <stop offset="100%" stopColor="#38BDF8" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#35D6E8" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1677D2" />
            </>
          )}
        </linearGradient>

        {/* 3. Supersonic Flight Trajectory Arc */}
        <linearGradient id={gradFlightArcId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#35D6E8" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#35D6E8" stopOpacity="1" />
          <stop offset="100%" stopColor="#D6B778" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      <g filter={glow ? `url(#${glowFilterId})` : undefined}>
        {/* ======================================================== */}
        {/* 1. LEFT OUTER WING / STROKE OF THE W                     */}
        {/* ======================================================== */}
        <path
          d="M 18 25 C 18 21.5, 22.5 19, 27 19 L 34 19 C 38 19, 41 21.5, 42.5 25.5 L 54 68 C 55.5 72.5, 52 77, 47.5 77 L 40 77 C 36.5 77, 33.5 74.5, 32 71.5 L 18.8 28.5 C 18.2 27.5, 18 26.2, 18 25 Z"
          fill={isMonochrome ? monoFill : `url(#${gradPrimaryId})`}
        />

        {/* ======================================================== */}
        {/* 2. RIGHT OUTER WING / STROKE OF THE W                    */}
        {/* ======================================================== */}
        <path
          d="M 102 25 C 102 21.5, 97.5 19, 93 19 L 86 19 C 82 19, 79 21.5, 77.5 25.5 L 66 68 C 64.5 72.5, 68 77, 72.5 77 L 80 77 C 83.5 77, 86.5 74.5, 88 71.5 L 101.2 28.5 C 101.8 27.5, 102 26.2, 102 25 Z"
          fill={isMonochrome ? monoFill : `url(#${gradPrimaryId})`}
        />

        {/* ======================================================== */}
        {/* 3. CENTRAL ASCENDING JET AIRCRAFT                        */}
        {/* Forms the inner diagonals, central apex, and delta wings */}
        {/* ======================================================== */}
        <path
          d="M 60 11 C 61.2 11, 62.4 12.2, 63 14 L 66.5 36 L 94 54 C 96 55.5, 95 58.5, 92.5 58.5 L 68 57.2 L 66 80.5 L 72 82 C 73.5 82.5, 73.5 84.5, 72 84.5 L 63 84.5 L 60 88 L 57 84.5 L 48 84.5 C 46.5 84.5, 46.5 82.5, 48 82 L 54 80.5 L 52 57.2 L 27.5 58.5 C 25 58.5, 24 55.5, 26 54 L 53.5 36 L 57 14 C 57.6 12.2, 58.8 11, 60 11 Z"
          fill={isMonochrome ? monoFill : `url(#${gradWingId})`}
        />

        {/* ======================================================== */}
        {/* 4. SLEEK COCKPIT CANOPY HIGHLIGHT                        */}
        {/* ======================================================== */}
        {!isMonochrome && (
          <ellipse cx="60" cy="24" rx="2.5" ry="6.5" fill="#F8FAFC" opacity="0.9" />
        )}

        {/* ======================================================== */}
        {/* 5. SUPERSONIC FLIGHT ORBIT TRAJECTORY ARC                */}
        {/* Connects the base of the W with curved aerospace motion  */}
        {/* ======================================================== */}
        <path
          d="M 16 70 C 32 87, 88 87, 104 70 C 88 81, 32 81, 16 70 Z"
          fill={isMonochrome ? monoFill : `url(#${gradFlightArcId})`}
        />

        {/* ======================================================== */}
        {/* 6. CORE AI ENGINE NAVIGATION BEACON                      */}
        {/* ======================================================== */}
        {!isMonochrome && (
          <circle cx="60" cy="72" r="3" fill="#35D6E8" opacity="0.95" />
        )}
      </g>
    </svg>
  );
};

export default AeroWMark;

