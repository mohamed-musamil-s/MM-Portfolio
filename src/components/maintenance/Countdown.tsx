"use client";

import { AnimatePresence, motion } from "motion/react";
import { Fragment } from "react";
import { MagicIcon } from "@/components/ui/MagicIcon";
import { useCountdown, type CountdownParts } from "@/hooks/useCountdown";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";

type CountdownProps = {
  timeline: MaintenanceContent["timeline"];
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

/** Clean tabular readout: label row, then DD : HH : MM : SS with unit labels underneath. */
export const Countdown = ({ timeline }: CountdownProps) => {
  const countdown = useCountdown(timeline.targetAt, timeline.windowStart);

  if (countdown?.overdue) {
    return (
      <div className="flex items-center gap-4" role="status">
        <MagicIcon name="sync" state="loading" size={32} />
        <div>
          <p className="text-h2 font-extrabold uppercase">{timeline.overdue.title}</p>
          <p className="font-technical text-micro text-graphite uppercase">{timeline.overdue.detail}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={countdown ? fillTemplate(timeline.srRemaining, countdown.parts) : undefined}
      className="flex flex-col gap-3"
    >
      <span className="font-technical text-micro text-graphite uppercase">
        {timeline.countdownLabel} · {timeline.label}
      </span>
      <div aria-hidden className="flex items-start gap-3 sm:gap-5">
        {UNIT_KEYS.map((unit, index) => {
          const value = countdown ? pad(countdown.parts[unit]) : PLACEHOLDER;
          return (
            <Fragment key={unit}>
              {index > 0 ? <span className="text-h2 leading-none font-light text-ink/25">:</span> : null}
              <div className="flex flex-col gap-2">
                <span className="text-h2 leading-none font-extrabold tabular-nums">
                  {value.split("").map((char, position) => (
                    <Digit key={`${unit}-${value.length - position}`} char={char} />
                  ))}
                </span>
                <span className="font-technical text-micro text-graphite">{timeline.units[unit]}</span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
