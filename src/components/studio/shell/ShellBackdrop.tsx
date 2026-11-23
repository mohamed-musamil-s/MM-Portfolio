"use client";

import { motion, type TargetAndTransition } from "motion/react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

/*
 * Light canvas behind the studio shell: a cool lavender base with three soft
 * light fields (periwinkle, sky, lavender) drifting slowly and a faint dot
 * grid that fades toward the edges. Light only; still under reduced motion.
 */

type Field = { className: string; drift: TargetAndTransition; seconds: number };

const FIELDS: Field[] = [
  {
    className: "-top-[20%] -left-[10%] size-[55vmax] bg-aurora-periwinkle opacity-45",
    drift: { x: ["0%", "8%", "-3%", "0%"], y: ["0%", "6%", "10%", "0%"] },
    seconds: 26,
  },
  {
    className: "-top-[25%] -right-[15%] size-[50vmax] bg-aurora-sky opacity-35",
    drift: { x: ["0%", "-10%", "4%", "0%"], y: ["0%", "8%", "-4%", "0%"] },
    seconds: 30,
  },
  {
    className: "-bottom-[30%] left-[20%] size-[60vmax] bg-aurora-lavender opacity-50",
    drift: { x: ["0%", "6%", "-8%", "0%"], y: ["0%", "-8%", "-3%", "0%"] },
    seconds: 34,
  },
];

export const ShellBackdrop = () => {
  const { reducedMotion } = useMotionTheme();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {FIELDS.map(({ className, drift, seconds }) => (
        <motion.div
          key={className}
          className={cn("absolute rounded-full blur-3xl", className)}
          animate={reducedMotion ? undefined : drift}
          transition={{ duration: seconds, ease: "easeInOut", repeat: Infinity }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(var(--studio-aurora-periwinkle)_1px,transparent_1px)] mask-radial-from-10% mask-radial-to-70% bg-size-[24px_24px] opacity-40" />
    </div>
  );
};
