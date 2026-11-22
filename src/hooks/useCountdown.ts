"use client";

import { useSecondClock } from "./useSecondClock";

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };

export type Countdown = {
  parts: CountdownParts;
  overdue: boolean;
  /** Share of the window elapsed, 0..1. */
  progress: number;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const countdownAt = (now: number, targetAt: number, windowStart: number): Countdown => {
  const remaining = Math.max(0, targetAt - now);
  const span = Math.max(1, targetAt - windowStart);
  return {
    overdue: remaining === 0,
    progress: Math.min(1, Math.max(0, (now - windowStart) / span)),
    parts: {
      days: Math.floor(remaining / DAY),
      hours: Math.floor((remaining % DAY) / HOUR),
      minutes: Math.floor((remaining % HOUR) / MINUTE),
      seconds: Math.floor((remaining % MINUTE) / SECOND),
    },
  };
};

/**
 * Live countdown to `targetAt`. Returns null during SSR and hydration (render
 * placeholders), then real values from the first client render onward, so
 * server and client markup never disagree.
 */
export const useCountdown = (targetAt: Date, windowStart: Date): Countdown | null => {
  const now = useSecondClock();
  return now === null ? null : countdownAt(now, targetAt.getTime(), windowStart.getTime());
};
