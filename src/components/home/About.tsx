"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { Parallax, Pill, Reveal, ScrollInk, Section, SectionHeader, isExternal } from "./section-kit";

/*
 * About (docs/screens/HOME_BUSINESS.md §6.1), a pinned kinetic story.
 * Large screens: the section pins for a stretch of scroll and plays three
 * acts on one stage. 1) The statement fills the screen and inks in word by
 * word. 2) It clears and the facts arrive as giant rows: numbers count up
 * with the scroll, words wipe in. 3) "The road so far" as a horizontal
 * scrubber: a signal line runs along the stops, each lights up as it is
 * passed and the stop in focus is read out huge above the line. After the
 * pin, the story and the two calls to action follow in the normal flow.
 * Phones and reduced motion: the same content stacked (StaticAbout).
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

const StaticAbout = ({ about }: { about: About }) => (
  <Section id="about">
    <SectionHeader header={about.header} />
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-20">
      <ScrollInk
        text={about.statement}
        className="font-wide text-[clamp(1.8rem,3.6vw,3.4rem)] leading-[1.05] font-semibold tracking-[-0.02em] uppercase"
      />
      <Parallax distance={50} className="flex flex-col gap-6">
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
      </Parallax>
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

/* ---------- The pinned story (large screens) ---------- */

/** Scroll (in svh) the stage stays pinned for. */
const STORY_TRAVEL_SVH = 280;

/** A stretch of the pinned progress (0–1). */
type Window = [number, number];

/** Phase windows on the pinned progress. */
const ACT: {
  statement: { ink: Window; exit: Window };
  facts: { enter: Window; count: Window; exit: Window };
  road: { enter: Window; scrub: Window };
} = {
  statement: { ink: [0.02, 0.32], exit: [0.34, 0.42] },
  facts: { enter: [0.4, 0.48], count: [0.44, 0.62], exit: [0.64, 0.7] },
  road: { enter: [0.68, 0.74], scrub: [0.74, 0.97] },
};

const InkedWord = ({
  word,
  progress,
  range,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
}) => {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return <motion.span style={{ opacity }}>{word} </motion.span>;
};

const Statement = ({ text, progress }: { text: string; progress: MotionValue<number> }) => {
  const words = text.split(" ");
  const [start, end] = ACT.statement.ink;
  const step = (end - start) / words.length;
  const opacity = useTransform(progress, ACT.statement.exit, [1, 0]);
  const y = useTransform(progress, ACT.statement.exit, ["0svh", "-8svh"]);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex items-center">
      <p
        aria-label={text}
        className="max-w-[22ch] font-wide text-[clamp(2.4rem,min(5.4vw,9svh),5.6rem)] leading-[1.02] font-semibold tracking-[-0.02em] uppercase"
      >
        {words.map((word, index) => (
          <InkedWord
            key={`${word}-${index}`}
            word={word}
            progress={progress}
            range={[start + index * step, start + (index + 1) * step]}
          />
        ))}
      </p>
    </motion.div>
  );
};

/** "5+" counts up with the scroll (prefix and suffix in signal); a word wipes in instead. */
const FactValue = ({
  value,
  progress,
  window,
}: {
  value: string;
  progress: MotionValue<number>;
  window: [number, number];
}) => {
  const match = /^([^\d]*)([\d.,]+)(.*)$/.exec(value);
  const target = match ? Number.parseFloat((match[2] ?? "0").replace(/,/g, "")) : 0;
  const count = useTransform(progress, window, [0, target], { clamp: true });
  const shown = useTransform(count, (latest) => Math.round(latest).toString());
  const wipe = useTransform(progress, window, ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  if (!match) {
    return (
      <motion.span style={{ clipPath: wipe }} className="inline-block">
        {value}
      </motion.span>
    );
  }
  return (
    <span>
      <span className="text-signal">{match[1]}</span>
      <motion.span>{shown}</motion.span>
      <span className="text-signal">{match[3]}</span>
    </span>
  );
};

const FactRow = ({
  fact,
  index,
  total,
  progress,
}: {
  fact: About["facts"][number];
  index: number;
  total: number;
  progress: MotionValue<number>;
}) => {
  const [start, end] = ACT.facts.enter;
  const offset = (index / Math.max(1, total)) * (end - start);
  const y = useTransform(progress, [start + offset, end + offset], ["6svh", "0svh"]);
  const opacity = useTransform(progress, [start + offset, end + offset], [0, 1]);
  const [countStart, countEnd] = ACT.facts.count;
  const span = (countEnd - countStart) / Math.max(1, total);
  return (
    <motion.div
      style={{ y, opacity }}
      className="grid grid-cols-[minmax(0,1fr)_minmax(0,22rem)] items-end gap-8 border-t border-ink/15 py-[clamp(0.75rem,2.2svh,1.5rem)]"
    >
      <span
        className={cn(
          "font-wide text-[clamp(3rem,min(7.5vw,13svh),7.5rem)] leading-[0.85] font-semibold tracking-[-0.02em] uppercase",
          fact.highlight && "text-signal",
        )}
      >
        <FactValue
          value={fact.big}
          progress={progress}
          window={[countStart + index * span, countStart + (index + 1) * span]}
        />
      </span>
      <span className="flex flex-col gap-1 pb-2">
        <span className="font-technical text-micro text-graphite uppercase">{fact.label}</span>
        <span className="font-glyph text-[1rem] text-graphite">{fact.value}</span>
      </span>
    </motion.div>
  );
};

const Facts = ({ facts, progress }: { facts: About["facts"]; progress: MotionValue<number> }) => {
  const opacity = useTransform(progress, ACT.facts.exit, [1, 0]);
  const y = useTransform(progress, ACT.facts.exit, ["0svh", "-8svh"]);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center">
      {facts.map((fact, index) => (
        <FactRow key={`${fact.label}-${index}`} fact={fact} index={index} total={facts.length} progress={progress} />
      ))}
    </motion.div>
  );
};

