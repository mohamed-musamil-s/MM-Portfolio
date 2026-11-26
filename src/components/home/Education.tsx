"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { Reveal, Section, SectionHeader } from "./section-kit";

/*
 * Education (docs/screens/HOME_BUSINESS.md §6.3): one full-width row per
 * qualification. The year range is set huge and outlined on its own line and
 * scrubs sideways with the scroll (alternate rows in opposite directions);
 * under it, on the right, sit the badge, the degree and the school. Each row's hairline draws across on the
 * way in; hovering a row fills its years with ink.
 */

type Education = HomeContent["education"];
type Item = Education["items"][number];

/** How far the years travel sideways across a row's pass through the screen. */
const DRIFT_VW = 7;

const Row = ({ item, index }: { item: Item; index: number }) => {
  const row = useRef<HTMLLIElement>(null);
  const { reducedMotion } = useMotionTheme();
  const { scrollYProgress } = useScroll({ target: row, offset: ["start end", "end start"] });
  const direction = index % 2 === 0 ? 1 : -1;
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? ["0vw", "0vw"] : [`${direction * DRIFT_VW}vw`, `${-direction * DRIFT_VW}vw`],
  );

  return (
    <li ref={row} className="group relative py-[clamp(2rem,6svh,3.5rem)]">
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 1.1, delay: index * 0.1, ease: EASE_PRINT }}
        className="absolute inset-x-0 top-0 h-px origin-left bg-ink/20"
      />
      <div className="flex flex-col gap-5">
        <motion.span
          style={{ x }}
          className="block font-wide text-[clamp(2.6rem,9vw,9rem)] leading-[0.85] font-semibold whitespace-nowrap text-transparent tabular-nums transition-colors duration-700 ease-print [-webkit-text-stroke:1.5px_var(--text-primary)] group-hover:text-ink"
        >
          {item.year}
        </motion.span>
        <Reveal delay={0.15 + index * 0.1} className="flex items-start gap-4 sm:max-w-[28rem] sm:self-end">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-signal font-wide text-sm font-semibold text-paper transition-transform duration-500 ease-print group-hover:-rotate-12">
            {item.badge}
          </span>
          <span className="flex min-w-0 flex-col gap-1.5">
            <span className="font-wide text-[1.2rem] leading-tight font-semibold uppercase">{item.title}</span>
            <span className="font-glyph text-[0.95rem] text-graphite">{item.org}</span>
          </span>
        </Reveal>
      </div>
    </li>
  );
};

export const Education = ({ education }: { education: Education }) => (
  <Section id="education">
    <SectionHeader header={education.header} />
    <ol className="relative border-b border-ink/20">
      {education.items.map((item, index) => (
        <Row key={`${item.title}-${index}`} item={item} index={index} />
      ))}
    </ol>
  </Section>
);
