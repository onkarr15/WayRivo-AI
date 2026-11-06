import React from 'react';

export interface PayPalOfficialLogoProps {
  className?: string;
  height?: number | string;
  showWordmark?: boolean;
}

export const PayPalOfficialLogo: React.FC<PayPalOfficialLogoProps> = ({
  className = '',
  height = 28,
  showWordmark = true,
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 select-none align-middle ${className}`}
      aria-label="PayPal Official Logo"
    >
      {/* Official PayPal Monogram Double-P SVG */}
      <svg
        height={height}
        viewBox="0 0 100 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 overflow-visible"
        style={{ height }}
      >
        {/* Back P (Deep Navy #003087) */}
        <path
          d="M26.9 108.8L38.4 36.3H65.8C75.5 36.3 83.1 38.6 88.6 43.2C94.1 47.8 96.8 54.4 96.8 62.9C96.8 72.1 93.6 79.5 87.2 85.1C80.8 90.7 71.8 93.5 60.2 93.5H44.6L37.9 108.8H26.9Z"
          fill="#003087"
        />
        {/* Front P (Light Blue #0079C1) */}
        <path
          d="M11.5 86.8L23 14.3H50.4C60.1 14.3 67.7 16.6 73.2 21.2C78.7 25.8 81.4 32.4 81.4 40.9C81.4 50.1 78.2 57.5 71.8 63.1C65.4 68.7 56.4 71.5 44.8 71.5H29.2L22.5 86.8H11.5Z"
          fill="#0079C1"
        />
        {/* Overlap area (#00457C) */}
        <path
          d="M38.4 36.3L29.2 71.5H44.8C56.4 71.5 65.4 68.7 71.8 63.1C78.2 57.5 81.4 50.1 81.4 40.9C81.4 39.3 81.2 37.8 80.8 36.3H38.4Z"
          fill="#00457C"
          opacity="0.8"
        />
      </svg>

      {/* Official PayPal Wordmark */}
      {showWordmark && (
        <span
          className="font-black italic tracking-tight text-xl sm:text-2xl select-none leading-none"
          style={{ fontFamily: "'PayPal Sans', 'Helvetica Neue', Arial, sans-serif" }}
        >
          <span style={{ color: '#003087' }}>Pay</span>
          <span style={{ color: '#0079C1' }}>Pal</span>
        </span>
      )}
    </div>
  );
};

