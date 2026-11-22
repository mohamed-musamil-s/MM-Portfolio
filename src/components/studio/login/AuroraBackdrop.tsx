"use client";

import { motion, type TargetAndTransition } from "motion/react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

/*
 * Aurora for the login brand panel: three blurred light fields (blue, cyan,
 * indigo) drifting slowly behind a faint grid. Purely decorative; still under
 * reduced motion.
 */

type Blob = { className: string; drift: TargetAndTransition; seconds: number };

const BLOBS: Blob[] = [
  {
    className: "-top-1/4 -left-1/4 size-[70%] bg-aurora-blue",
    drift: { x: ["0%", "18%", "-6%", "0%"], y: ["0%", "12%", "22%", "0%"], scale: [1, 1.15, 0.95, 1] },
    seconds: 22,
  },
  {
    className: "top-1/4 -right-1/4 size-[60%] bg-aurora-cyan opacity-70",
    drift: { x: ["0%", "-20%", "-8%", "0%"], y: ["0%", "-10%", "14%", "0%"], scale: [1, 0.9, 1.1, 1] },
    seconds: 26,
  },
  {
    className: "-bottom-1/3 left-1/5 size-[65%] bg-aurora-indigo opacity-80",
    drift: { x: ["0%", "12%", "-14%", "0%"], y: ["0%", "-16%", "-4%", "0%"], scale: [1, 1.1, 1.05, 1] },
    seconds: 30,
  },
];

export const AuroraBackdrop = ({ className }: { className?: string }) => {
  const { reducedMotion } = useMotionTheme();
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {BLOBS.map(({ className: blob, drift, seconds }) => (
        <motion.div
          key={blob}
          className={cn("absolute rounded-full mix-blend-screen blur-3xl", blob)}
          animate={reducedMotion ? undefined : drift}
          transition={{ duration: seconds, ease: "easeInOut", repeat: Infinity }}
        />
      ))}
      {/* Grid, fading out toward the edges */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--studio-hero-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--studio-hero-foreground)_1px,transparent_1px)] mask-radial-from-20% mask-radial-to-75% bg-size-[48px_48px] opacity-[0.06]" />
      {/* Darken the bottom so text stays readable over the light */}
      <div className="absolute inset-0 bg-linear-to-b from-hero/10 via-hero/30 to-hero/85" />
    </div>
  );
};
