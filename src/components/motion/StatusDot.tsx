"use client";

import { motion } from "motion/react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

const PULSE_SECONDS = 1.8;

/** Live-status beacon: a signal-orange dot with an expanding pulse ring. Decorative. */
export const StatusDot = ({ className }: { className?: string }) => {
  const { reducedMotion } = useMotionTheme();
  return (
    <span aria-hidden className={cn("relative flex size-2.5", className)}>
      {reducedMotion ? null : (
        <motion.span
          className="absolute inset-0 rounded-full bg-signal"
          animate={{ scale: [1, 2.6], opacity: [0.55, 0] }}
          transition={{ duration: PULSE_SECONDS, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <span className="relative size-2.5 rounded-full bg-signal" />
    </span>
  );
};
