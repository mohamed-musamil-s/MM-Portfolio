"use client";

import { AnimatePresence, motion } from "motion/react";
import { MagicIcon } from "@/components/ui/MagicIcon";
import { useCountdown, type CountdownParts } from "@/hooks/useCountdown";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";
import { WindowRuler } from "./WindowRuler";

type CountdownProps = {
  timeline: MaintenanceContent["timeline"];
  /** Pre-formatted on the server (UTC) so SSR and client agree. */
  startLabel: string;
  endLabel: string;
};

const UNIT_KEYS = ["days", "hours", "minutes", "seconds"] as const satisfies readonly (keyof CountdownParts)[];
const PLACEHOLDER = "--";

const pad = (value: number) => String(value).padStart(2, "0");

const fillTemplate = (template: string, parts: CountdownParts) =>
  template
    .replace("{days}", String(parts.days))
    .replace("{hours}", String(parts.hours))
    .replace("{minutes}", String(parts.minutes));

/**
 * A single digit that slides out downward as the next one drops in. The mask
 * is exactly 1em tall and sized by an invisible copy of the digit (tabular
 * figures share one width), so both animated copies are clipped to it.
 */
const Digit = ({ char }: { char: string }) => {
  const { tokens, reducedMotion } = useMotionTheme();
  return (
    <span className="relative inline-block h-[1em] overflow-hidden align-top leading-none">
      <span className="invisible">{char}</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={char}
          className="absolute inset-0"
          initial={reducedMotion ? false : { y: "-100%" }}
          animate={{ y: "0%" }}
          exit={reducedMotion ? undefined : { y: "100%" }}
          transition={{ duration: tokens.duration.fast * 1.5, ease: tokens.ease }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/** Full-width instrument: giant tabular readout split by hairlines, then the window ruler. */
export const Countdown = ({ timeline, startLabel, endLabel }: CountdownProps) => {
  const countdown = useCountdown(timeline.targetAt, timeline.windowStart);
  const overdue = countdown?.overdue ?? false;

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-4 font-technical text-micro text-graphite uppercase">
        <span>{timeline.label}</span>
        <span>{timeline.countdownLabel}</span>
      </div>

      {overdue ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-8" role="status">
          <MagicIcon name="sync" state="loading" size={56} />
          <div>
            <p className="text-h1 font-extrabold uppercase md:text-display">{timeline.overdue.title}</p>
            <p className="font-technical text-micro text-graphite uppercase">{timeline.overdue.detail}</p>
          </div>
        </div>
      ) : (
        <div
          role="timer"
          aria-live="off"
          aria-label={countdown ? fillTemplate(timeline.srRemaining, countdown.parts) : undefined}
        >
          <div aria-hidden className="grid grid-cols-4">
            {UNIT_KEYS.map((unit) => {
              const value = countdown ? pad(countdown.parts[unit]) : PLACEHOLDER;
              return (
                <div key={unit} className="flex flex-col gap-3 border-l border-rule pl-3 first:border-l-0 first:pl-0 md:pl-6">
                  <span className="text-h1 leading-none font-extrabold tabular-nums md:text-display">
                    {value.split("").map((char, position) => (
                      <Digit key={`${unit}-${value.length - position}`} char={char} />
                    ))}
                  </span>
                  <span className="font-technical text-micro text-graphite">{timeline.units[unit]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <WindowRuler
        windowStart={timeline.windowStart}
        targetAt={timeline.targetAt}
        progress={countdown?.progress ?? null}
        startLabel={startLabel}
        endLabel={endLabel}
      />
    </div>
  );
};
