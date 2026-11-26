"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { MaskRise, Reveal, Section, SectionHeader } from "./section-kit";

/*
 * Skills (docs/screens/HOME_BUSINESS.md §6.4), editorial: no cards. Each
 * group is a row on a hairline. On the left, held in place while its row
 * passes (large screens), the group's number, title, note and tool count. On
 * the right the tools as one flowing line of huge type separated by signal
 * slashes: core tools in solid ink, the others in outline. The words rise
 * through their masks one after another as the row comes in; hovering a word
 * turns it signal.
 */

type Skills = HomeContent["skills"];
type Group = Skills["groups"][number];

const WORD_STAGGER_S = 0.035;

const pad = (value: number) => String(value).padStart(2, "0");

const GroupRow = ({ group, index }: { group: Group; index: number }) => (
  <article className="relative grid gap-6 py-[clamp(2.5rem,7svh,4.5rem)] lg:grid-cols-12 lg:gap-10">
    <motion.span
      aria-hidden
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease: EASE_PRINT }}
      className="absolute inset-x-0 top-0 h-px origin-left bg-ink/20"
    />
    <div className="flex flex-col gap-3 self-start lg:sticky lg:top-28 lg:col-span-4">
      <span className={cn("font-technical text-micro uppercase", group.dark ? "text-signal" : "text-graphite")}>
        {group.index} — {pad(group.skills.length)} tools
      </span>
      <h3
        className={cn(
          "font-wide text-[clamp(1.6rem,2.8vw,2.6rem)] leading-[0.95] font-semibold tracking-[-0.01em] uppercase",
          group.dark && "text-signal",
        )}
      >
        <MaskRise delay={index * 0.04}>{group.title}</MaskRise>
      </h3>
      {group.note ? (
        <Reveal as="p" delay={0.1} className="max-w-[34ch] font-glyph text-[0.95rem] text-graphite">
          {group.note}
        </Reveal>
      ) : null}
    </div>

    <motion.p
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      className="font-wide text-[clamp(1.45rem,3.1vw,3rem)] leading-[1.12] font-semibold tracking-[-0.015em] uppercase lg:col-span-8"
    >
      {group.skills.map((tech, position) => (
        <span key={tech.name} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%" },
              shown: { y: "0%", transition: { delay: position * WORD_STAGGER_S, duration: 0.8, ease: EASE_PRINT } },
            }}
          >
            <span
              className={cn(
                "transition-colors duration-300 hover:text-signal",
                tech.core ? "text-ink" : "text-transparent [-webkit-text-stroke:1.25px_var(--text-primary)]",
              )}
            >
              {tech.name}
            </span>
            {position < group.skills.length - 1 ? (
              <span aria-hidden className="px-[0.3em] text-signal">
                /
              </span>
            ) : null}
          </motion.span>
        </span>
      ))}
    </motion.p>
  </article>
);

export const Skills = ({ skills }: { skills: Skills }) => (
  <Section id="skills">
    <SectionHeader header={skills.header} />
    <Reveal y={0} className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-2 font-technical text-micro uppercase">
      <span className="flex items-center gap-2">
        <span aria-hidden className="font-wide text-base leading-none font-semibold">
          Aa
        </span>
        {skills.legend.core}
      </span>
      <span className="flex items-center gap-2 text-graphite">
        <span
          aria-hidden
          className="font-wide text-base leading-none font-semibold text-transparent [-webkit-text-stroke:1px_var(--text-primary)]"
        >
          Aa
        </span>
        {skills.legend.other}
      </span>
      <span className="text-graphite sm:ml-auto">{skills.legend.summary}</span>
    </Reveal>
    <div className="relative border-b border-ink/20">
      {skills.groups.map((group, index) => (
        <GroupRow key={`${group.title}-${index}`} group={group} index={index} />
      ))}
    </div>
  </Section>
);
