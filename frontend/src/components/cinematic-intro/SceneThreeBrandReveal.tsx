import React from 'react';
import { motion } from 'framer-motion';
import { type SceneProps } from './intro.types';
import { AeroWMark } from '../branding/AeroWMark';

export const SceneThreeBrandReveal: React.FC<SceneProps> = ({ isActive, shouldReduceMotion }) => {
  if (!isActive) return null;

  return (
    <motion.div
      key="scene-3-brand-reveal"
      initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)', transition: { duration: 0.5 } }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-3xl mx-auto"
    >
      {/* 1. Atmospheric Radial Halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-cyan-500/25 via-teal-500/20 to-amber-500/15 rounded-full blur-[140px] pointer-events-none" />

      {/* 2. Official Aero W Brand Symbol with Multi-Layer Glow & Light Sweep */}
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: [0.75, 1.04, 1], opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-6 group"
      >
        {/* Pulsing Aura */}
        <div className="absolute -inset-6 rounded-full bg-cyan-400/20 blur-2xl animate-pulse" />

        {/* Outer Glow Ring */}
        <div className="relative p-3 sm:p-4 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#071B33]/90 to-slate-900/95 border border-cyan-400/40 shadow-[0_0_60px_rgba(53,214,232,0.35)] overflow-hidden">
          {/* Subtle Light Sweep Across Symbol */}
          <motion.div
            initial={{ x: '-150%', opacity: 0 }}
            animate={{ x: '250%', opacity: [0, 0.65, 0] }}
            transition={{ duration: 1.3, delay: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent skew-x-[-25deg] pointer-events-none"
          />

          <AeroWMark
            size={88}
            theme="primary"
            glow={true}
            className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_0_25px_rgba(53,214,232,0.6)]"
          />
        </div>
      </motion.div>

      {/* 3. Brand Wordmark Typography: WAYRIVO AI 2.0 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="flex items-center justify-center gap-2.5 sm:gap-3.5 mb-2.5"
      >
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-wider text-white font-heading">
          WAY<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300">RIVO</span>
          <span className="text-cyan-400 ml-2 font-black">AI</span>
        </h1>
        <span className="px-2.5 py-1 rounded-xl text-xs sm:text-sm font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/20">
          2.0
        </span>
      </motion.div>

      {/* 4. Tagline: TRAVEL SMARTER. EXPLORE FURTHER. */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="text-sm sm:text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 tracking-[0.25em] uppercase mt-1 mb-3"
      >
        TRAVEL SMARTER. EXPLORE FURTHER.
      </motion.p>

      {/* 5. Supporting Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ duration: 0.6, delay: 0.75 }}
        className="text-xs sm:text-sm md:text-base text-slate-300 tracking-wider font-medium max-w-md mx-auto"
      >
        Your intelligent companion for seamless travel planning and booking.
      </motion.p>
    </motion.div>
  );
};

export default SceneThreeBrandReveal;
