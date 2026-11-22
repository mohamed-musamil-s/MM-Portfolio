"use client";

import { motion } from "motion/react";
import { Monogram } from "@/components/brand/Monogram";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { StudioLoginContent } from "@/lib/shared/content/studio-login-schema";
import { AuroraBackdrop } from "./AuroraBackdrop";
import { WidgetCluster } from "./WidgetCluster";

type ShowcaseProps = { showcase: StudioLoginContent["showcase"] };

const EASE = [0.2, 0, 0, 1] as const;

const StatusPill = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-card bg-card/70 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-md">
    <span className="relative flex size-2">
      <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-50 motion-reduce:hidden" />
      <span className="relative size-2 rounded-full bg-success" />
    </span>
    {label}
  </span>
);

/** Desktop brand panel: light gradient shade with the labelled glass widget cluster, as large as the panel allows. */
export const LoginShowcase = ({ showcase }: ShowcaseProps) => {
  const { reducedMotion } = useMotionTheme();
  const rise = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay },
  });

  return (
    <aside className="relative isolate m-3 hidden overflow-hidden rounded-3xl border border-card lg:block">
      <AuroraBackdrop />
      {/* The illustration takes the whole panel; the logo row floats over its top edge. */}
      <motion.div
        className="[container-type:size] absolute inset-0 grid place-items-center px-4 pt-14 pb-3 xl:pt-16"
        {...rise(0.1)}
      >
        <WidgetCluster labels={showcase.illustration} className="w-[min(100cqw,100cqh)]" />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 p-6 xl:px-8"
        {...rise(0)}
      >
        <Monogram dot="letter" className="h-7 w-auto text-foreground" />
        <StatusPill label={showcase.status} />
      </motion.div>
    </aside>
  );
};

/** Phones and tablets: a compact gradient band above the form. */
export const LoginShowcaseBand = ({ showcase }: { showcase: StudioLoginContent["showcase"] }) => (
  <div className="relative isolate m-3 mb-0 flex items-center justify-between gap-4 overflow-hidden rounded-3xl border border-card p-5 lg:hidden">
    <AuroraBackdrop />
    <Monogram dot="letter" className="h-6 w-auto text-foreground" />
    <StatusPill label={showcase.status} />
  </div>
);
