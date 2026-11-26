"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { Reveal, Section, SectionHeader } from "./section-kit";

/*
 * Recognition (docs/screens/HOME_BUSINESS.md §6.5).
 * Awards: medals hanging on ribbons. They drop in and swing to rest like
 * pendulums, one after another; hover, focus or a tap flips a medal like a
 * coin to show what it was for. Education: diploma cards, each with a seal
 * whose ring of text turns slowly. Kind words: one quote at a time, massive,
 * its words rising in; it moves on by itself (paused on hover or focus, never
 * with reduced motion), with a progress line, a counter and prev / next.
 */

type Recognition = HomeContent["recognition"];
type Award = Recognition["awards"][number];
type School = Recognition["education"][number];
type Quote = Recognition["quotes"][number];

const QUOTE_MS = 7000;
const SWING = { type: "spring", stiffness: 60, damping: 6, mass: 1.1 } as const;
const FLIP = { type: "spring", stiffness: 180, damping: 20 } as const;

const pad = (value: number) => String(value).padStart(2, "0");

const Label = ({ children }: { children: string }) => (
  <Reveal y={0} className="mb-8 flex items-center gap-3 font-technical text-micro text-graphite uppercase">
    <span aria-hidden className="h-px w-8 bg-signal" />
    {children}
  </Reveal>
);

/** A medal on its ribbon: swings in, flips like a coin. */
const Medal = ({ award, index }: { award: Award; index: number }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <motion.li
      initial={{ rotate: index % 2 === 0 ? -32 : 32, y: -140, opacity: 0 }}
      whileInView={{ rotate: 0, y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ rotate: { ...SWING, delay: index * 0.12 }, default: { duration: 0.6, delay: index * 0.12 } }}
      style={{ originY: 0 }}
      className="flex flex-col items-center gap-5 text-center"
    >
      {/* The ribbon: two bands meeting at the medal. */}
      <span aria-hidden className="relative -mb-7 flex h-24 w-20 justify-center">
        <span className="absolute top-0 left-1 h-full w-7 origin-top -skew-x-[14deg] bg-signal" />
        <span className="absolute top-0 right-1 h-full w-7 origin-top skew-x-[14deg] bg-ink" />
      </span>
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={`${award.title}: ${flipped ? "hide" : "show"} details`}
        onClick={() => setFlipped((value) => !value)}
        onPointerEnter={(event) => event.pointerType === "mouse" && setFlipped(true)}
        onPointerLeave={(event) => event.pointerType === "mouse" && setFlipped(false)}
        onFocus={() => setFlipped(true)}
        onBlur={() => setFlipped(false)}
        className="relative size-36 rounded-full [perspective:900px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal sm:size-44"
      >
        <motion.span
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={FLIP}
          className="relative block size-full [transform-style:preserve-3d]"
        >
          {/* Front: the badge, struck on a disc with a notched signal ring. */}
          <span className="absolute inset-0 grid place-items-center rounded-full border border-ink/15 bg-[radial-gradient(circle_at_32%_26%,var(--bg-primary),color-mix(in_srgb,var(--signal)_16%,var(--bg-primary)))] shadow-[inset_0_-10px_22px_rgb(0_0_0/0.12),0_28px_44px_-26px_rgb(0_0_0/0.55)] [backface-visibility:hidden]">
            <span aria-hidden className="absolute inset-3 rounded-full border-2 border-dashed border-signal/70" />
            <span className="flex flex-col items-center gap-1">
              <span className="font-wide text-[2.6rem] leading-none font-semibold text-ink sm:text-[3.2rem]">
                {award.badge}
              </span>
              <span className="font-technical text-[0.6rem] text-graphite uppercase">{award.year || award.org}</span>
            </span>
          </span>
          {/* Back: what it was for. */}
          <span className="absolute inset-0 grid [transform:rotateY(180deg)] place-items-center rounded-full bg-ink p-6 text-paper [backface-visibility:hidden]">
            <span className="font-glyph text-[0.72rem] leading-snug sm:text-[0.8rem]">{award.text || award.org}</span>
          </span>
        </motion.span>
      </button>
      <span className="flex max-w-[16rem] flex-col gap-1">
        <span className="font-wide text-[0.95rem] leading-tight font-semibold uppercase">{award.title}</span>
        <span className="font-technical text-micro text-graphite uppercase">{award.org}</span>
      </span>
    </motion.li>
  );
};

/** A seal: the school and years on a slowly turning ring, the badge in the middle. */
const Seal = ({ school, index }: { school: School; index: number }) => {
  const id = `seal-path-${index}`;
  const ring = `${school.org} • ${school.year} • `;
  return (
    <span aria-hidden className="relative grid size-28 shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full motion-safe:animate-[spin_24s_linear_infinite]">
        <defs>
          <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current font-technical text-[7.2px] uppercase" letterSpacing="1.2">
          <textPath href={`#${id}`} textLength="236">
            {ring}
          </textPath>
        </text>
      </svg>
      <span className="grid size-14 place-items-center rounded-full bg-signal font-wide text-sm font-semibold text-paper">
        {school.badge}
      </span>
    </span>
  );
};

