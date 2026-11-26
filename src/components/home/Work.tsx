"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { CropMarks } from "@/components/motion/CropMarks";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { Reveal, SectionHeader } from "./section-kit";

/*
 * Selected work (docs/screens/HOME_BUSINESS.md §6.4). On large screens the
 * section pins and the project cards travel horizontally as the page scrolls
 * (the section is as tall as the track is long). On phones the cards stack.
 */

type Work = HomeContent["work"];
type Project = Work["projects"][number];

const ProjectCard = ({ project }: { project: Project }) => (
  <article className="group flex w-full shrink-0 flex-col gap-4 lg:w-[min(42vw,600px)]">
    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-ink/10 bg-newsprint lg:aspect-auto lg:h-[min(40svh,360px)]">
      <CropMarks />
      <Image
        src={project.image.src}
        alt={project.image.alt}
        fill
        unoptimized
        sizes="(min-width: 1024px) 46vw, 100vw"
        className="object-cover transition-transform duration-700 ease-print group-hover:scale-[1.04]"
      />
      <span className="absolute top-4 left-4 rounded-full bg-paper/85 px-3 py-1 font-technical text-micro uppercase backdrop-blur-sm">
        {project.category}
      </span>
    </div>
    <div className="flex items-start justify-between gap-6">
      <h3 className="font-wide text-[clamp(1.4rem,2.2vw,2rem)] leading-tight font-semibold uppercase">
        <span className="mr-3 font-technical text-micro text-signal">{project.index}</span>
        {project.title}
      </h3>
      <span className="shrink-0 font-technical text-micro text-graphite uppercase">{project.period}</span>
    </div>
    <p className="max-w-[52ch] font-glyph text-[1rem] leading-relaxed text-graphite">{project.summary}</p>
    <ul className="flex flex-wrap gap-2">
      {project.tags.map((tag) => (
        <li key={tag} className="rounded-full border border-ink/12 px-3 py-1 font-technical text-micro uppercase">
          {tag}
        </li>
      ))}
    </ul>
  </article>
);

/** The pinned horizontal track: its travel is measured so the last card ends at the right margin. */
const Track = ({ work }: { work: Work }) => {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.08, 0.95], [0, -travel]);

  useLayoutEffect(() => {
    const frame = track.current;
    const cards = frame?.firstElementChild;
    if (!frame || !(cards instanceof HTMLElement)) {
      return;
    }
    // Re-measured whenever the frame or the cards change size (fonts and images settle after mount).
    const measure = () => setTravel(Math.max(0, cards.scrollWidth - frame.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(cards);
    void document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={section}
      id="work"
      className="relative scroll-mt-20 bg-paper"
      style={{ height: `calc(100svh + ${travel}px)` }}
    >
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden px-page">
        <div className="mx-auto w-full max-w-[1440px]">
          <SectionHeader header={work.header} compact />
          <div ref={track} className="overflow-visible">
            <motion.div style={{ x }} className="flex gap-10">
              {work.projects.map((project) => (
                <ProjectCard key={project.index} project={project} />
              ))}
            </motion.div>
          </div>
          {work.note ? <p className="mt-6 font-technical text-micro text-graphite uppercase">{work.note}</p> : null}
        </div>
      </div>
    </section>
  );
};

export const Work = ({ work }: { work: Work }) => {
  const wide = useMediaQuery("(min-width: 1024px)");
  const { reducedMotion } = useMotionTheme();
  if (wide && !reducedMotion) {
    return <Track work={work} />;
  }
  return (
    <section id="work" className="relative scroll-mt-20 bg-paper px-page py-[clamp(4.5rem,12svh,8rem)]">
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader header={work.header} />
        <div className="flex flex-col gap-14">
          {work.projects.map((project, index) => (
            <Reveal key={project.index} delay={index * 0.05}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
        {work.note ? <p className="mt-8 font-technical text-micro text-graphite uppercase">{work.note}</p> : null}
      </div>
    </section>
  );
};
