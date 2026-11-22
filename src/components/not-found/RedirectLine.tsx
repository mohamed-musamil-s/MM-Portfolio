"use client";

import { motion, useTransform } from "motion/react";
import { useRedirect } from "./RedirectProvider";

/** Full-width hairline that fills in signal orange over the countdown, led by a dot. */
export const RedirectLine = () => {
  const { progress } = useRedirect();
  const left = useTransform(progress, (value) => `${value * 100}%`);
  return (
    <div aria-hidden className="relative h-px w-full bg-ink/15">
      <motion.div className="absolute inset-y-0 left-0 w-full origin-left bg-signal" style={{ scaleX: progress }} />
      <motion.span className="absolute top-1/2 size-2 -translate-1/2 rounded-full bg-signal" style={{ left }} />
    </div>
  );
};
