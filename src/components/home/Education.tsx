"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { Section, SectionHeader } from "./section-kit";

/*
 * Education (docs/screens/HOME_BUSINESS.md §6.3), a year odometer split.
 * Large screens: on the left a giant sticky year that rolls digit by digit
 * like an odometer; on the right the qualifications as cards, oldest first.
 * The card nearest the middle of the screen is in focus (ink), and the
 * odometer rolls to its years. Phones: the cards stacked, each showing its
 * own years large.
 */

type Education = HomeContent["education"];
type Item = Education["items"][number];

const ROLL = { type: "spring", stiffness: 80, damping: 17, mass: 1 } as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** The four-digit years in a range ("2018 — 2021" → ["2018", "2021"]). */
const yearsOf = (range: string) => range.match(/\d{4}/g) ?? [];

/** One odometer wheel: the digits 0–9 stacked, rolled so the value shows. */
const Wheel = ({ digit, delay }: { digit: number; delay: number }) => (
  <span className="relative inline-block h-[1em] overflow-hidden">
    <motion.span
      className="flex flex-col"
      initial={false}
      animate={{ y: `${-digit}em` }}
      transition={{ ...ROLL, delay }}
    >
      {Array.from({ length: 10 }, (_, value) => (
        <span key={value} className="block h-[1em] leading-none">
          {value}
        </span>
      ))}
    </motion.span>
  </span>
);

/** A year on wheels; each wheel starts a beat after the one to its right, like a real counter. */
const Odometer = ({ value, className }: { value: string; className?: string }) => {
  const characters = Array.from(value);
  return (
    <span aria-label={value} className={cn("inline-flex leading-none tabular-nums", className)}>
      {characters.map((character, index) => {
        const digit = Number.parseInt(character, 10);
        return Number.isNaN(digit) ? (
          <span key={index} aria-hidden>
            {character}
          </span>
        ) : (
          <span key={index} aria-hidden>
            <Wheel digit={digit} delay={(characters.length - 1 - index) * 0.06} />
          </span>
        );
      })}
    </span>
  );
};

/** Index of the card whose centre is nearest the middle of the screen, from the scroll position. */
const useFocusedCard = (count: number) => {
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const [focused, setFocused] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      cards.current.slice(0, count).forEach((card, index) => {
        if (!card) return;
        const box = card.getBoundingClientRect();
        const distance = Math.abs(box.top + box.height / 2 - middle);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      setFocused(best);
    };
    const onScroll = () => {
      frame ||= window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count]);
  return { cards, focused };
};

const Card = ({
  item,
  index,
  total,
  focused,
  register,
}: {
  item: Item;
  index: number;
  total: number;
  focused: boolean;
  register: (element: HTMLLIElement | null) => void;
}) => (
  <motion.li
    ref={register}
    initial={{ opacity: 0, x: 60 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    transition={{ duration: 0.9, ease: EASE_PRINT }}
    className={cn(
      "relative flex min-h-[clamp(20rem,46svh,28rem)] flex-col gap-5 overflow-hidden rounded-[2rem] border p-7 transition-colors duration-700 ease-print sm:p-9",
      focused ? "border-ink bg-ink text-paper" : "border-ink/10 bg-paper text-ink",
    )}
  >
    <div
      className={cn(
        "flex items-center justify-between font-technical text-micro uppercase transition-colors duration-700",
        focused ? "text-paper/60" : "text-graphite",
      )}
    >
      <span>
        {pad(index + 1)} / {pad(total)}
      </span>
      <span>{item.year}</span>
    </div>
    {/* Phones: the years large on the card itself (large screens have the odometer). */}
    <span className="font-wide text-[clamp(2.6rem,12vw,4rem)] leading-none font-semibold text-transparent tabular-nums [-webkit-text-stroke:1.5px_var(--signal)] lg:hidden">
      {item.year}
    </span>
    <span
      className={cn(
        "mt-auto grid size-16 place-items-center rounded-full font-wide text-base font-semibold transition-colors duration-700",
        focused ? "bg-signal text-paper" : "border-2 border-signal text-signal",
      )}
    >
      {item.badge}
    </span>
    <span className="font-wide text-[clamp(1.5rem,2.6vw,2.4rem)] leading-[1] font-semibold tracking-[-0.01em] uppercase">
      {item.title}
    </span>
    <span
      className={cn(
        "font-glyph text-[1rem] transition-colors duration-700",
        focused ? "text-paper/70" : "text-graphite",
      )}
    >
      {item.org}
    </span>
  </motion.li>
);

export const Education = ({ education }: { education: Education }) => {
  // Oldest first, so the odometer counts forward.
  const items = [...education.items].sort((a, b) => Number(yearsOf(a.year)[0] ?? 0) - Number(yearsOf(b.year)[0] ?? 0));
  const { cards, focused } = useFocusedCard(items.length);
  const current = items[focused] ?? items[0];
  const [start, end] = current ? yearsOf(current.year) : [];

  return (
    <Section id="education">
      <SectionHeader header={education.header} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        {/* The odometer, held while the cards pass. */}
        <div className="hidden lg:block">
          <div className="sticky top-[24svh] flex flex-col gap-4">
            {start ? (
              <Odometer
                value={start}
                className="font-wide text-[clamp(6rem,14vw,13rem)] font-semibold tracking-[-0.04em]"
              />
            ) : (
              <span className="font-wide text-[clamp(3rem,7vw,6rem)] leading-none font-semibold uppercase">
                {current?.year}
              </span>
            )}
            {end ? (
              <span className="flex items-center gap-4 font-wide text-[clamp(2rem,4.4vw,4rem)] leading-none font-semibold text-transparent [-webkit-text-stroke:1.5px_var(--text-primary)]">
                <span aria-hidden className="h-[0.08em] w-[1.2em] bg-signal" />
                <Odometer value={end} />
              </span>
            ) : null}
            <div className="relative mt-4 h-6 overflow-hidden font-technical text-micro text-graphite uppercase">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={focused}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE_PRINT }}
                  className="absolute inset-0"
                >
                  {current?.badge} · {current?.org}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <ol className="flex flex-col gap-6 lg:gap-[22svh] lg:py-[16svh]">
          {items.map((item, index) => (
            <Card
              key={`${item.title}-${index}`}
              item={item}
              index={index}
              total={items.length}
              focused={index === focused}
              register={(element) => {
                cards.current[index] = element;
              }}
            />
          ))}
        </ol>
      </div>
    </Section>
  );
};
