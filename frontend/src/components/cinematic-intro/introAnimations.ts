import { type Variants } from 'framer-motion';

/**
 * WayRivo AI 2.0 — Motion and Animation Physics for Cinematic Intro
 * Professional easing curves, GPU-accelerated transforms, and smooth camera physics.
 */

export const cinematicTransitions = {
  cameraZoom: {
    duration: 2.2,
    ease: [0.25, 0.1, 0.25, 1],
  },
  smoothFade: {
    duration: 0.6,
    ease: [0.16, 1, 0.3, 1],
  },
  textReveal: {
    duration: 0.7,
    ease: [0.16, 1, 0.3, 1],
  },
  pathDraw: {
    duration: 1.6,
    ease: [0.37, 0, 0.63, 1],
  },
  airplaneFlight: {
    duration: 1.7,
    ease: [0.25, 0.1, 0.25, 1],
  },
  landingApproach: {
    duration: 1.4,
    ease: [0.25, 0.1, 0.25, 1],
  },
};

export const sceneCrossDissolve: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    filter: 'blur(8px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const headlineTextReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    letterSpacing: '0.14em',
  },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    letterSpacing: '0.2em',
    transition: {
      duration: 0.75,
      delay: custom,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export const subtitleTextReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: (custom = 0) => ({
    opacity: 0.9,
    y: 0,
    transition: {
      duration: 0.6,
      delay: custom,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

