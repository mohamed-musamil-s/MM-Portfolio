"use client";

import { motion } from "motion/react";
import { Monogram } from "@/components/brand/Monogram";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { StudioLoginContent } from "@/lib/shared/content/studio-login-schema";
import { AuroraBackdrop } from "./AuroraBackdrop";
import { WorkspaceIllustration } from "./WorkspaceIllustration";

type ShowcaseProps = { showcase: StudioLoginContent["showcase"]; brandName: string };

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

/** Desktop brand panel: light gradient shade with the tilted workspace illustration, as large as the panel allows. */
export const LoginShowcase = ({ showcase, brandName }: ShowcaseProps) => {
  const { reducedMotion } = useMotionTheme();
  const rise = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay },
  });

  return (
    <aside className="relative isolate m-3 hidden flex-col gap-4 overflow-hidden rounded-3xl border border-card p-6 lg:flex xl:p-8">
      <AuroraBackdrop />
      <motion.div className="flex items-center justify-between gap-4" {...rise(0)}>
        <Monogram dot="letter" className="h-7 w-auto text-foreground" />
        <StatusPill label={showcase.status} />
      </motion.div>

      {/* Sized by the space left: as wide as the panel, or as tall as it, whichever is smaller. */}
      <motion.div className="[container-type:size] grid min-h-0 flex-1 place-items-center" {...rise(0.1)}>
        <WorkspaceIllustration title={brandName} workspace={showcase.workspace} className="w-[min(100cqw,100cqh)]" />
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
