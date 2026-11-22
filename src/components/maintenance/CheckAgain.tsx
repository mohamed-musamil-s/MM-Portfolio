"use client";

import { motion } from "motion/react";
import { HeroActionButton } from "@/components/ui/HeroActionButton";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";
import { useSharedLiveCheck } from "./LiveCheckProvider";

/** Keeps the "checking" state on screen long enough to read, even when the API answers instantly. */
const MIN_CHECK_MS = 900;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type CheckAgainProps = {
  labels: MaintenanceContent["liveCheck"];
  /** Seconds before the block rises in (after the headline). */
  revealDelay?: number;
};

/**
 * Primary action: check the maintenance flag right now. While maintenance is
 * still on, the button reports "still upgrading" and settles back; if it's
 * already off, useLiveCheck sends the visitor to the site.
 */
export const CheckAgain = ({ labels, revealDelay = 0 }: CheckAgainProps) => {
  const { checkNow } = useSharedLiveCheck();
  return (
    <motion.div
      className="flex flex-col items-start gap-5 [@media(max-height:820px)]:gap-3"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.2, 0, 0, 1], delay: revealDelay }}
    >
      <HeroActionButton
        labels={{ idle: labels.checkAgainLabel, loading: labels.checkingLabel, success: labels.checkedLabel }}
        onAction={async () => {
          await Promise.all([checkNow(), wait(MIN_CHECK_MS)]);
        }}
      />
      <p className="max-w-[44ch] text-label leading-snug text-graphite max-lg:[@media(max-height:720px)]:hidden">
        {labels.hint}
      </p>
    </motion.div>
  );
};
