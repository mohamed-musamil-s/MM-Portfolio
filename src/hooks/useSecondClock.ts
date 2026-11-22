"use client";

import { useSyncExternalStore } from "react";

const SECOND = 1000;

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

/** Current time (ms, floored to the second), or null during SSR and hydration so markup never mismatches. */
export const useSecondClock = (): number | null =>
  useSyncExternalStore(subscribeToSeconds, currentSecond, noClockOnServer);
