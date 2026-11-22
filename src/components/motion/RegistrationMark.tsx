"use client";

import { motion } from "motion/react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

type RegistrationMarkProps = {
  /** `bullseye` adds the solid centre dot used for the "registered" corners (max two per screen). */
  variant?: "open" | "bullseye";
  /** Slow ambient scale/opacity pulse. */
  breathe?: boolean;
  /** Entrance delay in seconds, to stagger marks around a frame. */
  delay?: number;
  className?: string;
};

const BREATH_SECONDS = 4;

/** Print registration crosshair (docs/STYLE.md §5.1). Decorative only. */
export const RegistrationMark = ({ variant = "open", breathe = true, delay = 0, className }: RegistrationMarkProps) => {
  const { tokens, reducedMotion } = useMotionTheme();

  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      className={cn("pointer-events-none size-4.5 text-rule sm:size-6 print:hidden", className)}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.4, rotate: -90 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", ...tokens.spring, delay }}
    >
      <motion.g
        style={{ originX: 0.5, originY: 0.5 }}
        animate={breathe && !reducedMotion ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] } : undefined}
        transition={{ duration: BREATH_SECONDS, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <circle cx={12} cy={12} r={6} />
        <path d="M12 3V21M3 12H21" />
        {variant === "bullseye" ? <circle cx={12} cy={12} r={2.4} fill="currentColor" stroke="none" /> : null}
      </motion.g>
    </motion.svg>
  );
};
