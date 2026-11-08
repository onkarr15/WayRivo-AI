import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { type CinematicIntroProps, type CinematicSceneId, CINEMATIC_TIMING } from './intro.types';
import { IntroSkipButton } from './IntroSkipButton';
import { SceneOneDestination } from './SceneOneDestination';
import { SceneTwoJourney } from './SceneTwoJourney';
import { SceneThreeBrandReveal } from './SceneThreeBrandReveal';

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const shouldReduceMotion = useReducedMotion();
  const [currentScene, setCurrentScene] = useState<CinematicSceneId>(1);
  const [isExiting, setIsExiting] = useState(false);
  const hasFinishedRef = useRef(false);

  const finishIntro = useCallback(
    (immediate = false) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      setIsExiting(true);
      const exitDelay = immediate ? 250 : 800;
      setTimeout(() => {
        onComplete();
      }, exitDelay);
    },
    [onComplete]
  );

  // Exact 3-Scene Cinematic Sequence Timeline (Total: Exactly 9.0 seconds)
  // Scene 1: 0ms -> 3000ms (3.0s) — Cinematic Destination
  // Scene 2: 3000ms -> 6000ms (3.0s) — Global Journey Animation
  // Scene 3: 6000ms -> 9000ms (3.0s) — WayRivo AI Brand Reveal & Smooth Homepage Transition
  useEffect(() => {
    if (shouldReduceMotion) {
      const reducedTimer = setTimeout(() => {
        finishIntro(true);
      }, 2000);
      return () => clearTimeout(reducedTimer);
    }

    const tScene2 = setTimeout(() => {
      setCurrentScene(2);
    }, CINEMATIC_TIMING.scene1DurationMs);

    const tScene3 = setTimeout(() => {
      setCurrentScene(3);
    }, CINEMATIC_TIMING.scene1DurationMs + CINEMATIC_TIMING.scene2DurationMs);

    // Smooth exit crossfade trigger at 8200ms (completes at 9000ms)
    const tExit = setTimeout(() => {
      finishIntro(false);
    }, CINEMATIC_TIMING.totalDurationMs - 800);

    // Watchdog fallback (guarantees completion under all conditions at 9.5s)
    const tWatchdog = setTimeout(() => {
      finishIntro(true);
    }, CINEMATIC_TIMING.totalDurationMs + 500);

    return () => {
      clearTimeout(tScene2);
      clearTimeout(tScene3);
      clearTimeout(tExit);
      clearTimeout(tWatchdog);
    };
  }, [shouldReduceMotion, finishIntro]);

  // Keyboard navigation & accessibility (ESC, Space, or Enter skips immediately)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        finishIntro(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finishIntro]);

  // Lock body scrolling during intro playback
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden bg-[#030712] select-none text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
      role="dialog"
      aria-modal="true"
      aria-label="WayRivo AI Cinematic Introduction"
    >
      {/* ========================================================================= */}
      {/* TOP HEADER: Ambient System Status & Accessible Skip Button               */}
      {/* ========================================================================= */}
      <header className="relative z-30 flex items-center justify-between px-6 sm:px-10 py-5">
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 0.85, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex items-center gap-2.5 text-xs font-mono tracking-widest text-cyan-400 uppercase"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
          <span className="hidden sm:inline">Autonomous Travel Intelligence</span>
          <span className="sm:hidden">WayRivo AI</span>
        </motion.div>

        {/* Modular Skip Intro Button */}
        <IntroSkipButton onSkip={() => finishIntro(true)} />
      </header>

      {/* ========================================================================= */}
      {/* SCENE CONTAINER (SCENES 1, 2, 3)                                          */}
      {/* ========================================================================= */}
      <main className="relative flex-1 flex items-center justify-center w-full px-4 sm:px-8">
        <AnimatePresence mode="wait">
          {currentScene === 1 && !shouldReduceMotion && (
            <SceneOneDestination
              key="scene-1"
              isActive={currentScene === 1}
              shouldReduceMotion={shouldReduceMotion ?? false}
            />
          )}

          {currentScene === 2 && !shouldReduceMotion && (
            <SceneTwoJourney
              key="scene-2"
              isActive={currentScene === 2}
              shouldReduceMotion={shouldReduceMotion ?? false}
            />
          )}

          {(currentScene === 3 || shouldReduceMotion) && (
            <SceneThreeBrandReveal
              key="scene-3"
              isActive={currentScene === 3 || Boolean(shouldReduceMotion)}
              shouldReduceMotion={shouldReduceMotion ?? false}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Invisible bottom spacer to maintain perfect optical vertical centering */}
      <div className="h-14 sm:h-16 pointer-events-none" aria-hidden="true" />
    </motion.div>
  );
};

export default CinematicIntro;
