"use client";

import { motion } from "motion/react";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";
import { useSharedLiveCheck } from "./LiveCheckProvider";

type LiveCheckFooterProps = {
  labels: MaintenanceContent["liveCheck"];
  note: string;
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit" };

const formatCountdown = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Footer row: when the page last checked, when it checks next (with a
 * signal-orange progress line), and the small print. When the admin turns
 * maintenance off, the next check sends the visitor to the site.
 */
export const LiveCheckFooter = ({ labels, note }: LiveCheckFooterProps) => {
  const { lastCheckedAt, secondsToNext, progress } = useSharedLiveCheck();
  const lastChecked = lastCheckedAt === null ? "--:--:--" : new Date(lastCheckedAt).toLocaleTimeString(undefined, TIME_FORMAT);
  const nextCheck = lastCheckedAt === null ? "-:--" : formatCountdown(secondsToNext);

  return (
    <footer className="grid grid-cols-2 border-t border-ink/15 sm:grid-cols-3">
      <div className="flex flex-col gap-2 py-6 pr-6 lg:py-8 [@media(max-height:820px)]:lg:py-5">
        <span className="font-technical text-micro text-graphite uppercase">{labels.lastCheckedLabel}</span>
        <span className="font-technical text-label tabular-nums">{lastChecked}</span>
      </div>
      <div className="flex flex-col gap-2 border-l border-ink/15 py-6 pl-6 lg:py-8 lg:pl-10 [@media(max-height:820px)]:lg:py-5">
        <span className="font-technical text-micro text-graphite uppercase">{labels.nextCheckLabel}</span>
        <span className="font-technical text-label tabular-nums">{nextCheck}</span>
        <span aria-hidden className="relative mt-1 h-0.5 w-full max-w-40 overflow-hidden bg-ink/10">
          <motion.span
            className="absolute inset-0 origin-left bg-signal"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ duration: progress === 0 ? 0 : 0.9, ease: "linear" }}
          />
        </span>
      </div>
      <div className="hidden items-end justify-end border-l border-ink/15 py-6 pl-6 sm:flex lg:py-8 [@media(max-height:820px)]:lg:py-5">
        <span className="font-technical text-micro text-graphite uppercase">{note}</span>
      </div>
    </footer>
  );
};
