"use client";

import { motion } from "motion/react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

/** The poster's partial headline underline (docs/STYLE.md §3.3), drawn in from the left. */
export const InkRule = ({ delay = 0, className }: { delay?: number; className?: string }) => {
  const { tokens, reducedMotion } = useMotionTheme();
  return (
    <motion.span
      aria-hidden
      className={cn("block h-0.5 w-[70%] origin-left bg-ink", className)}
      initial={reducedMotion ? false : { scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: tokens.duration.slow, ease: tokens.ease, delay }}
    />
  );
};
