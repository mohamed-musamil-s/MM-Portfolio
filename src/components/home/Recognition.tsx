"use client";

import { motion, useSpring } from "motion/react";
import { useState, type PointerEvent, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { Section, SectionHeader } from "./section-kit";

/*
 * Recognition (docs/screens/HOME_BUSINESS.md §6.6), a bento wall of tiles in
 * mixed sizes: one large featured award (ink), the other awards as smaller
 * tiles, and the kind words as two quote tiles side by side (signal, ink).
 * Education has its own section (Education.tsx). On the way in the tiles assemble from depth, tipping up from
 * behind the page one after another. Under a mouse each tile tilts in 3D
 * toward the pointer while a soft sheen follows it.
 */

type Recognition = HomeContent["recognition"];
type Award = Recognition["awards"][number];
type Quote = Recognition["quotes"][number];

type Tone = "ink" | "signal" | "paper" | "stone";

const TILT_MAX_DEG = 7;
const TILT_SPRING = { stiffness: 220, damping: 20 } as const;
const STAGGER_S = 0.07;

const pad = (value: number) => String(value).padStart(2, "0");

const TONE_CLASS: Record<Tone, string> = {
  ink: "bg-ink text-paper",
  signal: "bg-signal text-paper",
  paper: "border border-ink/10 bg-paper text-ink",
  stone: "bg-newsprint text-ink",
};

/** The sheen under the pointer: white on dark tiles, a warm tint on light ones. */
const SHEEN_CLASS: Record<Tone, string> = {
  ink: "bg-[radial-gradient(circle_at_var(--sheen-x)_var(--sheen-y),rgb(255_255_255/0.16),transparent_45%)]",
  signal: "bg-[radial-gradient(circle_at_var(--sheen-x)_var(--sheen-y),rgb(255_255_255/0.3),transparent_45%)]",
  paper:
    "bg-[radial-gradient(circle_at_var(--sheen-x)_var(--sheen-y),color-mix(in_srgb,var(--signal)_14%,transparent),transparent_45%)]",
  stone:
    "bg-[radial-gradient(circle_at_var(--sheen-x)_var(--sheen-y),color-mix(in_srgb,var(--signal)_14%,transparent),transparent_45%)]",
};

const muted = (tone: Tone) => (tone === "paper" || tone === "stone" ? "text-graphite" : "text-paper/65");

/**
 * One tile: assembles from depth on the way in; under a mouse it tilts toward the pointer with a sheen.
 * The entrance and the tilt live on separate layers so their transforms never fight.
 */
const Tile = ({
  tone,
  order,
  className,
  children,
}: {
  tone: Tone;
  order: number;
  className?: string;
  children: ReactNode;
}) => {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const { reducedMotion } = useMotionTheme();
  const tilts = fine && !reducedMotion;
  const rotateX = useSpring(0, TILT_SPRING);
  const rotateY = useSpring(0, TILT_SPRING);
  const [lit, setLit] = useState(false);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    rotateY.set((x - 0.5) * 2 * TILT_MAX_DEG);
    rotateX.set(-(y - 0.5) * 2 * TILT_MAX_DEG);
    event.currentTarget.style.setProperty("--sheen-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--sheen-y", `${y * 100}%`);
  };
  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    setLit(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 70, rotateX: 28, z: -220 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, z: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ delay: order * STAGGER_S, duration: 1, ease: EASE_PRINT }}
      style={{ transformPerspective: 1100 }}
      className={cn("origin-bottom", className)}
    >
      <motion.div
        onPointerMove={tilts ? onPointerMove : undefined}
        onPointerEnter={tilts ? () => setLit(true) : undefined}
        onPointerLeave={tilts ? onPointerLeave : undefined}
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        className={cn(
          "relative flex h-full flex-col gap-4 overflow-hidden rounded-[1.75rem] p-6 sm:p-7",
          TONE_CLASS[tone],
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-500",
            SHEEN_CLASS[tone],
            lit ? "opacity-100" : "opacity-0",
          )}
        />
        {children}
      </motion.div>
    </motion.div>
  );
};

const Eyebrow = ({ tone, left, right }: { tone: Tone; left: string; right?: string }) => (
  <div
    className={cn("relative flex items-center justify-between gap-4 font-technical text-micro uppercase", muted(tone))}
  >
    <span>{left}</span>
    {right ? <span>{right}</span> : null}
  </div>
);

