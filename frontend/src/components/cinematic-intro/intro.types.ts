/**
 * WayRivo AI 2.0 — Cinematic Intro Animation Types & Timeline Configuration
 */

export type CinematicSceneId = 1 | 2 | 3;

export interface CinematicIntroProps {
  onComplete: () => void;
  autoPlay?: boolean;
}

export interface SceneProps {
  isActive: boolean;
  shouldReduceMotion?: boolean;
}

export interface SceneTimingConfig {
  scene1DurationMs: number; // Scene 1: Destination Reveal (0 - 3000ms)
  scene2DurationMs: number; // Scene 2: Journey Animation (3000 - 6000ms)
  scene3DurationMs: number; // Scene 3: Brand Reveal & Welcome (6000 - 9000ms)
  totalDurationMs: number;  // Exactly 9000ms (9.0 seconds)
}

export const CINEMATIC_TIMING: SceneTimingConfig = {
  scene1DurationMs: 3000,
  scene2DurationMs: 3000,
  scene3DurationMs: 3000,
  totalDurationMs: 9000,
};
