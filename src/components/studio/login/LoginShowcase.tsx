"use client";

import { motion } from "motion/react";
import { Monogram } from "@/components/brand/Monogram";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { StudioLoginContent } from "@/lib/shared/content/studio-login-schema";
import { AuroraBackdrop } from "./AuroraBackdrop";

type Showcase = StudioLoginContent["showcase"];

const EASE = [0.2, 0, 0, 1] as const;

/** Splits off the last word so it can carry the aurora gradient. */
const splitLastWord = (text: string): [string, string] => {
  const index = text.trimEnd().lastIndexOf(" ");
  return index === -1 ? ["", text] : [text.slice(0, index + 1), text.slice(index + 1)];
};

const StatusPill = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-hero-foreground/10 bg-hero-foreground/5 px-3 py-1 text-xs font-medium text-hero-foreground backdrop-blur-md">
    <span className="relative flex size-2">
      <span className="absolute inset-0 animate-ping rounded-full bg-hero-success opacity-60 motion-reduce:hidden" />
      <span className="relative size-2 rounded-full bg-hero-success" />
    </span>
    {label}
  </span>
);

const GradientHeadline = ({ text, className }: { text: string; className: string }) => {
  const [lead, last] = splitLastWord(text);
  return (
    <h2 className={className}>
      {lead}
      <span className="bg-linear-to-r from-aurora-cyan via-hero-foreground to-aurora-blue bg-clip-text text-transparent">
        {last}
      </span>
    </h2>
  );
};

/** Glass card with the current release: decorative progress and activity bars. */
const ReleaseCard = ({ card }: { card: Showcase["card"] }) => {
  const { reducedMotion } = useMotionTheme();
  return (
    <div className="w-full max-w-sm rounded-2xl border border-hero-foreground/10 bg-hero-foreground/5 p-5 shadow-2xl shadow-hero backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-hero-muted">{card.label}</span>
          <span className="font-code text-2xl font-semibold tracking-tight">{card.title}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-hero-success/15 px-2.5 py-1 text-xs font-medium text-hero-success">
          <span className="size-1.5 rounded-full bg-hero-success" />
          {card.status}
        </span>
      </div>
      <div aria-hidden className="mt-5 h-1.5 overflow-hidden rounded-full bg-hero-foreground/10">
        <motion.div
          className="h-full origin-left rounded-full bg-linear-to-r from-aurora-blue to-aurora-cyan"
          initial={{ scaleX: reducedMotion ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.5 }}
        />
      </div>
      <div aria-hidden className="mt-5 flex h-10 items-end gap-1 [@media(max-height:800px)]:hidden">
        {[38, 55, 42, 70, 48, 82, 64, 90, 58, 76, 68, 95].map((height, index) => (
          <motion.span
            key={index}
            className="flex-1 origin-bottom rounded-sm bg-hero-foreground/20 last:bg-aurora-cyan"
            style={{ height: `${height}%` }}
            initial={{ scaleY: reducedMotion ? 1 : 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.7 + index * 0.04 }}
          />
        ))}
      </div>
    </div>
  );
};

/** Desktop brand panel: always dark, aurora behind headline, modules and a release card. */
export const LoginShowcase = ({ showcase }: { showcase: Showcase }) => {
  const { reducedMotion } = useMotionTheme();
  const rise = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay },
  });

  return (
    <aside className="relative isolate m-3 hidden flex-col justify-between gap-10 overflow-hidden rounded-3xl bg-hero p-10 text-hero-foreground lg:flex xl:p-14 [@media(max-height:800px)]:gap-6 [@media(max-height:800px)]:p-8">
      <AuroraBackdrop />
      <motion.div className="flex items-center justify-between gap-4" {...rise(0)}>
        <Monogram dot="letter" className="h-7 w-auto text-hero-foreground" />
        <StatusPill label={showcase.status} />
      </motion.div>

      <div className="flex max-w-lg flex-col gap-6">
        <motion.div {...rise(0.1)}>
          <GradientHeadline
            text={showcase.headline}
            className="text-5xl leading-[1.05] font-semibold tracking-tight text-balance xl:text-6xl [@media(max-height:800px)]:text-4xl"
          />
        </motion.div>
        <motion.p className="max-w-md text-lg leading-relaxed text-hero-muted" {...rise(0.2)}>
          {showcase.body}
        </motion.p>
        <motion.ul className="flex flex-wrap gap-2" {...rise(0.3)}>
          {showcase.modules.map((module) => (
            <li
              key={module}
              className="rounded-full border border-hero-foreground/10 bg-hero-foreground/5 px-3 py-1 text-sm text-hero-foreground/90 backdrop-blur-md"
            >
              {module}
            </li>
          ))}
        </motion.ul>
      </div>

      <motion.div className="flex flex-col gap-8 [@media(max-height:800px)]:gap-5" {...rise(0.4)}>
        <ReleaseCard card={showcase.card} />
        <p className="text-xs text-hero-muted">{showcase.footer}</p>
      </motion.div>
    </aside>
  );
};

/** Phones and tablets: a compact aurora band above the form. */
export const LoginShowcaseBand = ({ showcase }: { showcase: Showcase }) => (
  <div className="relative isolate m-3 mb-0 flex flex-col gap-5 overflow-hidden rounded-3xl bg-hero p-6 text-hero-foreground lg:hidden">
    <AuroraBackdrop />
    <div className="flex items-center justify-between gap-4">
      <Monogram dot="letter" className="h-6 w-auto text-hero-foreground" />
      <StatusPill label={showcase.status} />
    </div>
    <GradientHeadline text={showcase.headline} className="text-3xl leading-tight font-semibold tracking-tight" />
  </div>
);
