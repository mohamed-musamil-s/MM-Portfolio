"use client";

import { motion, useScroll, useTransform, type MotionStyle, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";
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
import { MONOGRAM_LETTERS, MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";
import { EASE_PRINT } from "@/lib/motion/tokens";

/*
 * The home hero (docs/screens/HOME_BUSINESS.md §5): a 220svh section with a
 * sticky stage. Scroll progress through the section drives every layer at its
 * own speed (statement lines slide apart, the sphere swells and rises, the
 * signature lifts and tilts, the stage shrinks into a card on ink); the
 * pointer adds depth; entrances wait for the name splash to start leaving.
 */

type HeroContent = HomeContent["hero"];
type Enter = { from: Record<string, number | string>; to: Record<string, number | string> };

const ENTER_SECONDS = 1.1;
const FADE_UP: Enter = { from: { opacity: 0, y: 40 }, to: { opacity: 1, y: 0 } };

/**
 * A depth layer. Three nested wrappers so the three motions never fight over
 * one transform: scroll (outer), pointer depth (middle), entrance (inner).
 */
const Layer = ({
  className,
  scroll,
  depth = 0,
  enter = FADE_UP,
  delay = 0,
  children,
}: {
  className?: string;
  scroll?: MotionStyle;
  depth?: number;
  enter?: Enter;
  delay?: number;
  children: ReactNode;
}) => {
  const ready = useIntroReady();
  const pointer = usePointerParallax(depth);
  return (
    <motion.div aria-hidden className={cn("pointer-events-none", className)} style={scroll}>
      <motion.div className="size-full" style={{ x: pointer.x, y: pointer.y }}>
        <motion.div
          className="size-full"
          initial={enter.from}
          animate={ready ? enter.to : enter.from}
          transition={{ delay, duration: ENTER_SECONDS, ease: EASE_PRINT }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

/** Scroll-driven values for every layer; static under reduced motion. */
const useHeroScroll = (progress: MotionValue<number>) => {
  const lineA = useTransform(progress, [0, 1], ["0vw", "-16vw"]);
  const lineB = useTransform(progress, [0, 1], ["0vw", "14vw"]);
  const lineC = useTransform(progress, [0, 1], ["0vw", "-10vw"]);
  const lineD = useTransform(progress, [0, 1], ["0vw", "8vw"]);
  return {
    lines: [lineA, lineB, lineC, lineD],
    sphere: {
      scale: useTransform(progress, [0, 1], [1, 1.5]),
      y: useTransform(progress, [0, 1], ["0svh", "-16svh"]),
      rotate: useTransform(progress, [0, 1], [0, -18]),
    },
    signature: {
      y: useTransform(progress, [0, 1], ["0svh", "-28svh"]),
      rotate: useTransform(progress, [0, 1], [-7, -15]),
    },
    watermark: { y: useTransform(progress, [0, 1], ["0svh", "24svh"]) },
    chips: [
      { y: useTransform(progress, [0, 1], ["0svh", "-40svh"]) },
      { y: useTransform(progress, [0, 1], ["0svh", "-22svh"]) },
      { y: useTransform(progress, [0, 1], ["0svh", "-55svh"]) },
      { y: useTransform(progress, [0, 1], ["0svh", "-30svh"]) },
      { y: useTransform(progress, [0, 1], ["0svh", "-48svh"]) },
      { y: useTransform(progress, [0, 1], ["0svh", "-18svh"]) },
    ],
    details: {
      opacity: useTransform(progress, [0, 0.4], [1, 0]),
      y: useTransform(progress, [0, 0.4], ["0svh", "-8svh"]),
    },
    stage: {
      scale: useTransform(progress, [0.62, 1], [1, 0.9]),
      borderRadius: useTransform(progress, [0.62, 1], [0, 40]),
    },
  };
};

/** Where the floating chips sit around the sphere (% of the stage). */
const CHIP_SPOTS = [
  "top-[22%] right-[30%]",
  "top-[34%] right-[5%]",
  "top-[56%] right-[18%]",
  "top-[70%] right-[6%]",
  "top-[14%] right-[12%]",
  "top-[46%] right-[32%]",
] as const;
const CHIP_DEPTHS = [18, -26, 30, -14, 22, -30] as const;

const Statement = ({
  lines,
  drift,
  ready,
}: {
  lines: readonly string[];
  drift: readonly (MotionValue<string> | undefined)[];
  ready: boolean;
}) => (
  <VelocitySkew className="relative z-10">
    <h1
      aria-label={lines.join(" ")}
      className="font-grotesk text-[clamp(3.6rem,15.5vw,15rem)] leading-[0.84] font-extrabold tracking-tighter uppercase"
    >
      {lines.map((line, index) => (
        <motion.span
          key={`${line}-${index}`}
          aria-hidden
          style={{ x: drift[index] }}
          className={cn(
            "block",
            index % 3 === 1 && "pl-[10vw]",
            index % 3 === 2 && "text-right",
            // The middle line is set in outline: ink stroke, paper fill (it knocks out the sphere behind it).
            index === 1 && "text-paper [-webkit-text-stroke:max(1.5px,0.012em)_var(--text-primary)]",
          )}
        >
          <span className="block overflow-hidden pb-[0.05em]">
            <motion.span
              className="block"
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

/** Brush lettering across the statement, wiped in left to right, with an orange stroke under it. */
const Signature = ({ text, ready }: { text: string; ready: boolean }) => (
  <div className="relative">
    <motion.p
      initial={{ clipPath: "inset(-20% 100% -20% -5%)" }}
      animate={{ clipPath: ready ? "inset(-20% -5% -20% -5%)" : "inset(-20% 100% -20% -5%)" }}
      transition={{ delay: 0.75, duration: 1.2, ease: EASE_PRINT }}
      className="font-brush text-[clamp(2rem,5.2vw,5.4rem)] leading-none whitespace-nowrap text-ink"
    >
      {text}
    </motion.p>
    <svg
      viewBox="0 0 400 24"
      preserveAspectRatio="none"
      aria-hidden
      className="absolute -bottom-[0.2em] left-[4%] h-[0.35em] w-[92%] overflow-visible text-[clamp(2rem,5.2vw,5.4rem)]"
    >
      <motion.path
        d="M2 16 C 90 4, 220 22, 398 8"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        className="stroke-signal"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: ready ? 1 : 0 }}
        transition={{ delay: 1.35, duration: 0.9, ease: EASE_PRINT }}
      />
    </svg>
  </div>
);

const Details = ({ hero, ready }: { hero: HeroContent; ready: boolean }) => (
  <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ delay: 1, duration: 0.9, ease: EASE_PRINT }}
      className="flex max-w-[36rem] flex-col gap-6"
    >
      <p className="text-lead text-pretty text-graphite">{hero.intro}</p>
      <div className="flex flex-wrap items-center gap-4">
        <ActionButton method="navigate" href={hero.primary.href}>
          {hero.primary.label}
        </ActionButton>
        <a
          href={hero.secondary.href}
          className="group inline-flex min-h-11 items-center gap-2 text-label font-bold uppercase underline-offset-4 hover:underline"
        >
          {hero.secondary.label}
          <span aria-hidden className="transition-transform duration-500 ease-print group-hover:translate-x-1">
            →
          </span>
        </a>
      </div>
    </motion.div>
    {hero.meta.length > 0 ? (
      <dl className="hidden gap-x-8 gap-y-4 sm:grid sm:grid-cols-3">
        {hero.meta.map((item, index) => (
          <motion.div
            key={`${item.label}-${index}`}
            initial={{ opacity: 0, y: 24 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ delay: 1.15 + index * 0.08, duration: 0.8, ease: EASE_PRINT }}
            className="flex min-w-[9rem] flex-col gap-1.5 border-t border-ink/20 pt-3"
          >
            <dt className="font-technical text-micro text-graphite uppercase">{item.label}</dt>
            <dd className="text-label font-bold uppercase">{item.value}</dd>
          </motion.div>
        ))}
      </dl>
    ) : null}
  </div>
);

const ScrollCue = ({ label, ready }: { label: string; ready: boolean }) => (
  <motion.span
    initial={{ opacity: 0 }}
    animate={{ opacity: ready ? 1 : 0 }}
    transition={{ delay: 1.4, duration: 0.8 }}
    className="flex items-center gap-3 font-technical text-micro uppercase"
  >
    {label}
    <span aria-hidden className="relative block h-8 w-px overflow-hidden bg-ink/15">
      <motion.span
        className="absolute inset-x-0 top-0 h-1/2 bg-ink"
        animate={{ y: ["-100%", "200%"] }}
        transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: EASE_PRINT }}
      />
    </span>
  </motion.span>
);

export const Hero = ({ hero }: { hero: HeroContent }) => {
  const ready = useIntroReady();
  const { reducedMotion } = useMotionTheme();
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const scroll = useHeroScroll(scrollYProgress);
  const still = reducedMotion;

  return (
    <>
      <section ref={section} aria-label={hero.eyebrow} className="relative h-[220svh] bg-ink">
        <div className="sticky top-0 h-svh overflow-hidden">
          <motion.div
            style={still ? undefined : scroll.stage}
            className="relative flex h-full flex-col overflow-hidden bg-paper px-page pt-28 pb-8 sm:pt-32 lg:pb-12"
          >
            {/* Construction grid. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border-ink)_1px,transparent_1px)] bg-size-[calc(100%/12)_100%] opacity-[0.05]"
            />

            {/* Giant monogram watermark, drifting slower than the page. */}
            <Layer
              className="absolute -right-[10vw] -bottom-[8vw] w-[78vw] opacity-[0.045]"
              scroll={still ? undefined : scroll.watermark}
              depth={-12}
              enter={{ from: { opacity: 0, y: 60 }, to: { opacity: 1, y: 0 } }}
              delay={0.1}
            >
              <svg viewBox={`0 0 ${MONOGRAM_VIEWBOX.width} ${MONOGRAM_VIEWBOX.height}`} className="block w-full">
                <path d={MONOGRAM_LETTERS} className="fill-ink" />
              </svg>
            </Layer>

            {/* Halftone sphere. */}
            <Layer
              className="absolute top-[14%] -right-[12vw] size-[min(64vw,82svh)] sm:top-[10%] lg:-right-[4vw]"
              scroll={still ? undefined : scroll.sphere}
              depth={24}
              enter={{ from: { opacity: 0, scale: 0.7 }, to: { opacity: 1, scale: 1 } }}
              delay={0.3}
            >
              <HalftoneSphere className="size-full" />
            </Layer>

            {/* Floating chips. */}
            {hero.chips.map((chip, index) => (
              <Layer
                key={`${chip}-${index}`}
                className={cn("absolute z-[5] hidden sm:block", CHIP_SPOTS[index])}
                scroll={still ? undefined : scroll.chips[index]}
                depth={CHIP_DEPTHS[index]}
                enter={{ from: { opacity: 0, scale: 0.6, y: 20 }, to: { opacity: 1, scale: 1, y: 0 } }}
                delay={1.2 + index * 0.1}
              >
                <span className="flex items-center gap-2 rounded-full border border-ink/15 bg-paper/80 px-3.5 py-2 font-technical text-micro whitespace-nowrap uppercase shadow-[0_12px_30px_-16px_rgb(0_0_0/0.35)] backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-signal" />
                  {chip}
                </span>
              </Layer>
            ))}

            {/* Top row. */}
            <div className="relative z-10 flex items-center justify-between">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: 0.1, duration: 0.8, ease: EASE_PRINT }}
                className="flex items-center gap-3 font-technical text-micro uppercase"
              >
                <RegistrationMark className="size-4" />
                {hero.eyebrow}
              </motion.span>
              <span className="hidden sm:block">
                <ScrollCue label={hero.scroll} ready={ready} />
              </span>
            </div>

            {/* The statement, with the signature across it. */}
            <div className="relative z-10 my-auto">
              <Statement lines={hero.lines} drift={still ? [] : scroll.lines} ready={ready} />
              <motion.div
                style={still ? undefined : scroll.signature}
                className="pointer-events-none relative z-20 mt-4 ml-[3%] w-fit sm:absolute sm:top-[60%] sm:left-[38%] sm:mt-0 sm:ml-0"
              >
                <Signature text={hero.signature} ready={ready} />
              </motion.div>
            </div>

            {/* Intro, calls to action, facts. */}
            <motion.div style={still ? undefined : scroll.details} className="relative z-10">
              <Details hero={hero} ready={ready} />
            </motion.div>
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
