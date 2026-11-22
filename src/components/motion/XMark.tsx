"use client";

import { motion } from "motion/react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

/** Slightly irregular strokes, echoing the poster's hand-drawn X marks (docs/STYLE.md §5.3). */
const STROKES = ["M5 4.2L19.4 19.6", "M4.6 19.2L19 4.8"];

export const XMark = ({ delay = 0, className }: { delay?: number; className?: string }) => {
  const { tokens, reducedMotion } = useMotionTheme();
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={cn("pointer-events-none size-8 text-ink print:hidden", className)}
    >
      {STROKES.map((d, index) => (
        <motion.path
          key={d}
          d={d}
          initial={reducedMotion ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: tokens.duration.base, ease: tokens.ease, delay: delay + index * 0.15 }}
        />
      ))}
    </svg>
  );
};
