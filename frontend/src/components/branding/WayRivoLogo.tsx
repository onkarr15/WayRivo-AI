import React from 'react';
import { Link } from 'react-router-dom';
import { AeroWMark } from './AeroWMark';
import { type WayRivoLogoProps, type BrandSize } from './branding.types';

export const WayRivoLogo: React.FC<WayRivoLogoProps> = ({
  variant = 'horizontal',
  theme = 'auto',
  size = 'md',
  showTagline = false,
  withVersion = true,
  taglineText = 'TRAVEL SMARTER. EXPLORE FURTHER.',
  href = '/',
  className = '',
  glow = false,
}) => {
  // Size mappings for symbol and text
  const sizeConfig: Record<
    string,
    {
      markSize: BrandSize;
      titleSize: string;
      taglineSize: string;
      versionSize: string;
      spacing: string;
    }
  > = {
    xs: {
      markSize: 'xs',
      titleSize: 'text-sm tracking-wide',
      taglineSize: 'text-[8px] tracking-[0.16em]',
      versionSize: 'text-[8px] px-1 py-0.2',
      spacing: 'gap-1.5',
    },
    sm: {
      markSize: 'sm',
      titleSize: 'text-base tracking-wide',
      taglineSize: 'text-[9px] tracking-[0.18em]',
      versionSize: 'text-[9px] px-1.5 py-0.5',
      spacing: 'gap-2',
    },
    md: {
      markSize: 'md',
      titleSize: 'text-lg sm:text-xl tracking-wider',
      taglineSize: 'text-[10px] tracking-[0.2em]',
      versionSize: 'text-[10px] px-1.5 py-0.5',
      spacing: 'gap-2.5',
    },
    lg: {
      markSize: 'lg',
      titleSize: 'text-2xl sm:text-3xl tracking-wider',
      taglineSize: 'text-xs tracking-[0.22em]',
      versionSize: 'text-xs px-2 py-0.5',
      spacing: 'gap-3.5',
    },
    xl: {
      markSize: 'xl',
      titleSize: 'text-3xl sm:text-4xl md:text-5xl tracking-widest',
      taglineSize: 'text-sm tracking-[0.25em]',
      versionSize: 'text-xs sm:text-sm px-2.5 py-1',
      spacing: 'gap-4',
    },
    '2xl': {
      markSize: '2xl',
      titleSize: 'text-4xl sm:text-6xl md:text-7xl tracking-widest',
      taglineSize: 'text-base sm:text-lg tracking-[0.28em]',
      versionSize: 'text-sm px-3 py-1',
      spacing: 'gap-5',
    },
  };

  const currentSizeKey = typeof size === 'string' && sizeConfig[size] ? size : 'md';
  const cfg = sizeConfig[currentSizeKey];

  // Theme-aware typography colors
  const isLight = theme === 'light';
  const wayrivoColor = isLight ? 'text-[#071B33]' : 'text-white';
  const rivoAccent = isLight
    ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600'
    : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300';
  const aiColor = isLight ? 'text-cyan-600' : 'text-[#35D6E8]';
  const taglineColor = isLight ? 'text-slate-600' : 'text-slate-400';

  const badgeStyle = isLight
    ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/20';

  // Mark theme resolution
  const markTheme =
    theme === 'light' ? 'light' : theme === 'monochrome' ? 'monochrome' : 'primary';

  // Inner logo content
  const content = (
    <div
      className={`group inline-flex items-center select-none ${
        variant === 'vertical' ? 'flex-col text-center' : 'flex-row'
      } ${cfg.spacing} ${className}`}
    >
      {/* 1. Aero W Symbol */}
      <div className="relative shrink-0 flex items-center justify-center">
        {glow && (
          <div className="absolute -inset-2 rounded-2xl bg-cyan-400/20 blur-md opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />
        )}
        <AeroWMark
          size={cfg.markSize}
          theme={markTheme}
          glow={glow}
          animated={true}
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* 2. Wordmark + Differentiation */}
      {variant !== 'icon' && (
        <div className={`flex flex-col ${variant === 'vertical' ? 'items-center' : 'items-start'}`}>
          <div className="flex items-center gap-1.5 leading-none">
            {/* WAYRIVO */}
            <span className={`font-black font-heading ${cfg.titleSize} ${wayrivoColor}`}>
              WAY<span className={rivoAccent}>RIVO</span>
            </span>

            {/* AI Differentiation */}
            <span className={`font-black font-heading ${cfg.titleSize} ${aiColor}`}>
              AI
            </span>

            {/* Version Badge (2.0) */}
            {withVersion && (
              <span
                className={`font-mono font-extrabold uppercase rounded-lg ml-0.5 ${cfg.versionSize} ${badgeStyle}`}
              >
                2.0
              </span>
            )}
          </div>

          {/* Tagline */}
          {showTagline && (
            <span
              className={`font-semibold uppercase mt-1 ${cfg.taglineSize} ${taglineColor}`}
            >
              {taglineText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="inline-flex items-center text-inherit no-underline">
        {content}
      </Link>
    );
  }

  return content;
};

export default WayRivoLogo;

