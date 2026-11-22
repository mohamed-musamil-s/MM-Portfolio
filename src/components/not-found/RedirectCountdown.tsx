"use client";

import { AnimatePresence, motion, useTransform } from "motion/react";
import { VisuallyHidden } from "radix-ui";
import type { NotFoundContent } from "@/lib/shared/content/not-found-schema";
import { cn } from "@/lib/shared/cn";
import { useRedirect } from "./RedirectProvider";

/** Seconds at which the countdown is announced to screen readers (plus the start). */
const ANNOUNCE_AT = new Set([5, 3]);
const RING_RADIUS = 27;

type RedirectCountdownProps = { labels: NotFoundContent["redirect"] };

/**
 * Orange ring that drains over the countdown, the seconds inside it, the
 * status label and a pause / resume toggle.
 */
export const RedirectCountdown = ({ labels }: RedirectCountdownProps) => {
  const { secondsLeft, progress, paused, togglePaused } = useRedirect();
  const remaining = useTransform(progress, (value) => 1 - value);
  const announce =
    !paused && (secondsLeft === labels.seconds || ANNOUNCE_AT.has(secondsLeft))
      ? labels.srAnnouncement.replace("{seconds}", String(secondsLeft))
      : "";

  return (
    <div className="flex items-center gap-4">
      <span
        className={cn("relative grid size-16 shrink-0 place-items-center transition-opacity", paused && "opacity-45")}
      >
        <svg aria-hidden viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90">
          <circle cx={32} cy={32} r={RING_RADIUS} fill="none" strokeWidth={2} className="stroke-ink/12" />
          <motion.circle
            cx={32}
            cy={32}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            className="stroke-signal"
            style={{ pathLength: remaining }}
          />
        </svg>
        <span
          aria-hidden
          className="relative h-[1em] overflow-hidden font-technical text-lead leading-none font-medium tabular-nums"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={secondsLeft}
              className="block"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
            >
              {secondsLeft}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
      <span className="flex flex-col gap-1 font-technical text-micro uppercase">
        <span className="text-graphite">{paused ? labels.pausedLabel : labels.label}</span>
        <button
          type="button"
          aria-pressed={paused}
          onClick={togglePaused}
          className="self-start border-b border-ink pb-0.5 font-medium text-ink outline-none hover:border-signal hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
        >
          {paused ? labels.resumeLabel : labels.pauseLabel}
        </button>
      </span>
      <VisuallyHidden.Root aria-live="polite">{announce}</VisuallyHidden.Root>
    </div>
  );
};