const RoadScrubber = ({
  label,
  timeline,
  progress,
}: {
  label: string;
  timeline: About["timeline"];
  progress: MotionValue<number>;
}) => {
  const last = Math.max(1, timeline.length - 1);
  const opacity = useTransform(progress, ACT.road.enter, [0, 1]);
  const y = useTransform(progress, ACT.road.enter, ["6svh", "0svh"]);
  const scrub = useTransform(progress, ACT.road.scrub, [0, 1], { clamp: true });
  const [focus, setFocus] = useState(0);
  useMotionValueEvent(scrub, "change", (value) => setFocus(Math.round(value * last)));
  const stop = timeline[focus] ?? timeline[0];

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col justify-center gap-[clamp(1.5rem,5svh,3rem)]"
    >
      <span className="font-technical text-micro text-graphite uppercase">{label}</span>
      {/* The stop in focus, read out huge. */}
      <div className="relative h-[clamp(7rem,22svh,12rem)] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {stop ? (
            <motion.div
              key={focus}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.55, ease: EASE_PRINT }}
              className="absolute inset-0 flex items-end gap-8"
            >
              <span
                className={cn(
                  "font-wide text-[clamp(3rem,min(8vw,14svh),8rem)] leading-[0.85] font-semibold tracking-[-0.02em] whitespace-nowrap uppercase",
                  stop.current && "text-signal",
                )}
              >
                {stop.period}
              </span>
              <span className="flex flex-col gap-1 pb-2">
                <span className="text-label font-bold">{stop.title}</span>
                <span className="font-technical text-micro text-graphite uppercase">{stop.org}</span>
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      {/* The road: a hairline, the signal line running along it, the stops lighting up as they are passed. */}
      <div className="relative pt-2">
        <span aria-hidden className="absolute top-[13px] right-0 left-0 h-px bg-ink/15" />
        <motion.span
          aria-hidden
          style={{ scaleX: scrub }}
          className="absolute top-[12px] right-0 left-0 h-[3px] origin-left rounded-full bg-signal"
        />
        <ol className="relative flex justify-between">
          {timeline.map((item, index) => (
            <li key={`${item.title}-${index}`} className="flex w-0 flex-col items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  "size-3.5 rounded-full border-2 transition-colors duration-300",
                  index <= focus ? "border-signal bg-signal" : "border-ink bg-paper",
                )}
              />
              <span
                className={cn(
                  "font-technical text-micro whitespace-nowrap uppercase transition-colors duration-300",
                  index === focus ? "text-ink" : "text-graphite",
                )}
              >
                {item.period}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
};

const PinnedAbout = ({ about }: { about: About }) => {
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  return (
    <section id="about" className="relative scroll-mt-20 bg-paper">
      <div ref={track} className="relative" style={{ height: `${100 + STORY_TRAVEL_SVH}svh` }}>
        <div className="sticky top-0 flex h-svh flex-col overflow-clip px-page pt-[clamp(1.25rem,3svh,2rem)] pb-[clamp(1.5rem,5svh,3rem)]">
          <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col">
            <SectionHeader header={about.header} compact />
            <div className="relative flex-1">
              <Statement text={about.statement} progress={scrollYProgress} />
              {about.facts.length > 0 ? <Facts facts={about.facts} progress={scrollYProgress} /> : null}
              {about.timeline.length > 0 ? (
                <RoadScrubber label={about.timelineLabel} timeline={about.timeline} progress={scrollYProgress} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {/* After the pin: the story and the way in. */}
      <div className="px-page pt-[clamp(2rem,6svh,4rem)] pb-[clamp(4.5rem,12svh,8rem)]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 lg:grid-cols-2 lg:gap-20">
          {about.paragraphs.map((paragraph, index) => (
            <Reveal key={index} as="p" delay={index * 0.1} className="font-glyph text-lead text-pretty text-graphite">
              {paragraph}
            </Reveal>
          ))}
          <Reveal delay={0.2} className="flex flex-wrap gap-3 lg:col-span-2">
            <Pill href={about.primary.href} tone="ink" icon="↓" external={isExternal(about.primary.href)}>
              {about.primary.label}
            </Pill>
            <Pill href={about.secondary.href} tone="line" icon="↗" external={isExternal(about.secondary.href)}>
              {about.secondary.label}
            </Pill>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export const About = ({ about }: { about: About }) => {
  const wide = useMediaQuery("(min-width: 1024px)");
  const { reducedMotion } = useMotionTheme();
  return wide && !reducedMotion ? <PinnedAbout about={about} /> : <StaticAbout about={about} />;
};
