"use client";

import { motion, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";

const VELOCITY_RANGE = [-2500, 2500];

/** Large type leans against the scroll direction in proportion to scroll speed, clamped to ±`max` degrees. */
export const VelocitySkew = ({ children, max = 4, className }: { children: ReactNode; max?: number; className?: string }) => {
  const { reducedMotion } = useMotionTheme();
  const velocity = useScrollVelocity();
  const skewY = useTransform(velocity, VELOCITY_RANGE, [max, -max], { clamp: true });

  return (
    <motion.div className={className} style={reducedMotion ? undefined : { skewY }}>
      {children}
    </motion.div>
  );
};
