"use client";

import { motion, useScroll } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { Pill, Reveal, ScrollInk, Section, SectionHeader, isExternal } from "./section-kit";

/*
 * About (docs/screens/HOME_BUSINESS.md §6.1): the statement inks in word by
 * word as it scrolls; the story and two calls to action beside it; a strip of
 * facts; "the road so far" as a timeline whose signal line draws with the
 * scroll.
 */

type About = HomeContent["about"];

const Road = ({ label, timeline }: { label: string; timeline: About["timeline"] }) => {
  const track = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start 90%", "end 60%"] });
  return (
    <div className="mt-[clamp(3rem,9svh,6rem)] flex flex-col gap-6">
      <Reveal y={0} className="font-technical text-micro text-graphite uppercase">
        {label}
      </Reveal>
      <ol ref={track} className="relative grid gap-8 md:grid-cols-5 md:gap-4">
        {/* The road: a hairline, and the signal line drawing over it with the scroll. */}
        <span aria-hidden className="absolute top-[7px] right-0 left-0 hidden h-px bg-ink/15 md:block" />
        <motion.span
          aria-hidden
          style={{ scaleX: scrollYProgress }}
          className="absolute top-[7px] right-0 left-0 hidden h-px origin-left bg-signal md:block"
        />
        {timeline.map((stop, index) => (
          <Reveal
            key={`${stop.title}-${index}`}
            as="li"
            delay={index * 0.08}
            className="relative flex flex-col gap-2 pl-6 md:pl-0"
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0.5 left-0 size-3.5 rounded-full border-2 md:static",
                stop.current ? "border-signal bg-signal" : "border-ink bg-paper",
              )}
            />
            <span className={cn("font-wide text-xl font-semibold md:mt-3", stop.current && "text-signal")}>
              {stop.period}
            </span>
            <span className="text-label font-bold">{stop.title}</span>
            <span className="font-technical text-micro text-graphite uppercase">{stop.org}</span>
          </Reveal>
        ))}
      </ol>
    </div>
  );
};

export const About = ({ about }: { about: About }) => (
  <Section id="about">
    <SectionHeader header={about.header} />
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-20">
      <ScrollInk
        text={about.statement}
        className="font-wide text-[clamp(1.8rem,3.6vw,3.4rem)] leading-[1.05] font-semibold tracking-[-0.02em] uppercase"
      />
      <div className="flex flex-col gap-6">
        {about.paragraphs.map((paragraph, index) => (
          <Reveal key={index} as="p" delay={index * 0.1} className="font-glyph text-lead text-pretty text-graphite">
            {paragraph}
          </Reveal>
        ))}
        <Reveal delay={0.25} className="flex flex-wrap gap-3">
          <Pill href={about.primary.href} tone="ink" icon="↓" external={isExternal(about.primary.href)}>
            {about.primary.label}
          </Pill>
          <Pill href={about.secondary.href} tone="line" icon="↗" external={isExternal(about.secondary.href)}>
            {about.secondary.label}
          </Pill>
        </Reveal>
      </div>
    </div>

    {about.facts.length > 0 ? (
      <dl className="mt-[clamp(3rem,9svh,6rem)] grid border-t border-ink/15 sm:grid-cols-3">
        {about.facts.map((fact, index) => (
          <Reveal
            key={`${fact.label}-${index}`}
            delay={index * 0.1}
            className={cn(
              "flex flex-col gap-2 py-6 sm:pr-6",
              index > 0 && "border-t border-ink/15 sm:border-t-0 sm:border-l sm:pl-6",
            )}
          >
            <dt className="font-technical text-micro text-graphite uppercase">{fact.label}</dt>
            <dd className="flex flex-col gap-1">
              <span
                className={cn(
                  "font-wide text-[clamp(2rem,4vw,3.4rem)] leading-none font-semibold",
                  fact.highlight && "text-signal",
                )}
              >
                {fact.big}
              </span>
              <span className="font-glyph text-[0.95rem] text-graphite">{fact.value}</span>
            </dd>
          </Reveal>
        ))}
      </dl>
    ) : null}

    {about.timeline.length > 0 ? <Road label={about.timelineLabel} timeline={about.timeline} /> : null}
  </Section>
);
