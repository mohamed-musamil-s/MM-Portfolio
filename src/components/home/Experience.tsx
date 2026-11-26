"use client";

import { motion, useScroll } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { StatusDot } from "@/components/motion/StatusDot";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { Bold, Reveal, Section, SectionHeader, TechChip, isExternal } from "./section-kit";

/*
 * Experience (docs/screens/HOME_BUSINESS.md §6.2): the roles down a timeline
 * whose signal line draws with the scroll. Each role: company, period, place
 * and length on the left; title, highlights (key phrases in bold) and the
 * stack on the right. The current role carries a live dot.
 */

type Experience = HomeContent["experience"];
type Role = Experience["roles"][number];

const RoleCard = ({ role, index }: { role: Role; index: number }) => (
  <Reveal
    as="article"
    delay={0.05}
    className="relative grid gap-6 pb-[clamp(3rem,8svh,5rem)] pl-8 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-16 lg:pl-14"
  >
    {/* The stop on the line. */}
    <span
      aria-hidden
      className={cn(
        "absolute top-1.5 left-0 size-3.5 -translate-x-1/2 rounded-full border-2",
        role.current ? "border-signal bg-signal" : "border-ink bg-paper",
      )}
    />
    <div className="flex flex-col gap-3 lg:sticky lg:top-28 lg:self-start">
      <span className="flex items-center gap-2 font-technical text-micro text-graphite uppercase">
        {role.current ? <StatusDot /> : null}
        {role.period}
      </span>
      <div className="flex items-center gap-3">
        {role.logo ? (
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-ink/10 bg-paper p-2">
            <Image src={role.logo} alt="" width={28} height={28} unoptimized className="size-7 object-contain" />
          </span>
        ) : null}
        {role.url ? (
          <a
            href={role.url}
            target={isExternal(role.url) ? "_blank" : undefined}
            rel="noreferrer"
            className="font-wide text-2xl leading-tight font-semibold uppercase underline-offset-4 hover:underline"
          >
            {role.company}
          </a>
        ) : (
          <span className="font-wide text-2xl leading-tight font-semibold uppercase">{role.company}</span>
        )}
      </div>
      <span className="font-technical text-micro text-graphite uppercase">
        {role.location}
        {role.duration ? ` · ${role.duration}` : ""}
      </span>
    </div>
    <div className="flex flex-col gap-5">
      <h3 className="font-wide text-[clamp(1.5rem,2.6vw,2.3rem)] leading-tight font-semibold tracking-[-0.01em] uppercase">
        <span className="mr-3 font-technical text-micro text-signal">{String(index + 1).padStart(2, "0")}</span>
        {role.title}
      </h3>
      <ul className="flex flex-col gap-3">
        {role.highlights.map((highlight, item) => (
          <li key={item} className="flex gap-3 font-glyph text-[1.02rem] leading-relaxed text-graphite">
            <span aria-hidden className="mt-[0.7em] h-px w-4 shrink-0 bg-signal" />
            <span>
              <Bold text={highlight} />
            </span>
          </li>
        ))}
      </ul>
      {role.stack.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {role.stack.map((tech) => (
            <TechChip key={tech.name} tech={tech} />
          ))}
        </div>
      ) : null}
    </div>
  </Reveal>
);

export const Experience = ({ experience }: { experience: Experience }) => {
  const list = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: list, offset: ["start 70%", "end 70%"] });
  return (
    <Section id="experience" className="bg-newsprint/40">
      <SectionHeader header={experience.header} />
      <div ref={list} className="relative">
        <span aria-hidden className="absolute top-2 bottom-0 left-0 w-px bg-ink/15" />
        <motion.span
          aria-hidden
          style={{ scaleY: scrollYProgress }}
          className="absolute top-2 bottom-0 left-0 w-px origin-top bg-signal"
        />
        {experience.roles.map((role, index) => (
          <RoleCard key={`${role.company}-${role.title}`} role={role} index={index} />
        ))}
      </div>
    </Section>
  );
};
