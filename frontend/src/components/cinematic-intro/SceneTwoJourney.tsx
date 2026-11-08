import React from 'react';
import { motion } from 'framer-motion';
import { Globe2, Plane } from 'lucide-react';
import { type SceneProps } from './intro.types';

export const SceneTwoJourney: React.FC<SceneProps> = ({ isActive, shouldReduceMotion }) => {
  if (!isActive) return null;

  return (
    <motion.div
      key="scene-2-journey"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.5 } }}
      transition={{ duration: 0.7 }}
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* World Map Grid & Ambient Lighting */}
      <div className="absolute inset-0 z-0 bg-[#030712]">
        <div className="absolute inset-0 bg-[radial-gradient(#00F0FF_1.2px,transparent_1.2px)] [background-size:36px_36px] opacity-15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
      </div>

      {/* Flight Trajectory Canvas */}
      <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center justify-center">
        <svg
          viewBox="0 0 900 360"
          className="w-full h-44 sm:h-60 md:h-72 overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="modularFlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.95" />
            </linearGradient>
            <radialGradient id="modularNodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Coordinate parallels */}
          <g opacity="0.14" stroke="#00F0FF" strokeWidth="0.8" strokeDasharray="4 6">
            <line x1="50" y1="80" x2="850" y2="80" />
            <line x1="50" y1="180" x2="850" y2="180" />
            <line x1="50" y1="280" x2="850" y2="280" />
            <circle cx="450" cy="180" r="140" />
            <circle cx="450" cy="180" r="240" />
          </g>

          {/* Curved Flight Path Arc Drawn Progressively */}
          <motion.path
            d="M 120 250 Q 450 60 780 210"
            stroke="url(#modularFlightGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="8 8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0.4 : 2.5, ease: 'easeInOut' }}
          />

          {/* Destination Node 1: Origin */}
          <g transform="translate(120, 250)">
            <circle r="18" fill="url(#modularNodeGlow)" opacity="0.5" />
            <circle r="6" fill="#00F0FF" />
            <text
              y="26"
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="10"
              fontFamily="monospace"
              letterSpacing="0.15em"
            >
              ORIGIN (LON)
            </text>
          </g>

          {/* Destination Node 2: Waypoint */}
          <g transform="translate(450, 105)">
            <circle r="22" fill="#2DD4BF" opacity="0.25" className="animate-ping" />
            <circle r="7" fill="#2DD4BF" />
            <text
              y="-16"
              textAnchor="middle"
              fill="#2DD4BF"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.15em"
            >
              WAYPOINT (DXB)
            </text>
          </g>

          {/* Destination Node 3: Arrival Hub */}
          <g transform="translate(780, 210)">
            <circle r="20" fill="#D4AF37" opacity="0.35" />
            <circle r="6" fill="#D4AF37" />
            <text
              y="26"
              textAnchor="middle"
              fill="#F3E5AB"
              fontSize="10"
              fontFamily="monospace"
              letterSpacing="0.15em"
            >
              EXPEDITION (TYO)
            </text>
          </g>

          {/* Animated Airplane Following the Flight Route */}
          {!shouldReduceMotion && (
            <motion.g
              initial={{ x: 120, y: 250, rotate: -28, opacity: 0 }}
              animate={{
                x: [120, 260, 450, 630, 780],
                y: [250, 155, 105, 140, 210],
                rotate: [-28, -20, 5, 20, 28],
                opacity: [0, 1, 1, 1, 1],
              }}
              transition={{
                duration: 2.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <circle r="16" fill="#00F0FF" opacity="0.3" className="animate-pulse" />
              <g transform="translate(-11, -11)">
                <Plane className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_12px_#00F0FF]" />
              </g>
            </motion.g>
          )}
        </svg>

        {/* Scene 2 Typography */}
        <div className="text-center mt-3 space-y-2">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-mono tracking-widest uppercase"
          >
            <Globe2 className="w-3 h-3 text-teal-400" />
            <span>Global Route Synthesis</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.35 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-heading tracking-[0.18em] uppercase"
          >
            DISCOVER. EXPLORE. EXPERIENCE.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="text-xs sm:text-sm md:text-base text-slate-300 tracking-wider font-medium max-w-lg mx-auto"
          >
            From hidden destinations to unforgettable adventures.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default SceneTwoJourney;
