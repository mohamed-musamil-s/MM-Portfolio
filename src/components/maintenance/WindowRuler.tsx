"use client";

import { animate, createDrawable, set, type JSAnimation } from "animejs";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { secondsToMs, toAnimeEase } from "@/lib/motion/anime";

type WindowRulerProps = {
  windowStart: Date;
  targetAt: Date;
  /** 0..1, or null before the client clock starts. */
  progress: number | null;
  startLabel: string;
  endLabel: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 24;
/** Beyond this many days, draw weekly ticks only so the ruler stays legible. */
const DAILY_TICK_LIMIT = 120;
const WEEK = 7;

const rulerTicks = (days: number): string => {
  const step = days > DAILY_TICK_LIMIT ? WEEK : 1;
  const parts: string[] = [];
  for (let day = 0; day <= days; day += step) {
    const x = ((day / days) * VIEW_WIDTH).toFixed(1);
    const major = day % WEEK === 0 || day === days;
    parts.push(`M${x} ${major ? 0 : 12}V${VIEW_HEIGHT}`);
  }
  return parts.join("");
};

/**
 * Calibration ruler for the upgrade window: one tick per day (weekly ticks on
 * long windows), drawn in left to right (anime.js), an elapsed hatch, and a
 * capped needle at "now" (motion).
 */
export const WindowRuler = ({ windowStart, targetAt, progress, startLabel, endLabel }: WindowRulerProps) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const ticksRef = useRef<SVGPathElement>(null);
  const days = Math.max(1, Math.round((targetAt.getTime() - windowStart.getTime()) / DAY_MS));
  const ticks = useMemo(() => rulerTicks(days), [days]);
  const elapsed = progress ?? 0;

  useEffect(() => {
    if (!ticksRef.current) {
      return;
    }
    const drawable = createDrawable(ticksRef.current);
    if (reducedMotion) {
      set(drawable, { draw: "0 1" });
      return;
    }
    const draw: JSAnimation = animate(drawable, {
      draw: ["0 0", "0 1"],
      duration: secondsToMs(tokens.duration.slow * 2),
      ease: toAnimeEase(tokens.ease),
    });
    return () => {
      draw.pause();
    };
  }, [ticks, reducedMotion, tokens]);

  return (
    <div aria-hidden className="flex flex-col gap-3">
      <div className="relative h-8 overflow-x-clip">
        <motion.div
          className="absolute inset-0 bg-[repeating-linear-gradient(135deg,var(--text-primary)_0_1px,transparent_1px_7px)] opacity-35"
          initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
          animate={{ clipPath: `inset(0% ${(1 - elapsed) * 100}% 0% 0%)` }}
          transition={{ duration: tokens.duration.slow, ease: tokens.ease }}
        />
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-6 w-full text-ink"
          fill="none"
          stroke="currentColor"
        >
          <path ref={ticksRef} d={ticks} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="absolute inset-x-0 bottom-0 h-px bg-ink" />
        {progress !== null ? (
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0 w-full"
            initial={{ x: "0%" }}
            animate={{ x: `${elapsed * 100}%` }}
            transition={{ type: "spring", ...tokens.spring }}
          >
            <span className="absolute -top-2 bottom-0 left-0 w-0.5 -translate-x-1/2 bg-ink" />
            <span className="absolute -top-3 left-0 size-2 -translate-x-1/2 bg-ink" />
          </motion.div>
        ) : null}
      </div>
      <div className="flex justify-between font-technical text-micro text-graphite uppercase">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
};
