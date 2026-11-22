"use client";

import { useMotionValue, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type RedirectCountdown = {
  /** Whole seconds left (ceil), for display. */
  secondsLeft: number;
  /** 0 → 1 through the countdown, updated every frame (drive rings and bars with it). */
  progress: MotionValue<number>;
  paused: boolean;
  togglePaused: () => void;
};

/**
 * Counts `seconds` down on animation frames and calls `onDone` once at zero.
 * Stops while paused and while the tab is hidden, and resumes from where it
 * stopped.
 */
export const useRedirectCountdown = (seconds: number, onDone: () => void): RedirectCountdown => {
  const progress = useMotionValue(0);
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (paused) {
      return;
    }
    const totalMs = seconds * 1000;
    let frame = 0;
    let last = performance.now();
    let elapsed = progress.get() * totalMs;

    const tick = (now: number) => {
      // A hidden tab skips frames; never count that time.
      if (!document.hidden) {
        elapsed += Math.min(now - last, 100);
      }
      last = now;
      const ratio = Math.min(1, elapsed / totalMs);
      progress.set(ratio);
      setSecondsLeft(Math.max(0, Math.ceil(seconds - elapsed / 1000)));
      if (ratio >= 1) {
        onDoneRef.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, seconds, progress]);

  return { secondsLeft, progress, paused, togglePaused: () => setPaused((value) => !value) };
};
