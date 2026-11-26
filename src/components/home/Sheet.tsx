"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";

/*
 * Section hand-offs (docs/screens/HOME_BUSINESS.md §6): every section after
 * the hero is a sheet with rounded top corners that slides up over the one
 * before it. While a sheet is being covered, its visible end settles back
 * (shrinks from the bottom) and darkens, so one section's exit and the next
 * one's entrance read as a single motion. Still with reduced motion.
 */

/** How far each sheet overlaps the previous one (px), so the rounded corners sit on it. */
const OVERLAP = "-mt-12";
/** Above the hero's marquee band (z-10), below the navbar (z-40). */
const BASE_LAYER = 10;
const SETTLE_SCALE = 0.92;
const SETTLE_SHADE = 0.55;

export const Sheet = ({ children, depth }: { children: ReactNode; depth: number }) => {
  const frame = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMotionTheme();
  // 0 when this sheet's end reaches the bottom of the screen (the next sheet starts to cover it), 1 when it leaves the top.
  const { scrollYProgress } = useScroll({ target: frame, offset: ["end end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], reducedMotion ? [1, 1] : [1, SETTLE_SCALE]);
  const shade = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [0, SETTLE_SHADE]);

  return (
    <div
      ref={frame}
      style={{ zIndex: BASE_LAYER + depth }}
      className={`relative ${OVERLAP} overflow-clip rounded-t-[2.75rem] bg-ink shadow-[0_-30px_70px_-30px_rgb(0_0_0/0.35)]`}
    >
      <motion.div style={{ scale, originY: 1 }} className="isolate">
        {children}
      </motion.div>
      <motion.div aria-hidden style={{ opacity: shade }} className="pointer-events-none absolute inset-0 bg-ink" />
    </div>
  );
};
