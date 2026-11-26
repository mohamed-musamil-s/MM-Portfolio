"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { Reveal, Section, SectionHeader } from "./section-kit";

/*
 * Selected work (docs/screens/HOME_BUSINESS.md §6.5): a deck of case cards.
 * On large screens each card pins and the next one slides up over it; the
 * cards underneath settle back (smaller, dimmed) so the deck reads as a
 * stack, and each image zooms out of a close crop as its card arrives. On
 * phones, and with reduced motion, the same cards simply follow each other.
 */

type Work = HomeContent["work"];
type Project = Work["projects"][number];

/** Card colours, alternating down the deck. */
const TONES = [
  {
    card: "border-paper/10 bg-ink text-paper",
    muted: "text-paper/60",
    chip: "border-paper/20",
    ghost: "[-webkit-text-stroke:1.5px_var(--signal)]",
  },
  {
    card: "border-ink/10 bg-newsprint text-ink",
    muted: "text-graphite",
    chip: "border-ink/15",
    ghost: "[-webkit-text-stroke:1.5px_var(--text-primary)]",
  },
] as const;

/** How much smaller each card underneath ends up, per card above it. */
const SETTLE_STEP = 0.045;
/** Space between the stacked cards' top edges. */
const STACK_OFFSET_REM = 1.5;

type CardProps = {
  project: Project;
  index: number;
  total: number;
  /** The deck's scroll progress; drives the settle-back of cards underneath. */
  deck: MotionValue<number>;
  stacked: boolean;
};

const CaseCard = ({ project, index, total, deck, stacked }: CardProps) => {
  const slot = useRef<HTMLDivElement>(null);
  const tone = TONES[index % TONES.length] ?? TONES[0];
  const last = index === total - 1;

  // As the card arrives the image zooms out of a close crop.
  const { scrollYProgress: arrive } = useScroll({ target: slot, offset: ["start end", "start start"] });
  const imageScale = useTransform(arrive, [0, 1], stacked ? [1.35, 1] : [1, 1]);
  // Once covered, it settles back and dims under the next cards.
  const settle = 1 - (total - 1 - index) * SETTLE_STEP;
  const scale = useTransform(deck, [index / total, 1], stacked ? [1, settle] : [1, 1]);
  const dim = useTransform(deck, [index / total, (index + 1) / total], [0, stacked && !last ? 0.55 : 0]);

  return (
    <div
      ref={slot}
      className={cn(stacked && "sticky top-0 flex h-svh items-start")}
      style={stacked ? { paddingTop: `calc(5.5rem + ${index * STACK_OFFSET_REM}rem)` } : undefined}
    >
      <motion.article
        style={{ scale }}
        className={cn(
          "relative grid w-full origin-top grid-cols-[minmax(0,1fr)] gap-8 overflow-hidden rounded-[2rem] border p-6 sm:p-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12",
          stacked && "h-[min(calc(100svh-12rem),640px)]",
          tone.card,
        )}
      >
        {/* Left: the case. */}
        <div className="relative z-10 flex min-h-0 flex-col gap-6">
          <div className={cn("flex items-center justify-between font-technical text-micro uppercase", tone.muted)}>
            <span>{project.category}</span>
            <span>
              {project.index} / {String(total).padStart(2, "0")}
            </span>
          </div>
          <span
            aria-hidden
            className={cn(
              "font-wide text-[clamp(3.5rem,min(9vw,13svh),8.5rem)] leading-[0.8] font-semibold text-transparent",
              tone.ghost,
            )}
          >
            {project.index}
          </span>
          <h3 className="font-wide text-[clamp(1.4rem,6vw,2.4rem)] leading-[0.95] font-semibold tracking-[-0.02em] [overflow-wrap:anywhere] uppercase lg:text-[clamp(1.9rem,3.4vw,3.4rem)]">
            {project.title}
          </h3>
          <p className={cn("max-w-[46ch] font-glyph text-[1.02rem] leading-relaxed", tone.muted)}>{project.summary}</p>
          <div className="mt-auto flex flex-wrap items-center gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className={cn("rounded-full border px-3 py-1 font-technical text-micro uppercase", tone.chip)}
              >
                {tag}
              </span>
            ))}
            <span className={cn("ml-auto font-technical text-micro uppercase", tone.muted)}>{project.period}</span>
          </div>
        </div>

        {/* Right: the picture, zooming out as the card lands. */}
        <div className="relative aspect-[16/10] min-h-0 overflow-hidden rounded-[1.25rem] lg:aspect-auto">
          <motion.div style={{ scale: imageScale }} className="absolute inset-0">
            <Image
              src={project.image.src}
              alt={project.image.alt}
              fill
              unoptimized
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        </div>

        {/* The dim that falls over a card once the next one covers it. */}
        <motion.span
          aria-hidden
          style={{ opacity: dim }}
          className="pointer-events-none absolute inset-0 z-20 bg-ink"
        />
      </motion.article>
    </div>
  );
};

export const Work = ({ work }: { work: Work }) => {
  const deckRef = useRef<HTMLDivElement>(null);
  const wide = useMediaQuery("(min-width: 1024px)");
  const { reducedMotion } = useMotionTheme();
  const stacked = wide && !reducedMotion;
  const { scrollYProgress: deck } = useScroll({ target: deckRef, offset: ["start start", "end end"] });
  const total = work.projects.length;

  return (
    <Section id="work">
      <SectionHeader header={work.header} />
      <div ref={deckRef} className={cn("relative", !stacked && "flex flex-col gap-6")}>
        {work.projects.map((project, index) =>
          stacked ? (
            <CaseCard key={project.index} project={project} index={index} total={total} deck={deck} stacked />
          ) : (
            <Reveal key={project.index} delay={0.05}>
              <CaseCard project={project} index={index} total={total} deck={deck} stacked={false} />
            </Reveal>
          ),
        )}
      </div>
      {work.note ? (
        <Reveal y={0} className="mt-8 font-technical text-micro text-graphite uppercase">
          {work.note}
        </Reveal>
      ) : null}
    </Section>
  );
};
