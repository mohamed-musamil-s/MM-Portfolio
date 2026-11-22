"use client";

import { motion } from "motion/react";
import { useMotionTheme } from "@/hooks/useMotionTheme";

type StepProgressProps = { labels: readonly string[]; current: number };

/** Slim segmented progress with the current step's name and "n/total". */
export const StepProgress = ({ labels, current }: StepProgressProps) => {
  const { tokens } = useMotionTheme();
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-primary">{labels[current]}</span>
        <span className="text-muted-foreground tabular-nums">
          {current + 1}/{labels.length}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={labels[current]}
        aria-valuemin={1}
        aria-valuemax={labels.length}
        aria-valuenow={current + 1}
        className="flex gap-1.5"
      >
        {labels.map((label, index) => (
          <span key={label} className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.span
              className="absolute inset-0 origin-left rounded-full bg-linear-to-r from-primary to-aurora-indigo"
              initial={false}
              animate={{ scaleX: index <= current ? 1 : 0 }}
              transition={{ duration: tokens.duration.slow * 1.6, ease: tokens.ease }}
            />
          </span>
        ))}
      </div>
    </div>
  );
};
