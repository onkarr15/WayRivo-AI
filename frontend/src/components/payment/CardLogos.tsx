import React from 'react';
import { CreditCard } from 'lucide-react';

/**
 * Authentic SVG Vector Logos for Visa, Mastercard, and American Express (Amex).
 * High-definition, responsive vector badges optimized for dark & light payment UI.
 */

export const VisaLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <svg
    viewBox="0 0 36 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Visa"
  >
    <rect width="36" height="24" rx="3.5" fill="#1434CB" />
    <path
      d="M13.6 16.5H11.5L12.8 7.5H14.9L13.6 16.5ZM23.1 7.7C22.7 7.5 22.1 7.3 21.3 7.3C19.2 7.3 17.8 8.4 17.8 9.9C17.8 11 18.8 11.6 19.6 12C20.4 12.4 20.7 12.7 20.7 13C20.7 13.5 20.1 13.8 19.4 13.8C18.6 13.8 18.1 13.6 17.4 13.3L17.1 13.2L16.8 15.3C17.4 15.6 18.4 15.8 19.5 15.8C21.7 15.8 23.2 14.7 23.2 13.1C23.2 12.1 22.6 11.4 21.2 10.7C20.4 10.3 19.9 10.1 19.9 9.6C19.9 9.2 20.4 8.9 21.3 8.9C22.1 8.9 22.6 9 23 9.2L23.1 7.7ZM28.8 7.5H27.1C26.6 7.5 26.2 7.6 26 8.2L22.2 16.5H24.5L25 15.2H27.8L28.1 16.5H30.1L28.8 7.5ZM25.6 13.3C25.8 12.8 26.5 10.9 26.5 10.9C26.5 10.9 26.7 10.5 26.8 10.2L27 10.8C27 10.8 27.3 12.6 27.5 13.3H25.6ZM10.1 7.5L8 13.5L7.8 12.3C7.4 11 6.2 9.5 4.8 8.8L6.7 16.5H9L12.5 7.5H10.1Z"
      fill="white"
    />
    <path
      d="M6.5 7.5H3L2.9 7.7C5.6 8.4 8 10.1 8.8 12L7.9 8C7.8 7.7 7.5 7.5 7.2 7.5H6.5Z"
      fill="#F7B600"
    />
  </svg>
);

export const MastercardLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <svg
    viewBox="0 0 36 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Mastercard"
  >
    <rect width="36" height="24" rx="3.5" fill="#1E293B" stroke="#334155" strokeWidth="0.8" />
    <circle cx="13.5" cy="12" r="6.5" fill="#EB001B" />
    <circle cx="22.5" cy="12" r="6.5" fill="#F79E1B" fillOpacity="0.9" />
    <path
      d="M18 7.74A6.47 6.47 0 0 1 20.4 12 6.47 6.47 0 0 1 18 16.26 6.47 6.47 0 0 1 15.6 12 6.47 6.47 0 0 1 18 7.74Z"
      fill="#FF5F00"
    />
  </svg>
);

export const AmexLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <svg
    viewBox="0 0 36 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="American Express"
  >
    <rect width="36" height="24" rx="3.5" fill="#006FCF" stroke="#0284C7" strokeWidth="0.8" />
    <path
      d="M6 16.2L8.4 8H10.7L13.1 16.2H11.3L10.8 14.3H8.3L7.8 16.2H6ZM8.7 12.9H10.4L9.5 9.8L8.7 12.9Z"
      fill="white"
    />
    <path
      d="M13.6 16.2V8H15.9L17.8 13L19.7 8H22V16.2H20.3V11L18.4 15.9H17.2L15.3 11V16.2H13.6Z"
      fill="white"
    />
    <path
      d="M23 16.2V8H28.6V9.6H24.9V11.3H28.2V12.9H24.9V14.6H28.7V16.2H23Z"
      fill="white"
    />
    <path
      d="M29.2 16.2L31.6 12.1L29.3 8H31.4L32.6 10.3L33.8 8H35.9L33.6 12.1L36 16.2H33.9L32.6 13.8L31.3 16.2H29.2Z"
      fill="white"
    />
  </svg>
);

/**
 * Dynamic Card Brand Logo Resolver
 */
export const CardBrandLogo: React.FC<{ brand: string; className?: string }> = ({
  brand,
  className = 'h-5 w-auto',
}) => {
  const normalized = (brand || '').toLowerCase().trim();
  if (normalized.includes('visa')) {
    return <VisaLogo className={className} />;
  }
  if (normalized.includes('mastercard') || normalized.includes('master')) {
    return <MastercardLogo className={className} />;
  }
  if (normalized.includes('amex') || normalized.includes('american express')) {
    return <AmexLogo className={className} />;
  }
  return <CreditCard className="w-5 h-5 text-slate-400" />;
};

