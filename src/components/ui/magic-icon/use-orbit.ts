"use client";

import { animate, useMotionValue, type MotionValue } from "motion/react";
import { useEffect } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";

const ORBIT_SECONDS = 1.1;
const QUARTER_TURN = 90;
/** Strong ease-out: fast spin decelerates and settles without overshoot. */
const LOCK_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Continuous rotation while `spinning`. When it stops, the mark decelerates
 * into the next quarter turn (`lock`) or simply eases to rest.
 */
export const useOrbit = (spinning: boolean, lock: boolean): MotionValue<number> => {
  const { tokens, reducedMotion } = useMotionTheme();
  const rotate = useMotionValue(0);

  useEffect(() => {
    if (reducedMotion) {
      rotate.set(0);
      return;
    }
    const current = rotate.get();
    const controls = spinning
      ? animate(rotate, current + 360, { duration: ORBIT_SECONDS, ease: "linear", repeat: Infinity })
      : animate(rotate, lock ? Math.ceil((current + QUARTER_TURN / 2) / QUARTER_TURN) * QUARTER_TURN : current, {
          duration: tokens.duration.slow,
          ease: LOCK_EASE,
        });
    return () => controls.stop();
  }, [spinning, lock, reducedMotion, rotate, tokens]);

  return rotate;
};
