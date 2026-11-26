"use client";

import { motion, useScroll, useTransform, type MotionStyle, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";
import { CropMarks } from "@/components/motion/CropMarks";
import { HalftoneSphere } from "@/components/motion/HalftoneSphere";
import { Marquee } from "@/components/motion/Marquee";
import { RegistrationMark } from "@/components/motion/RegistrationMark";
import { VelocitySkew } from "@/components/motion/VelocitySkew";
import { useIntroReady } from "@/components/splash/splash-state";
import { ActionButton } from "@/components/ui/ActionButton";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";

/*
 * The home hero (docs/screens/HOME_BUSINESS.md §5). A clean two-column stage:
 * the statement, signature, intro and calls to action on the left; a framed
 * halftone sphere with its tags on the right; the facts along the bottom.
 * Nothing overlaps. The section is 200svh with a sticky stage, so scrolling
 * plays a sequence (each layer at its own speed, the stage shrinking into a
 * card on ink); the pointer adds depth; entrances wait for the splash.
 */

type HeroContent = HomeContent["hero"];

const rise = (ready: boolean, delay: number, distance = 28) => ({
  initial: { opacity: 0, y: distance },
  animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
  transition: { delay, duration: 0.9, ease: EASE_PRINT },
});

/** Scroll-driven values for every layer (0 → 1 through the section). */
const useHeroScroll = (progress: MotionValue<number>) => ({
  lines: [
    useTransform(progress, [0, 1], ["0svh", "-6svh"]),
    useTransform(progress, [0, 1], ["0svh", "-10svh"]),
    useTransform(progress, [0, 1], ["0svh", "-14svh"]),
    useTransform(progress, [0, 1], ["0svh", "-18svh"]),
  ],
  left: { y: useTransform(progress, [0, 1], ["0svh", "-8svh"]) },
  details: {
    opacity: useTransform(progress, [0, 0.45], [1, 0]),
    y: useTransform(progress, [0, 0.45], ["0svh", "-6svh"]),
  },
  frame: { y: useTransform(progress, [0, 1], ["0svh", "-14svh"]) },
  sphere: {
    scale: useTransform(progress, [0, 1], [1, 1.35]),
    rotate: useTransform(progress, [0, 1], [0, -24]),
  },
  stage: {
    scale: useTransform(progress, [0.6, 1], [1, 0.9]),
    borderRadius: useTransform(progress, [0.6, 1], [0, 40]),
  },
});

type HeroScroll = ReturnType<typeof useHeroScroll>;

/** Pointer depth wrapper (fine pointers only; still under reduced motion). */
const Depth = ({ depth, className, children }: { depth: number; className?: string; children: ReactNode }) => {
  const { x, y } = usePointerParallax(depth);
  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
};

const Statement = ({
  lines,
  drift,
  ready,
}: {
  lines: readonly string[];
  drift: readonly (MotionValue<string> | undefined)[];
  ready: boolean;
}) => (
  <VelocitySkew>
    <h1
      aria-label={lines.join(" ")}
      className="font-grotesk text-[clamp(3.2rem,min(8.4vw,13.5svh),9.5rem)] leading-[0.86] font-extrabold tracking-tighter uppercase"
    >
      {lines.map((line, index) => (
        <motion.span key={`${line}-${index}`} aria-hidden style={{ y: drift[index] }} className="block">
          <span className="block overflow-hidden pb-[0.05em]">
            <motion.span
              className={cn(
                "block",
                // The middle line is set in outline.
                index === 1 && "text-paper [-webkit-text-stroke:max(1.5px,0.014em)_var(--text-primary)]",
              )}
              initial={{ y: "108%" }}
              animate={{ y: ready ? "0%" : "108%" }}
              transition={{ delay: 0.15 + index * 0.12, duration: 1, ease: EASE_PRINT }}
            >
              {line}
            </motion.span>
          </span>
        </motion.span>
      ))}
    </h1>
  </VelocitySkew>
);

/** The name in brush lettering on its own line, wiped in, with an orange stroke under it. */
const Signature = ({ text, ready }: { text: string; ready: boolean }) => (
  <div className="relative w-fit -rotate-3">
    <motion.p
      initial={{ clipPath: "inset(-25% 100% -25% -5%)" }}
      animate={{ clipPath: ready ? "inset(-25% -5% -25% -5%)" : "inset(-25% 100% -25% -5%)" }}
      transition={{ delay: 0.7, duration: 1.1, ease: EASE_PRINT }}
      className="font-brush text-[clamp(1.75rem,min(3.4vw,5.5svh),3.6rem)] leading-none whitespace-nowrap"
    >
      {text}
    </motion.p>
    <svg viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden className="mt-1 h-3 w-full overflow-visible">
      <motion.path
        d="M2 16 C 90 4, 220 22, 398 8"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-signal"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: ready ? 1 : 0 }}
        transition={{ delay: 1.25, duration: 0.8, ease: EASE_PRINT }}
      />
    </svg>
  </div>
);

/** The right column: a framed halftone sphere, its tags in a neat row underneath. */
const Showcase = ({
  hero,
  ready,
  still,
  scroll,
}: {
  hero: HeroContent;
  ready: boolean;
  still: boolean;
  scroll: HeroScroll;
}) => (
  <motion.div style={still ? undefined : scroll.frame} className="relative hidden flex-col gap-5 lg:flex">
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
      transition={{ delay: 0.35, duration: 1.1, ease: EASE_PRINT }}
      className="relative aspect-square max-h-[52svh] w-full overflow-hidden rounded-[2rem] border border-ink/10 bg-newsprint/60"
    >
      <CropMarks />
      <Depth depth={18} className="absolute inset-[-6%]">
        <motion.div style={still ? undefined : scroll.sphere} className="size-full">
          <HalftoneSphere className="size-full" />
        </motion.div>
      </Depth>
    </motion.div>
    {hero.chips.length > 0 ? (
      <ul className="flex flex-wrap gap-2">
        {hero.chips.map((chip, index) => (
          <motion.li
            key={`${chip}-${index}`}
            {...rise(ready, 1.1 + index * 0.06, 14)}
            className="flex items-center gap-2 rounded-full border border-ink/12 px-3 py-1.5 font-technical text-micro uppercase"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-signal" />
            {chip}
          </motion.li>
        ))}
      </ul>
    ) : null}
  </motion.div>
);

export const Hero = ({ hero }: { hero: HeroContent }) => {
  const ready = useIntroReady();
  const { reducedMotion: still } = useMotionTheme();
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const scroll = useHeroScroll(scrollYProgress);
  const stageStyle: MotionStyle | undefined = still ? undefined : scroll.stage;

  return (
    <>
      <section ref={section} aria-label={hero.eyebrow} className="relative h-[200svh] bg-ink">
        <div className="sticky top-0 h-svh overflow-hidden">
          <motion.div
            style={stageStyle}
            className="relative flex h-full flex-col overflow-hidden bg-paper px-page pt-24 pb-6 sm:pt-28 lg:pb-8"
          >
            {/* Construction grid. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border-ink)_1px,transparent_1px)] bg-size-[calc(100%/12)_100%] opacity-[0.045]"
            />

            <div className="relative grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-[6vw]">
              {/* Left: eyebrow, statement, signature, intro, calls to action. */}
              <motion.div style={still ? undefined : scroll.left} className="flex flex-col gap-[clamp(1rem,3svh,2rem)]">
                <motion.span
                  {...rise(ready, 0.05, 12)}
                  className="flex items-center gap-3 font-technical text-micro uppercase"
                >
                  <RegistrationMark className="size-4" />
                  {hero.eyebrow}
                </motion.span>
                <Statement lines={hero.lines} drift={still ? [] : scroll.lines} ready={ready} />
                <Signature text={hero.signature} ready={ready} />
                <motion.div style={still ? undefined : scroll.details} className="flex flex-col gap-5">
                  <motion.p {...rise(ready, 0.95)} className="max-w-[40rem] text-lead text-pretty text-graphite">
                    {hero.intro}
                  </motion.p>
                  <motion.div {...rise(ready, 1.05)} className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <ActionButton method="navigate" href={hero.primary.href}>
                      {hero.primary.label}
                    </ActionButton>
                    <a
                      href={hero.secondary.href}
                      className="group inline-flex min-h-11 items-center gap-2 text-label font-bold uppercase underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {hero.secondary.label}
                      <span
                        aria-hidden
                        className="transition-transform duration-500 ease-print group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </a>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Right: framed sphere and tags. */}
              <Showcase hero={hero} ready={ready} still={still} scroll={scroll} />
            </div>

            {/* Facts along the bottom. */}
            {hero.meta.length > 0 ? (
              <motion.dl
                style={still ? undefined : scroll.details}
                className="relative mt-6 hidden grid-cols-3 gap-8 border-t border-ink/15 pt-4 sm:grid"
              >
                {hero.meta.map((item, index) => (
                  <motion.div
                    key={`${item.label}-${index}`}
                    {...rise(ready, 1.2 + index * 0.08, 16)}
                    className="flex flex-col gap-1"
                  >
                    <dt className="font-technical text-micro text-graphite uppercase">{item.label}</dt>
                    <dd className="text-label font-bold uppercase">{item.value}</dd>
                  </motion.div>
                ))}
              </motion.dl>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* Velocity marquee band. */}
      <div className="relative z-10 overflow-hidden bg-ink py-6 text-paper sm:py-8">
        <VelocitySkew max={3}>
          <Marquee label={hero.marquee.join(", ")} baseSpeed={2.5}>
            {hero.marquee.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="flex items-center gap-[0.35em] pr-[0.35em] text-[clamp(2.6rem,7vw,6.5rem)] leading-none font-extrabold tracking-tighter uppercase"
              >
                {index % 2 === 1 ? (
                  <span className="text-transparent [-webkit-text-stroke:max(1px,0.012em)_var(--bg-primary)]">
                    {word}
                  </span>
                ) : (
                  word
                )}
                <span aria-hidden className="size-[0.2em] rounded-full bg-signal" />
              </span>
            ))}
          </Marquee>
        </VelocitySkew>
      </div>
    </>
  );
};
