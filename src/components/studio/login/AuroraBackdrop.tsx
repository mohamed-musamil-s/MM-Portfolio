"use client";

import { motion, type TargetAndTransition } from "motion/react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

/*
 * Light gradient shade for the login brand panel: a mist base with soft
 * periwinkle, lavender and ice fields drifting slowly, plus two faint
 * diagonal light streaks. Purely decorative; still under reduced motion.
 */

type Field = { className: string; drift: TargetAndTransition; seconds: number };

const FIELDS: Field[] = [
  {
    className: "-top-1/4 -left-1/4 size-[80%] bg-aurora-periwinkle",
    drift: { x: ["0%", "10%", "-4%", "0%"], y: ["0%", "8%", "14%", "0%"], scale: [1, 1.08, 0.96, 1] },
    seconds: 24,
  },
  {
    className: "-top-1/5 left-1/3 size-[60%] bg-aurora-lavender opacity-90",
    drift: { x: ["0%", "-12%", "6%", "0%"], y: ["0%", "10%", "-6%", "0%"], scale: [1, 0.94, 1.06, 1] },
    seconds: 28,
  },
  {
    className: "-bottom-1/4 -left-1/5 size-[65%] bg-aurora-sky opacity-45",
    drift: { x: ["0%", "14%", "4%", "0%"], y: ["0%", "-10%", "-16%", "0%"], scale: [1, 1.1, 1, 1] },
    seconds: 30,
  },
];

export const AuroraBackdrop = ({ className }: { className?: string }) => {
  const { reducedMotion } = useMotionTheme();
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-aurora-mist", className)}
    >
      {FIELDS.map(({ className: field, drift, seconds }) => (
        <motion.div
          key={field}
          className={cn("absolute rounded-full blur-3xl", field)}
          animate={reducedMotion ? undefined : drift}
          transition={{ duration: seconds, ease: "easeInOut", repeat: Infinity }}
        />
      ))}
      {/* Wash toward white at the bottom right, like light falling across the panel */}
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-card/20 to-card/75" />
      {/* Faint diagonal light streaks */}
      <div className="absolute top-[22%] -left-1/4 h-px w-[150%] rotate-[14deg] bg-linear-to-r from-transparent via-card to-transparent opacity-70" />
      <div className="absolute top-[78%] -left-1/4 h-px w-[150%] rotate-[24deg] bg-linear-to-r from-transparent via-card to-transparent opacity-60" />
    </div>
  );
};
