"use client";

import { motion } from "motion/react";
import { useMotionTheme } from "@/hooks/useMotionTheme";

type ErrorCodeProps = { label: string; code: string };

const EASE = [0.2, 0, 0, 1] as const;

/**
 * The large "Error 404" graphic: a technical label over oversized digits that
 * rise out of a mask one by one, then a signal-orange full stop drops in and
 * settles (the same period as the monogram). Exposed to assistive tech as
 * one image with the text "<label> <code>".
 */
export const ErrorCode = ({ label, code }: ErrorCodeProps) => {
  const { reducedMotion } = useMotionTheme();
  const digits = [...code];
  const start = reducedMotion ? false : undefined;

  return (
    <div role="img" aria-label={`${label} ${code}`} className="flex flex-col gap-2 lg:items-end">
      <motion.span
        aria-hidden
        className="flex items-center gap-3 font-technical text-micro text-graphite uppercase"
        initial={start ?? { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <span className="h-px w-8 bg-signal" />
        {label}
      </motion.span>
      <span
        aria-hidden
        className="flex items-end text-[clamp(6rem,22vw,13rem)] leading-[0.8] font-extrabold tracking-[-0.06em] lg:text-[min(18vw,32svh)]"
      >
        {digits.map((digit, index) => (
          <span key={index} className="block overflow-hidden pb-[0.02em]">
            <motion.span
              className="block"
              initial={start ?? { y: "105%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 + index * 0.12 }}
            >
              {digit}
            </motion.span>
          </span>
        ))}
        <motion.span
          className="mb-[0.06em] ml-[0.04em] block size-[0.16em] shrink-0 rounded-full bg-signal"
          initial={start ?? { y: "-3em", opacity: 0 }}
          animate={{ y: "0em", opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.25 + digits.length * 0.12 }}
        />
      </span>
    </div>
  );
};
