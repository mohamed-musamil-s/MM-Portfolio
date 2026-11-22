"use client";

import { animate, createDrawable, set, type JSAnimation } from "animejs";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { secondsToMs, toAnimeEase } from "@/lib/motion/anime";

type WindowRulerProps = {
  windowStart: Date;
  targetAt: Date;
  startLabel: string;
  endLabel: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 16;
/** Beyond this many days, draw weekly ticks only so the ruler stays legible. */
const DAILY_TICK_LIMIT = 120;
const WEEK = 7;

const rulerTicks = (days: number): string => {
  const step = days > DAILY_TICK_LIMIT ? WEEK : 1;
  const parts: string[] = [];
  for (let day = 0; day <= days; day += step) {
    const x = ((day / days) * VIEW_WIDTH).toFixed(1);
    const major = day % WEEK === 0 || day === days;
    parts.push(`M${x} ${major ? 0 : 9}V${VIEW_HEIGHT}`);
  }
  return parts.join("");
};

/**
 * Full-width timeline of the upgrade window: faint day ticks drawn in left to
 * right (anime.js), the elapsed stretch as a signal-orange line, and an orange
 * "now" dot (motion). Dates sit under both ends.
 */
export const WindowRuler = ({ windowStart, targetAt, startLabel, endLabel }: WindowRulerProps) => {
  const { tokens, reducedMotion } = useMotionTheme();
  // Same second-aligned clock as the countdown; null during SSR.
  const progress = useCountdown(targetAt, windowStart)?.progress ?? null;
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
    <div aria-hidden className="flex flex-col gap-2">
      <div className="relative h-5 overflow-x-clip">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-4 w-full text-ink/30"
          fill="none"
          stroke="currentColor"
        >
          <path ref={ticksRef} d={ticks} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="absolute inset-x-0 bottom-0 h-px bg-ink/25" />
        <motion.span
          className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-signal"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: elapsed }}
          transition={{ duration: tokens.duration.slow * 1.5, ease: tokens.ease }}
        />
        {progress !== null ? (
          <motion.span
            className="pointer-events-none absolute inset-y-0 left-0 w-full"
            initial={{ x: "0%" }}
            animate={{ x: `${elapsed * 100}%` }}
            transition={{ duration: tokens.duration.slow * 1.5, ease: tokens.ease }}
          >
            <span className="absolute bottom-0 left-0 size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-signal ring-4 ring-paper" />
          </motion.span>
        ) : null}
      </div>
      <div className="flex justify-between font-technical text-micro text-graphite uppercase">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
};
