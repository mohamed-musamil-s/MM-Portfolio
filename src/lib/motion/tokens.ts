/**
 * Motion tokens for the two design surfaces. Every animated component reads
 * these through `useMotionTheme()`; nothing hardcodes its own timing.
 *
 * portfolio: editorial, kinetic, tactile (docs/STYLE.md)
 * studio:    snappy, deterministic, state-driven (docs/ADMIN_STYLE.md)
 */

export type MotionTheme = "portfolio" | "studio";

export type CubicBezier = readonly [number, number, number, number];

export type SpringConfig = {
  stiffness: number;
  damping: number;
  mass: number;
};

export type ThemeMotion = {
  /** Seconds (motion uses seconds; multiply by 1000 for anime.js). */
  duration: { fast: number; base: number; slow: number };
  ease: CubicBezier;
  /** Default spring for transforms. Damped enough that nothing bounces. */
  spring: SpringConfig;
  /** Scale applied while a control is pressed. */
  pressScale: number;
  /** Magnetic cursor pull. `null` turns it off for the theme. */
  magnetic: { radius: number; strength: number } | null;
  /** How long success / error states stay visible before resetting to idle. */
  statusHoldMs: { success: number; error: number };
  /** Stagger between strokes when an icon draws itself on mount. */
  drawStaggerMs: number;
};

/** The "print" curve shared with docs/STYLE.md (`ease-print`). */
export const EASE_PRINT: CubicBezier = [0.2, 0, 0, 1];

export const MOTION_THEMES: Record<MotionTheme, ThemeMotion> = {
  portfolio: {
    duration: { fast: 0.24, base: 0.48, slow: 0.9 },
    ease: EASE_PRINT,
    spring: { stiffness: 220, damping: 24, mass: 0.9 },
    pressScale: 0.98,
    magnetic: { radius: 72, strength: 0.28 },
    statusHoldMs: { success: 1600, error: 2000 },
    drawStaggerMs: 70,
  },
  studio: {
    duration: { fast: 0.12, base: 0.18, slow: 0.28 },
    ease: EASE_PRINT,
    spring: { stiffness: 620, damping: 40, mass: 0.6 },
    pressScale: 0.97,
    magnetic: null,
    statusHoldMs: { success: 1200, error: 1800 },
    drawStaggerMs: 40,
  },
};

/** Horizontal shake used for errors (x offsets in px). */
export const SHAKE_KEYFRAMES = [0, -6, 6, -4, 4, -2, 0];
