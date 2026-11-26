"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { MaskRise, Reveal, Section, SectionHeader } from "./section-kit";

/*
 * Selected work (docs/screens/HOME_BUSINESS.md §6.5), editorial: each project
 * is a spread on a hairline, no cards. A giant outlined number drifts across
 * behind it; the text column holds the category and period, the title huge,
 * the summary and the tags as a slashed line; the illustration has no frame
 * and bleeds off the page edge, wiping open as the spread scrolls in while
 * the picture inside settles from a close crop. Sides alternate.
 */

type Work = HomeContent["work"];
type Project = Work["projects"][number];

const Spread = ({ project, index, total }: { project: Project; index: number; total: number }) => {
  const frame = useRef<HTMLElement>(null);
  const { reducedMotion } = useMotionTheme();
  const flipped = index % 2 === 1;
  const { scrollYProgress: arrive } = useScroll({ target: frame, offset: ["start 90%", "start 30%"] });
  const { scrollYProgress: pass } = useScroll({ target: frame, offset: ["start end", "end start"] });
  const wipe = useTransform(
    arrive,
    [0, 1],
    reducedMotion
      ? ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]
      : flipped
        ? ["inset(0% 0% 0% 100%)", "inset(0% 0% 0% 0%)"]
        : ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"],
  );
  const zoom = useTransform(arrive, [0, 1], reducedMotion ? [1, 1] : [1.25, 1]);
  const drift = useTransform(
    pass,
    [0, 1],
    reducedMotion ? ["0vw", "0vw"] : flipped ? ["-8vw", "8vw"] : ["8vw", "-8vw"],
  );

  return (
    <article
      ref={frame}
      className="relative grid items-center gap-8 py-[clamp(3rem,10svh,6.5rem)] lg:grid-cols-12 lg:gap-12"
    >
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 1.1, ease: EASE_PRINT }}
        className="absolute inset-x-0 top-0 h-px origin-left bg-ink/20"
      />
      {/* The number, giant and outlined, drifting across behind the spread. */}
      <motion.span
        aria-hidden
        style={{ x: drift }}
        className={cn(
          "pointer-events-none absolute top-1/2 -z-10 -translate-y-1/2 font-wide text-[clamp(10rem,26vw,24rem)] leading-none font-semibold text-transparent [-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--text-primary)_10%,transparent)]",
          flipped ? "left-0" : "right-0",
        )}
      >
        {project.index}
      </motion.span>

      <div className={cn("relative flex flex-col gap-5 lg:col-span-6", flipped && "lg:order-2 lg:col-start-7")}>
        <Reveal y={0} className="flex flex-wrap gap-x-4 font-technical text-micro text-graphite uppercase">
          <span className="text-signal">
            {project.index} / {String(total).padStart(2, "0")}
          </span>
          <span>{project.category}</span>
          <span>{project.period}</span>
        </Reveal>
        <h3 className="font-wide text-[clamp(1.8rem,3.2vw,3.4rem)] leading-[0.95] font-semibold tracking-[-0.02em] uppercase">
          <MaskRise>{project.title}</MaskRise>
        </h3>
        <Reveal as="p" delay={0.1} className="max-w-[44ch] font-glyph text-lead text-pretty text-graphite">
          {project.summary}
        </Reveal>
        <Reveal delay={0.18} className="font-technical text-micro uppercase">
          {project.tags.join(" / ")}
        </Reveal>
      </div>

      {/* The illustration, frameless, bleeding off the page edge. */}
      <motion.div
        style={{ clipPath: wipe }}
        className={cn(
          "relative aspect-[16/10] overflow-hidden lg:col-span-6",
          flipped ? "lg:order-1 lg:-ml-[var(--page-margin)]" : "lg:-mr-[var(--page-margin)]",
        )}
      >
        <motion.div style={{ scale: zoom }} className="absolute inset-0">
          <Image
            src={project.image.src}
            alt={project.image.alt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />
        </motion.div>
      </motion.div>
    </article>
  );
};

export const Work = ({ work }: { work: Work }) => (
  <Section id="work" className="isolate">
    <SectionHeader header={work.header} />
    <div className="relative border-b border-ink/20">
      {work.projects.map((project, index) => (
        <Spread key={project.index} project={project} index={index} total={work.projects.length} />
      ))}
    </div>
    {work.note ? (
      <Reveal y={0} className="mt-8 font-technical text-micro text-graphite uppercase">
        {work.note}
      </Reveal>
    ) : null}
  </Section>
);
