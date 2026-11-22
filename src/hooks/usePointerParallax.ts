"use client";

import { useSpring, type MotionValue } from "motion/react";
import { useEffect } from "react";
import { useMotionTheme } from "./useMotionTheme";

/**
 * Pointer depth: returns springs that move up to `depth` px away from the
 * viewport centre as the cursor moves. Negative depth moves against the
 * cursor (a layer "behind"). Fine pointers only; off under reduced motion.
 */
export const usePointerParallax = (depth: number): { x: MotionValue<number>; y: MotionValue<number> } => {
  const { tokens, reducedMotion } = useMotionTheme();
  const x = useSpring(0, tokens.spring);
  const y = useSpring(0, tokens.spring);

  useEffect(() => {
    if (reducedMotion || depth === 0 || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }
    const handleMove = (event: PointerEvent) => {
      x.set((event.clientX / window.innerWidth - 0.5) * 2 * depth);
      y.set((event.clientY / window.innerHeight - 0.5) * 2 * depth);
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      x.set(0);
      y.set(0);
    };
  }, [depth, reducedMotion, x, y]);

  return { x, y };
};
