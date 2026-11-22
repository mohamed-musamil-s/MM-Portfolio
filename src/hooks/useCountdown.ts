"use client";

import { useSyncExternalStore } from "react";

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

/**
 * A wall clock that notifies on every second boundary (so ticks never drift)
 * and goes quiet while the tab is hidden, resyncing when it becomes visible.
 */
const subscribeToSeconds = (notify: () => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    timer = setTimeout(() => {
      notify();
      schedule();
    }, SECOND - (Date.now() % SECOND));
  };
  const handleVisibility = () => {
    clearTimeout(timer);
    if (!document.hidden) {
      notify();
      schedule();
    }
  };
  schedule();
  document.addEventListener("visibilitychange", handleVisibility);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
};

const currentSecond = () => Math.floor(Date.now() / SECOND) * SECOND;
const noClockOnServer = () => null;

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
  const now = useSyncExternalStore(subscribeToSeconds, currentSecond, noClockOnServer);
  return now === null ? null : countdownAt(now, targetAt.getTime(), windowStart.getTime());
};
