import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface IntroSkipButtonProps {
  onSkip: () => void;
  className?: string;
}

export const IntroSkipButton: React.FC<IntroSkipButtonProps> = ({ onSkip, className = '' }) => {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      onClick={onSkip}
      className={`group relative flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400/60 backdrop-blur-xl text-xs font-bold text-slate-200 hover:text-white transition-all shadow-lg hover:shadow-cyan-500/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${className}`}
      aria-label="Skip introduction animation"
    >
      <span>Skip Intro</span>
      <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
      <span className="hidden md:inline text-[10px] text-slate-400 font-mono ml-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
        ESC
      </span>
    </motion.button>
  );
};

export default IntroSkipButton;

