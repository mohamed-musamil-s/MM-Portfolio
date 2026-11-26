"use client";

import { useSyncExternalStore } from "react";

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
const DAY_MONTH = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" });

const STEPS: [limitSeconds: number, unit: Intl.RelativeTimeFormatUnit, seconds: number][] = [
  [60, "second", 1],
  [3600, "minute", 60],
  [86_400, "hour", 3600],
  [604_800, "day", 86_400],
];

/** "5 min. ago", "yesterday", then "12 Nov" after a week. */
export const relativeTime = (iso: string, now: number): string => {
  const date = new Date(iso);
  const seconds = Math.round((date.getTime() - now) / 1000);
  const step = STEPS.find(([limit]) => Math.abs(seconds) < limit);
  return step ? RELATIVE.format(Math.round(seconds / step[2]), step[1]) : DAY_MONTH.format(date);
};

const noopSubscribe = () => () => undefined;

/**
 * Relative time for an ISO date, worked out in the browser only (the server
 * renders the plain date), so the first render never mismatches.
 */
export const useRelativeTime = (iso: string): string =>
  useSyncExternalStore(
    noopSubscribe,
    () => relativeTime(iso, Date.now()),
    () => DAY_MONTH.format(new Date(iso)),
  );
