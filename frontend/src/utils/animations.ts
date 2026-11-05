import React from 'react';
import { motion, type Variants } from 'framer-motion';

/**
 * WayRivo AI 2.0 — Motion and Interaction System
 * Premium, fluid, cinematic easings and GPU-accelerated transforms.
 * Fully respects prefers-reduced-motion.
 */

export const transitions = {
  spring: { type: 'spring', damping: 25, stiffness: 300 },
  smooth: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  gentle: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  cinematic: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  quick: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
};

export const isReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const viewportTrigger = {
  once: true,
  margin: '0px',
  amount: 0.02,
};

// 1. GLOBAL SCROLL REVEALS (Always safe, high-contrast & guaranteed visible)
export const fadeUp: Variants = {
  hidden: isReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: custom * 0.05,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export const fadeDown: Variants = {
  hidden: isReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: custom * 0.05,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export const fadeLeft: Variants = {
  hidden: isReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 },
  visible: (custom = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: custom * 0.05,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export const fadeRight: Variants = {
  hidden: isReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 },
  visible: (custom = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: custom * 0.05,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export const scaleReveal: Variants = {
  hidden: isReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 },
  visible: (custom = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      delay: custom * 0.05,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
  exit: {
    opacity: 1,
    scale: 1,
  },
};

export const staggerContainer: Variants = {
  hidden: isReducedMotion ? { opacity: 1 } : { opacity: 0 },
  visible: (customDelay = 0.02) => ({
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: customDelay,
    },
  }),
};

export const staggerItem: Variants = {
  hidden: isReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

// Aliases for backwards compatibility
export const fadeInUp = fadeUp;
export const fadeInDown = fadeDown;
export const scaleIn = scaleReveal;
export const fadeIn: Variants = {
  hidden: isReducedMotion ? { opacity: 1 } : { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 1,
  },
};

// 2. HERO & FLOATING ANIMATIONS
export const floatingElement: Variants = {
  animate: (duration = 4) => ({
    y: [-4, 4, -4],
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
};

export const wordStaggerContainer: Variants = {
  hidden: isReducedMotion ? { opacity: 1 } : { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const wordStaggerItem: Variants = {
  hidden: isReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// 3. CARDS & HOVER
export const cardHover: Variants = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -6,
    scale: 1.01,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  tap: {
    scale: 0.99,
    transition: { duration: 0.1 },
  },
};

// 4. MODALS & DRAWERS
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const drawerRightVariants: Variants = {
  hidden: { x: '100%', opacity: 0.5 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 28, stiffness: 280 },
  },
  exit: {
    x: '100%',
    opacity: 0.5,
    transition: { duration: 0.25, ease: 'easeInOut' },
  },
};

export const drawerBottomVariants: Variants = {
  hidden: { y: '100%', opacity: 0.5 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 28, stiffness: 280 },
  },
  exit: {
    y: '100%',
    opacity: 0.5,
    transition: { duration: 0.25, ease: 'easeInOut' },
  },
};

// 5. AI ASSISTANT TYPING DOTS
export const typingDot: Variants = {
  initial: { y: 0, opacity: 0.4 },
  animate: {
    y: [-4, 2, -4],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// 6. PAGE TRANSITIONS (Guaranteed 100% visible on mount)
export const pageVariants: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 1,
  },
};

// 7. GLOW & ACCENTS
export const pulseGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 10px rgba(0, 240, 255, 0.2)',
      '0 0 25px rgba(0, 240, 255, 0.45)',
      '0 0 10px rgba(0, 240, 255, 0.2)',
    ],
    transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
  },
};

/**
 * Reusable ScrollReveal wrapper component
 */
export interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scaleReveal';
  delay?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = 'fadeUp',
  delay = 0,
  className = '',
}) => {
  const variantMap = {
    fadeUp,
    fadeDown,
    fadeLeft,
    fadeRight,
    scaleReveal,
  };

  const selectedVariant = variantMap[variant] || fadeUp;

  return React.createElement(
    motion.div,
    {
      variants: selectedVariant,
      initial: 'hidden',
      whileInView: 'visible',
      viewport: viewportTrigger,
      custom: delay,
      className,
    },
    children
  );
};