const Diploma = ({ school, index }: { school: School; index: number }) => (
  <motion.article
    initial={{ opacity: 0, rotateX: -40, y: 40 }}
    whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
    viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    transition={{ duration: 0.9, delay: index * 0.12, ease: EASE_PRINT }}
    className="relative flex origin-top items-center gap-6 overflow-hidden rounded-[1.75rem] border border-ink/12 bg-paper p-6 sm:p-7"
  >
    <Seal school={school} index={index} />
    <span className="flex min-w-0 flex-col gap-2">
      <span className="font-technical text-micro text-signal uppercase">{school.year}</span>
      <span className="font-wide text-[1.15rem] leading-tight font-semibold uppercase">{school.title}</span>
      <span className="font-glyph text-[0.95rem] text-graphite">{school.org}</span>
    </span>
    {/* The badge, giant and outlined, along the card's edge. */}
    <span
      aria-hidden
      className="pointer-events-none absolute -right-3 -bottom-8 font-wide text-[7rem] leading-none font-semibold text-transparent [-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--text-primary)_10%,transparent)]"
    >
      {school.badge}
    </span>
  </motion.article>
);

/** One quote at a time, its words rising in; moves on by itself unless paused. */
const Quotes = ({ label, quotes }: { label: string; quotes: Quote[] }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const { reducedMotion } = useMotionTheme();
  const auto = !paused && !reducedMotion && quotes.length > 1;

  useEffect(() => {
    if (!auto) {
      return;
    }
    const timer = window.setTimeout(() => setCurrent((value) => (value + 1) % quotes.length), QUOTE_MS);
    return () => window.clearTimeout(timer);
  }, [auto, current, quotes.length]);

  const go = (step: number) => setCurrent((value) => (value + step + quotes.length) % quotes.length);
  const quote = quotes[current] ?? quotes[0];
  if (!quote) {
    return null;
  }

  return (
    <motion.section
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: EASE_PRINT }}
      className="relative flex min-h-[26rem] flex-col gap-8 overflow-hidden rounded-[2rem] bg-ink p-7 text-paper sm:p-10"
    >
      <div className="flex items-center justify-between font-technical text-micro text-paper/55 uppercase">
        <span>{label}</span>
        <span className="tabular-nums">
          {pad(current + 1)} / {pad(quotes.length)}
        </span>
      </div>
      <span aria-hidden className="-mb-6 font-wide text-[6rem] leading-[0.6] text-signal">
        “
      </span>
      <AnimatePresence mode="wait">
        <motion.figure key={current} exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }} className="flex-1">
          <blockquote className="font-wide text-[clamp(1.5rem,2.6vw,2.5rem)] leading-[1.08] font-semibold tracking-[-0.01em] uppercase">
            {quote.quote.split(" ").map((word, index) => (
              <span key={`${word}-${index}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ delay: index * 0.035, duration: 0.7, ease: EASE_PRINT }}
                >
                  {word}&nbsp;
                </motion.span>
              </span>
            ))}
          </blockquote>
          <figcaption className="mt-6 font-technical text-micro text-paper/55 uppercase">— {quote.source}</figcaption>
        </motion.figure>
      </AnimatePresence>
      {quotes.length > 1 ? (
        <div className="flex items-center gap-4">
          <span className="relative h-px flex-1 overflow-hidden bg-paper/15">
            <motion.span
              key={`${current}-${auto}`}
              className="absolute inset-y-0 left-0 bg-signal"
              initial={{ width: "0%" }}
              animate={{ width: auto ? "100%" : "0%" }}
              transition={{ duration: auto ? QUOTE_MS / 1000 : 0, ease: "linear" }}
            />
          </span>
          {[
            { step: -1, label: "Previous quote", icon: "←" },
            { step: 1, label: "Next quote", icon: "→" },
          ].map((control) => (
            <button
              key={control.label}
              type="button"
              aria-label={control.label}
              onClick={() => go(control.step)}
              className="grid size-11 place-items-center rounded-full border border-paper/20 transition-colors duration-300 hover:border-signal hover:bg-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              {control.icon}
            </button>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
};

export const Recognition = ({ recognition }: { recognition: Recognition }) => (
  <Section id="recognition" className="bg-newsprint/40">
    <SectionHeader header={recognition.header} />

    {recognition.awards.length > 0 ? (
      <>
        <Label>{recognition.awardsLabel}</Label>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-14 sm:grid-cols-3 lg:grid-cols-5">
          {recognition.awards.map((award, index) => (
            <Medal key={`${award.title}-${index}`} award={award} index={index} />
          ))}
        </ul>
      </>
    ) : null}

    <div className="mt-[clamp(4rem,10svh,7rem)] grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
      {recognition.education.length > 0 ? (
        <div>
          <Label>{recognition.educationLabel}</Label>
          <div className="flex flex-col gap-4 [perspective:1200px]">
            {recognition.education.map((school, index) => (
              <Diploma key={`${school.title}-${index}`} school={school} index={index} />
            ))}
          </div>
        </div>
      ) : null}
      {recognition.quotes.length > 0 ? (
        <div className="flex flex-col">
          <Label>{recognition.quotesLabel}</Label>
          <Quotes label={recognition.quotesLabel} quotes={recognition.quotes} />
        </div>
      ) : null}
    </div>
  </Section>
);