const FeaturedTile = ({ award, label, total }: { award: Award; label: string; total: number }) => (
  <Tile tone="ink" order={0} className="md:col-span-6 lg:row-span-2">
    <Eyebrow tone="ink" left={label} right={`${pad(total)} awards`} />
    {/* The badge, giant and outlined, filling the corner. */}
    <span
      aria-hidden
      className="pointer-events-none absolute -right-6 -bottom-10 font-wide text-[clamp(9rem,18vw,16rem)] leading-none font-semibold text-transparent [-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--bg-primary)_18%,transparent)]"
    >
      {award.badge}
    </span>
    <span className="relative mt-auto grid size-16 place-items-center rounded-full bg-signal font-wide text-xl font-semibold text-paper">
      {award.badge}
    </span>
    <h3 className="relative max-w-[16ch] font-wide text-[clamp(1.8rem,3.4vw,3.2rem)] leading-[0.95] font-semibold tracking-[-0.02em] uppercase">
      {award.title}
    </h3>
    <span className="relative font-technical text-micro text-signal uppercase">
      {award.org}
      {award.year ? ` · ${award.year}` : ""}
    </span>
    {award.text ? (
      <p className="relative max-w-[42ch] font-glyph text-[1rem] leading-relaxed text-paper/70">{award.text}</p>
    ) : null}
  </Tile>
);

const AwardTile = ({ award, order }: { award: Award; order: number }) => (
  <Tile tone="paper" order={order} className="md:col-span-3">
    <div className="relative flex items-start justify-between gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-signal font-wide text-sm font-semibold text-signal">
        {award.badge}
      </span>
      <span className="font-technical text-micro text-graphite uppercase">{award.year || award.org}</span>
    </div>
    <h3 className="relative mt-auto font-wide text-[1.15rem] leading-tight font-semibold uppercase">{award.title}</h3>
    {award.text ? (
      <p className="relative font-glyph text-[0.9rem] leading-relaxed text-graphite">{award.text}</p>
    ) : null}
  </Tile>
);

const QuoteTile = ({ quote, label, order, tone }: { quote: Quote; label: string; order: number; tone: Tone }) => (
  <Tile tone={tone} order={order} className="md:col-span-6">
    <Eyebrow tone={tone} left={label} />
    <span
      aria-hidden
      className={cn(
        "relative -mb-4 font-wide text-[4.5rem] leading-[0.6]",
        tone === "signal" ? "text-ink" : "text-signal",
      )}
    >
      “
    </span>
    <blockquote className="relative font-wide text-[clamp(1.3rem,2.2vw,2rem)] leading-[1.1] font-semibold tracking-[-0.01em] text-balance uppercase">
      {quote.quote}
    </blockquote>
    <span className={cn("relative mt-auto font-technical text-micro uppercase", muted(tone))}>— {quote.source}</span>
  </Tile>
);

export const Recognition = ({ recognition }: { recognition: Recognition }) => {
  const { awards, quotes } = recognition;
  // The featured award: the first with a year (the most specific), else the first.
  const featuredIndex = Math.max(
    0,
    awards.findIndex((award) => award.year),
  );
  const featured = awards[featuredIndex];
  const others = awards.filter((_, index) => index !== featuredIndex);
  const [firstQuote, secondQuote] = quotes;
  let order = 1 + others.length;

  return (
    <Section id="recognition" className="bg-newsprint/40">
      <SectionHeader header={recognition.header} />
      <div className="grid gap-4 md:grid-cols-6 lg:[grid-auto-flow:dense] lg:auto-rows-[minmax(15rem,auto)] lg:grid-cols-12">
        {featured ? <FeaturedTile award={featured} label={recognition.awardsLabel} total={awards.length} /> : null}
        {others.map((award, index) => (
          <AwardTile key={`${award.title}-${index}`} award={award} order={1 + index} />
        ))}
        {firstQuote ? (
          <QuoteTile quote={firstQuote} label={recognition.quotesLabel} order={order++} tone="signal" />
        ) : null}
        {secondQuote ? (
          <QuoteTile quote={secondQuote} label={recognition.quotesLabel} order={order++} tone="ink" />
        ) : null}
      </div>
    </Section>
  );
};
