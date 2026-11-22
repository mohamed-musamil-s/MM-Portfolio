"use client";

import { AnimatePresence, motion } from "motion/react";
import { MagicIcon } from "@/components/ui/MagicIcon";
import { useCountdown, type CountdownParts } from "@/hooks/useCountdown";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";

type CountdownProps = {
  timeline: MaintenanceContent["timeline"];
  /** Pre-formatted on the server (UTC) so SSR and client agree. */
  windowText: string;
};

const UNIT_KEYS = ["days", "hours", "minutes", "seconds"] as const satisfies readonly (keyof CountdownParts)[];
const PLACEHOLDER = "--";

const pad = (value: number) => String(value).padStart(2, "0");

const fillTemplate = (template: string, parts: CountdownParts) =>
  template
    .replace("{days}", String(parts.days))
    .replace("{hours}", String(parts.hours))
    .replace("{minutes}", String(parts.minutes));

/** A single digit that slides out downward as the next one drops in. */
const Digit = ({ char }: { char: string }) => {
  const { tokens, reducedMotion } = useMotionTheme();
  return (
    <span className="relative inline-block overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          className="inline-block"
          initial={reducedMotion ? false : { y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={reducedMotion ? undefined : { y: "100%", opacity: 0 }}
          transition={{ duration: tokens.duration.fast * 1.5, ease: tokens.ease }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export const Countdown = ({ timeline, windowText }: CountdownProps) => {
  const { tokens } = useMotionTheme();
  const countdown = useCountdown(timeline.targetAt, timeline.windowStart);
  const overdue = countdown?.overdue ?? false;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 font-technical text-micro text-graphite uppercase">
        <span>{timeline.label}</span>
        <span>{windowText}</span>
      </div>

      {overdue ? (
        <div className="flex items-center gap-4" role="status">
          <MagicIcon name="sync" state="loading" size={36} />
          <div>
            <p className="text-h2 font-extrabold uppercase">{timeline.overdue.title}</p>
            <p className="font-technical text-micro text-graphite uppercase">{timeline.overdue.detail}</p>
          </div>
        </div>
      ) : (
        <div
          role="timer"
          aria-live="off"
          aria-label={countdown ? fillTemplate(timeline.srRemaining, countdown.parts) : undefined}
          className="flex flex-col gap-2"
        >
          <span className="font-technical text-micro text-graphite uppercase">{timeline.countdownLabel}</span>
          <div aria-hidden className="flex items-start gap-2 sm:gap-4">
            {UNIT_KEYS.map((unit, index) => {
              const value = countdown ? pad(countdown.parts[unit]) : PLACEHOLDER;
              return (
                <div key={unit} className="flex items-start gap-2 sm:gap-4">
                  {index > 0 ? <span className="text-h1 font-extrabold text-graphite">:</span> : null}
                  <div className="flex flex-col items-start">
                    <span className="text-h1 font-extrabold tabular-nums">
                      {value.split("").map((char, position) => (
                        <Digit key={`${unit}-${value.length - position}`} char={char} />
                      ))}
                    </span>
                    <span className="font-technical text-micro text-graphite">{timeline.units[unit]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div aria-hidden className="relative h-px w-full bg-rule/25">
        <motion.span
          className="absolute inset-y-0 left-0 w-full origin-left bg-ink"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: countdown?.progress ?? 0 }}
          transition={{ duration: tokens.duration.slow, ease: tokens.ease }}
        />
      </div>
    </div>
  );
};
