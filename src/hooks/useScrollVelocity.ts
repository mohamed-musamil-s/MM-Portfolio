"use client";

import { useScroll, useSpring, useVelocity, type MotionValue } from "motion/react";

/** Smoothed window scroll velocity (px/s, signed). Works with Lenis, which scrolls the window. */
export const useScrollVelocity = (): MotionValue<number> => {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  return useSpring(velocity, { damping: 50, stiffness: 400 });
};
