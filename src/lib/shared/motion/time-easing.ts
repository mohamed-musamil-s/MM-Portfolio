/**
 * Easing as plain functions of time, for timelines that compute every style
 * from `t` (no tweens, no state between frames). All curves map 0 → 0 and
 * 1 → 1 and clamp outside that range.
 */

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;

/** Linear 0..1 progress through the window [start, start + duration]. */
export const progress = (t: number, start: number, duration: number): number => clamp01((t - start) / duration);

const DAMPING = 0.75;
const STIFFNESS = 10;
const DAMPED = STIFFNESS * Math.sqrt(1 - DAMPING * DAMPING);

/** Damped spring settling inside the window: about 3% overshoot, never bouncy. */
export const spring = (p: number): number => {
  if (p <= 0) {
    return 0;
  }
  if (p >= 1) {
    return 1;
  }
  const decay = Math.exp(-DAMPING * STIFFNESS * p);
  return 1 - decay * (Math.cos(DAMPED * p) + ((DAMPING * STIFFNESS) / DAMPED) * Math.sin(DAMPED * p));
};

export const expoOut = (p: number): number => (p >= 1 ? 1 : p <= 0 ? 0 : 1 - 2 ** (-10 * p));

export const expoInOut = (p: number): number => {
  if (p <= 0) {
    return 0;
  }
  if (p >= 1) {
    return 1;
  }
  return p < 0.5 ? 2 ** (20 * p - 10) / 2 : (2 - 2 ** (-20 * p + 10)) / 2;
};
