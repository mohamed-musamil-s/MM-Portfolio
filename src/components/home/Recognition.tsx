"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { MaskRise, Reveal, Section, SectionHeader } from "./section-kit";

/*
 * Recognition (docs/screens/HOME_BUSINESS.md §6.6), set like a newspaper
 * page: no tiles. A masthead between a thick and a thin rule (the awards
 * label, the count). The lead story: the featured award's title as a huge
 * headline, its kicker, and its text with a drop cap, the badge giant in the
 * margin. Below, the other awards as columns divided by vertical rules (a
 * kicker, a headline, the text). Then the kind words as two pull quotes
 * between rules. The rules draw in, headlines rise through masks, the text
 * fades up. Education has its own section (Education.tsx).
 */

type Recognition = HomeContent["recognition"];
type Award = Recognition["awards"][number];

const VIEW = { once: true, margin: "0px 0px -10% 0px" } as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** A horizontal rule that draws across. */
const Rule = ({ thick = false, delay = 0 }: { thick?: boolean; delay?: number }) => (
  <motion.span
    aria-hidden
    initial={{ scaleX: 0 }}
    whileInView={{ scaleX: 1 }}
    viewport={VIEW}
    transition={{ delay, duration: 1.1, ease: EASE_PRINT }}
    className={cn("block origin-left bg-ink", thick ? "h-[3px]" : "h-px opacity-25")}
  />
);

const Kicker = ({ award }: { award: Award }) => (
  <span className="font-technical text-micro text-signal uppercase">
    {award.org}
    {award.year ? ` · ${award.year}` : ""}
  </span>
);

const LeadStory = ({ award }: { award: Award }) => (
  <article className="grid gap-8 py-[clamp(2rem,6svh,3.5rem)] lg:grid-cols-12 lg:gap-12">
    <div className="flex flex-col gap-5 lg:col-span-8">
      <Kicker award={award} />
      <h3 className="font-wide text-[clamp(2.2rem,5vw,5.2rem)] leading-[0.92] font-semibold tracking-[-0.025em] uppercase">
        <MaskRise>{award.title}</MaskRise>
      </h3>
      {award.text ? (
        <Reveal
          as="p"
          delay={0.15}
          className="max-w-[56ch] font-glyph text-lead text-pretty text-graphite first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:font-wide first-letter:text-[3.6em] first-letter:leading-[0.8] first-letter:font-semibold first-letter:text-ink"
        >
          {award.text}
        </Reveal>
      ) : null}
    </div>
    {/* The badge in the margin, giant and outlined. */}
    <Reveal
      delay={0.2}
      y={0}
      className="flex items-start justify-start font-wide text-[clamp(6rem,14vw,13rem)] leading-[0.8] font-semibold text-transparent [-webkit-text-stroke:1.5px_var(--signal)] lg:col-span-4 lg:justify-end"
    >
      <span aria-hidden>{award.badge}</span>
    </Reveal>
  </article>
);

/** One newspaper column: the vertical rule on its left draws down. */
const Column = ({ award, index }: { award: Award; index: number }) => (
  <article className="relative flex flex-col gap-3 py-6 lg:px-6 lg:first:pl-0">
    {index > 0 ? (
      <motion.span
        aria-hidden
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={VIEW}
        transition={{ delay: index * 0.1, duration: 1, ease: EASE_PRINT }}
        className="absolute top-6 bottom-6 left-0 hidden w-px origin-top bg-ink/25 lg:block"
      />
    ) : null}
    <div className="flex items-center justify-between gap-3">
      <Kicker award={award} />
      <span className="font-wide text-sm font-semibold text-graphite">{award.badge}</span>
    </div>
    <h4 className="font-wide text-[1.2rem] leading-[1.05] font-semibold uppercase">
      <MaskRise delay={index * 0.08}>{award.title}</MaskRise>
    </h4>
    {award.text ? (
      <Reveal as="p" delay={0.1 + index * 0.08} className="font-glyph text-[0.95rem] leading-relaxed text-graphite">
        {award.text}
      </Reveal>
    ) : null}
  </article>
);

export const Recognition = ({ recognition }: { recognition: Recognition }) => {
  const { awards, quotes } = recognition;
  // The lead story: the first award with a year (the most specific), else the first.
  const leadIndex = Math.max(
    0,
    awards.findIndex((award) => award.year),
  );
  const lead = awards[leadIndex];
  const others = awards.filter((_, index) => index !== leadIndex);

  return (
    <Section id="recognition">
      <SectionHeader header={recognition.header} />

      {awards.length > 0 ? (
        <>
          {/* Masthead. */}
          <Rule thick />
          <div className="flex items-center justify-between gap-4 py-3 font-technical text-micro uppercase">
            <span>{recognition.awardsLabel}</span>
            <span className="text-graphite">{pad(awards.length)}</span>
          </div>
          <Rule delay={0.1} />

          {lead ? <LeadStory award={lead} /> : null}

          {others.length > 0 ? (
            <>
              <Rule />
              <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                {others.map((award, index) => (
                  <Column key={`${award.title}-${index}`} award={award} index={index} />
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {quotes.length > 0 ? (
        <div className="mt-[clamp(3rem,8svh,5rem)]">
          <Rule thick />
          <span className="block py-3 font-technical text-micro text-graphite uppercase">
            {recognition.quotesLabel}
          </span>
          <Rule />
          <div className="grid gap-10 py-[clamp(2rem,6svh,3.5rem)] lg:grid-cols-2 lg:gap-16">
            {quotes.map((quote, index) => (
              <figure key={index} className="relative flex flex-col gap-4 lg:pl-14">
                <span
                  aria-hidden
                  className="font-wide text-[5rem] leading-[0.6] text-signal lg:absolute lg:top-1 lg:left-0"
                >
                  “
                </span>
                <blockquote className="font-wide text-[clamp(1.4rem,2.4vw,2.2rem)] leading-[1.1] font-semibold tracking-[-0.01em] text-balance uppercase">
                  <MaskRise delay={index * 0.12}>{quote.quote}</MaskRise>
                </blockquote>
                <figcaption className="font-technical text-micro text-graphite uppercase">— {quote.source}</figcaption>
              </figure>
            ))}
          </div>
          <Rule />
        </div>
      ) : null}
    </Section>
  );
};
