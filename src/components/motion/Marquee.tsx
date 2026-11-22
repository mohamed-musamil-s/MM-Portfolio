"use client";

import { motion, useAnimationFrame, useMotionValue, useTransform } from "motion/react";
import { Fragment, useRef, type ReactNode } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";
import { cn } from "@/lib/shared/cn";

type MarqueeProps = {
  /** One unit of the band; repeated to fill the width. */
  children: ReactNode;
  /** The text a screen reader should hear once (the band itself is hidden from assistive tech). */
  label: string;
  /** Drift in % of one copy per second at rest. */
  baseSpeed?: number;
  /** Units per copy; raise it if one copy is narrower than the viewport. */
  repeat?: number;
  className?: string;
};

/** Wraps `value` into [min, max). */
const wrap = (min: number, max: number, value: number) => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};

const VELOCITY_TO_BOOST = { input: [0, 1000], output: [0, 5] };

/**
 * Infinite ticker tape. Drifts left at rest; scrolling speeds it up, and
 * scrolling back up reverses it. Two identical copies wrap seamlessly at -50%.
 * Static under reduced motion.
 */
export const Marquee = ({ children, label, baseSpeed = 2, repeat = 4, className }: MarqueeProps) => {
  const { reducedMotion } = useMotionTheme();
  const offset = useMotionValue(0);
  const velocity = useScrollVelocity();
  const boost = useTransform(velocity, VELOCITY_TO_BOOST.input, VELOCITY_TO_BOOST.output, { clamp: false });
  const direction = useRef(-1);
  const x = useTransform(offset, (value) => `${wrap(-50, 0, value)}%`);

  useAnimationFrame((_, deltaMs) => {
    if (reducedMotion) {
      return;
    }
    const factor = boost.get();
    if (factor < 0) {
      direction.current = 1;
    } else if (factor > 0) {
      direction.current = -1;
    }
    offset.set(offset.get() + direction.current * baseSpeed * (deltaMs / 1000) * (1 + Math.abs(factor)));
  });

  const copy = (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: repeat }, (_, index) => (
        <Fragment key={index}>{children}</Fragment>
      ))}
    </div>
  );

  return (
    <div className={cn("relative overflow-hidden whitespace-nowrap", className)}>
      <span className="sr-only">{label}</span>
      <motion.div aria-hidden className="flex w-max" style={{ x }}>
        {copy}
        {copy}
      </motion.div>
    </div>
  );
};
