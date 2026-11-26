"use client";

import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { Reveal, Section, SectionHeader, TechChip } from "./section-kit";

/*
 * Skills (docs/screens/HOME_BUSINESS.md §6.3): a bento grid of skill groups
 * that assembles from alternating sides as it enters. One dark module; wide
 * groups span two columns. Core skills carry a signal ring (the legend says so).
 */

type Skills = HomeContent["skills"];

export const Skills = ({ skills }: { skills: Skills }) => (
  <Section id="skills">
    <SectionHeader header={skills.header} />
    <Reveal y={0} className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-technical text-micro uppercase">
      <span className="flex items-center gap-2">
        <span aria-hidden className="size-3 rounded-full border border-signal" />
        {skills.legend.core}
      </span>
      <span className="flex items-center gap-2 text-graphite">
        <span aria-hidden className="size-3 rounded-full border border-ink/20" />
        {skills.legend.other}
      </span>
      <span className="text-graphite sm:ml-auto">{skills.legend.summary}</span>
    </Reveal>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {skills.groups.map((group, index) => (
        <Reveal
          key={`${group.title}-${index}`}
          as="article"
          delay={(index % 4) * 0.08}
          x={index % 2 === 0 ? -40 : 40}
          y={24}
          className={cn(
            "flex flex-col gap-5 rounded-[1.75rem] border p-6 sm:p-8",
            group.wide && "md:col-span-2",
            group.dark ? "border-ink bg-ink text-paper" : "border-ink/10 bg-paper",
          )}
        >
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-wide text-xl leading-tight font-semibold uppercase sm:text-2xl">{group.title}</h3>
            <span className={cn("font-technical text-micro", group.dark ? "text-signal" : "text-graphite")}>
              {group.index}
            </span>
          </div>
          {group.note ? (
            <p className={cn("max-w-[48ch] font-glyph text-[0.95rem]", group.dark ? "text-paper/70" : "text-graphite")}>
              {group.note}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap gap-2">
            {group.skills.map((tech) => (
              <TechChip key={tech.name} tech={tech} dark={group.dark} />
            ))}
          </div>
        </Reveal>
      ))}
    </div>
  </Section>
);
