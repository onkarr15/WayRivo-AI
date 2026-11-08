import React from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { type SceneProps } from './intro.types';

export const SceneOneDestination: React.FC<SceneProps> = ({ isActive, shouldReduceMotion }) => {
  if (!isActive) return null;

  return (
    <motion.div
      key="scene-1-destination"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.5 } }}
      transition={{ duration: 0.7 }}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      {/* Cinematic Full-Bleed Destination Photography with Ken Burns Zoom */}
      <motion.div
        initial={{ scale: shouldReduceMotion ? 1.05 : 1.15 }}
        animate={{ scale: 1.03 }}
        transition={{ duration: 3.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85&auto=format&fit=crop"
          alt="Cinematic World Travel Destination"
          className="w-full h-full object-cover object-center filter brightness-[0.42] contrast-115"
          loading="eager"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Dark Vignette & Atmospheric Deep Radial Lighting */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-[#030712]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#030712_90%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      </motion.div>

      {/* Typography Reveal */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 space-y-3 sm:space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Curated Global Destinations</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 22, letterSpacing: '0.15em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.22em' }}
          transition={{ duration: 0.85, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl md:text-7xl font-black text-white font-heading uppercase drop-shadow-[0_10px_35px_rgba(0,0,0,0.85)]"
        >
          THE WORLD IS WAITING
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="text-sm sm:text-base md:text-xl text-slate-300 tracking-[0.14em] font-medium max-w-xl mx-auto"
        >
          Your next extraordinary journey begins here.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default SceneOneDestination;
