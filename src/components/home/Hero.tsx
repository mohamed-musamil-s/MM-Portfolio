"use client";

import { animate, motion, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Marquee } from "@/components/motion/Marquee";
import { StatusDot } from "@/components/motion/StatusDot";
import { VelocitySkew } from "@/components/motion/VelocitySkew";
import { useIntroReady } from "@/components/splash/splash-state";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { Pill } from "./section-kit";

/*
 * The home hero (docs/screens/HOME_BUSINESS.md §5), after the previous
 * portfolio: the name massive in the wide face (second line in outline), the
 * role, the intro and two pill buttons on the left; the ink portrait bleeding
 * off the right edge; a stats rail along the bottom. Entrances wait for the
 * splash.
 *
 * Large screens: a split curtain. The hero is drawn as two doors meeting in
 * the middle (each a copy of the same face, clipped to its half). Scrolling
 * draws a signal seam down the middle, then the doors swing open outwards,
 * turning a little in 3D, while the paper marquee band and About rise into
 * place behind them; the colour never changes. Phones and reduced motion: one
 * plain hero.
 */

type HeroContent = HomeContent["hero"];

const rise = (ready: boolean, delay: number, distance = 28) => ({
  initial: { opacity: 0, y: distance },
  animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
  transition: { delay, duration: 0.9, ease: EASE_PRINT },
});

/** Scroll (in svh) spent opening the doors while the stage is pinned. */
const DOOR_TRAVEL_SVH = 100;
const DOOR_PERSPECTIVE = 1600;
/** How far each door slides out, and how far it turns, when fully open. */
const DOOR_SLIDE_VW = 56;
const DOOR_SWING_DEG = 24;

/** Layer drift inside the face while the doors open. */
const useFaceScroll = (progress: MotionValue<number>) => ({
  lines: [
    useTransform(progress, [0, 1], ["0vw", "-4vw"]),
    useTransform(progress, [0, 1], ["0vw", "4vw"]),
    useTransform(progress, [0, 1], ["0vw", "-2vw"]),
  ],
  portrait: {
    y: useTransform(progress, [0, 1], ["0svh", "-8svh"]),
    scale: useTransform(progress, [0, 1], [1, 1.06]),
  },
});

type FaceScroll = ReturnType<typeof useFaceScroll>;

/* ---------- Pieces ---------- */

/** Counts the number in a stat up from zero on entrance; prefix and suffix are marked in the accent. */
const StatValue = ({ value, ready, delay }: { value: string; ready: boolean; delay: number }) => {
  const match = /^([^\d]*)([\d.,]+)(.*)$/.exec(value);
  const prefix = match?.[1] ?? "";
  const target = match ? Number.parseFloat(match[2].replace(/,/g, "")) : 0;
  const suffix = match?.[3] ?? "";
  const count = useMotionValue(0);
  const [shown, setShown] = useState("0");

  useEffect(() => {
    if (!ready) {
      return;
    }
    const controls = animate(count, target, {
      delay,
      duration: 1.4,
      ease: EASE_PRINT,
      onUpdate: (latest) => setShown(Math.round(latest).toString()),
    });
    return () => controls.stop();
  }, [ready, target, delay, count]);

  if (!match) {
    return <>{value}</>;
  }
  return (
    <>
      <span className="text-signal">{prefix}</span>
      {shown}
      <span className="text-signal">{suffix}</span>
    </>
  );
};

const Name = ({
  lines,
  drift,
  ready,
}: {
  lines: readonly string[];
  drift: readonly (MotionValue<string> | undefined)[];
  ready: boolean;
}) => (
  <h1
    aria-label={lines.join(" ")}
    className="font-wide text-[clamp(2.6rem,min(6.4vw,12.5svh),7.6rem)] leading-[0.95] font-semibold tracking-[-0.02em] uppercase"
  >
    {lines.map((line, index) => (
      <motion.span key={`${line}-${index}`} aria-hidden style={{ x: drift[index] }} className="block">
        <span className="block overflow-hidden pb-[0.04em]">
          <motion.span
            className={cn(
              "block",
              index === 1 && "text-paper [-webkit-text-stroke:max(1.25px,0.012em)_var(--text-primary)]",
            )}
            initial={{ y: "108%" }}
            animate={{ y: ready ? "0%" : "108%" }}
            transition={{ delay: 0.15 + index * 0.12, duration: 1.05, ease: EASE_PRINT }}
          >
            {line}
          </motion.span>
        </span>
      </motion.span>
    ))}
  </h1>
);

const Portrait = ({
  portrait,
  ready,
  style,
}: {
  portrait: HeroContent["portrait"];
  ready: boolean;
  style?: { y: MotionValue<string>; scale: MotionValue<number> };
}) => {
  const { x, y } = usePointerParallax(14);
  return (
    <motion.div style={style} className="relative size-full">
      <motion.div style={{ x, y }} className="relative size-full">
        <motion.div
          initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 1.06 }}
          animate={
            ready ? { clipPath: "inset(0% 0% 0% 0%)", scale: 1 } : { clipPath: "inset(100% 0% 0% 0%)", scale: 1.06 }
          }
          transition={{ delay: 0.35, duration: 1.4, ease: EASE_PRINT }}
          className="relative size-full [mask-image:linear-gradient(to_bottom,#000_78%,transparent)]"
        >
          <Image
            src={portrait.src}
            alt={portrait.alt}
            fill
            priority
            unoptimized
            sizes="50vw"
            className="object-contain object-bottom"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const Stats = ({ stats, ready }: { stats: HeroContent["stats"]; ready: boolean }) =>
  stats.length === 0 ? null : (
    <dl className="grid grid-cols-3 border-t border-ink/15">
      {stats.map((stat, index) => (
        <motion.div
          key={`${stat.label}-${index}`}
          {...rise(ready, 1.15 + index * 0.08, 16)}
          className={cn("flex flex-col gap-2 py-4 pr-4", index > 0 && "border-l border-ink/15 pl-4 sm:pl-6")}
        >
          <dt className="font-technical text-[10px] tracking-[0.14em] text-graphite uppercase sm:text-micro">
            {stat.label}
          </dt>
          <dd className="font-wide text-[clamp(1.4rem,2.6vw,2.4rem)] leading-none font-semibold tabular-nums">
            <StatValue value={stat.value} ready={ready} delay={1.25 + index * 0.1} />
          </dd>
        </motion.div>
      ))}
    </dl>
  );

const Details = ({ hero, ready }: { hero: HeroContent; ready: boolean }) => (
  <div className="flex flex-col gap-6">
    <motion.p
      {...rise(ready, 0.75, 12)}
      className="flex flex-wrap items-center gap-3 font-technical text-micro font-medium uppercase"
    >
      <span className="text-ink">{hero.role}</span>
      <span aria-hidden className="h-px w-14 bg-signal/70" />
      <span className="font-glyph text-graphite">{hero.roleMeta}</span>
    </motion.p>
    <motion.p {...rise(ready, 0.9)} className="max-w-[36rem] font-glyph text-lead text-pretty text-graphite">
      {hero.intro}
    </motion.p>
    <motion.div {...rise(ready, 1.02)} className="flex flex-wrap items-center gap-3">
      <Pill href={hero.primary.href} tone="ink" icon="→">
        {hero.primary.label}
      </Pill>
      <Pill href={hero.secondary.href} tone="line" icon="↗">
        {hero.secondary.label}
      </Pill>
    </motion.div>
  </div>
);

const Frame = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("relative mx-auto w-full max-w-[1440px]", className)}>{children}</div>
);

/* ---------- The face (drawn once, or twice as the doors) ---------- */

const Face = ({ hero, ready, scroll }: { hero: HeroContent; ready: boolean; scroll: FaceScroll | null }) => (
  <div className="relative overflow-hidden bg-paper lg:h-full">
    {/* Depth field: a faint 12-column grid and a soft signal aura. */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border-ink)_1px,transparent_1px)] bg-size-[calc(100%/12)_100%] opacity-[0.045]"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute top-[20%] right-[8%] size-[46vw] rounded-full bg-signal/[0.07] blur-[120px]"
    />

    {/* Portrait, bleeding off the right edge (large screens). */}
    <div className="pointer-events-none absolute top-[9%] right-0 bottom-0 hidden w-[48%] lg:block">
      <Portrait portrait={hero.portrait} ready={ready} style={scroll?.portrait} />
    </div>

    <Frame className="flex flex-col px-page pt-28 pb-6 sm:pt-32 lg:h-full lg:pb-6">
      <div className="flex flex-1 flex-col justify-center gap-[clamp(1.25rem,3.2svh,2.25rem)] lg:max-w-[56%]">
        <motion.span
          {...rise(ready, 0.05, 10)}
          className="flex w-fit items-center gap-2.5 rounded-full border border-ink/12 bg-paper/70 px-3.5 py-2 font-technical text-micro uppercase backdrop-blur-sm"
        >
          <StatusDot />
          {hero.status}
        </motion.span>
        <Name lines={hero.lines} drift={scroll?.lines ?? []} ready={ready} />
        <Details hero={hero} ready={ready} />
      </div>

      {/* Portrait in the flow on phones and tablets. */}
      <div className="relative mt-8 aspect-[1000/1074] w-full max-w-md self-center lg:hidden">
        <Portrait portrait={hero.portrait} ready={ready} />
      </div>

      <div className="relative mt-6 lg:mt-0 lg:max-w-[52%]">
        <Stats stats={hero.stats} ready={ready} />
      </div>
    </Frame>
  </div>
);

/** One door: the face clipped to its half, sliding out and swinging away about its outer edge. */
const Door = ({ side, open, children }: { side: "left" | "right"; open: MotionValue<number>; children: ReactNode }) => {
  const direction = side === "left" ? -1 : 1;
  const x = useTransform(open, [0, 1], ["0vw", `${direction * DOOR_SLIDE_VW}vw`]);
  const rotateY = useTransform(open, [0, 1], [0, -direction * DOOR_SWING_DEG]);
  const shade = useTransform(open, [0, 1], [0, 0.35]);
  return (
    <motion.div
      style={{ x, rotateY, transformPerspective: DOOR_PERSPECTIVE }}
      className={cn(
        "pointer-events-auto absolute inset-0",
        side === "left" ? "origin-left [clip-path:inset(0_50%_0_0)]" : "origin-right [clip-path:inset(0_0_0_50%)]",
      )}
    >
      {children}
      {/* The inner edge darkens as the door turns away. */}
      <motion.div
        aria-hidden
        style={{ opacity: shade }}
        className={cn(
          "pointer-events-none absolute inset-y-0 w-1/2",
          side === "left"
            ? "left-0 bg-[linear-gradient(to_left,var(--text-primary),transparent_60%)]"
            : "right-0 bg-[linear-gradient(to_right,var(--text-primary),transparent_60%)]",
        )}
      />
    </motion.div>
  );
};

/* ---------- Hero ---------- */

export const Hero = ({ hero }: { hero: HeroContent }) => {
  const ready = useIntroReady();
  const { reducedMotion } = useMotionTheme();
  const wide = useMediaQuery("(min-width: 1024px)");
  const doors = wide && !reducedMotion;
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const scroll = useFaceScroll(scrollYProgress);
  // First a seam draws down the middle, then the doors open.
  const seam = useTransform(scrollYProgress, [0, 0.12], [0, 1]);
  const seamFade = useTransform(scrollYProgress, [0.12, 0.4], [1, 0]);
  const open = useTransform(scrollYProgress, [0.12, 0.96], [0, 1]);

  return (
    <>
      <section
        ref={section}
        data-cf-section="hero"
        aria-label={hero.lines.join(" ")}
        className={cn("relative", doors && "pointer-events-none z-20")}
        style={doors ? { height: `${100 + DOOR_TRAVEL_SVH}svh` } : undefined}
      >
        {doors ? (
          <div className="sticky top-0 h-svh overflow-clip">
            <Door side="left" open={open}>
              <Face hero={hero} ready={ready} scroll={scroll} />
            </Door>
            {/* The second door is a visual copy: hidden from assistive tech and the keyboard. */}
            <Door side="right" open={open}>
              <div aria-hidden inert className="h-full">
                <Face hero={hero} ready={ready} scroll={scroll} />
              </div>
            </Door>
            <motion.span
              aria-hidden
              style={{ scaleY: seam, opacity: seamFade }}
              className="absolute inset-y-0 left-1/2 w-0.5 origin-top -translate-x-1/2 bg-signal"
            />
          </div>
        ) : (
          <Face hero={hero} ready={ready} scroll={null} />
        )}
      </section>

      {/* Velocity marquee band, on paper. With the doors it starts one screen up, so it waits behind them. */}
      <div
        className="relative overflow-hidden border-y border-ink/10 bg-paper py-6 text-ink sm:py-8"
        style={doors ? { marginTop: `-${DOOR_TRAVEL_SVH}svh` } : undefined}
      >
        <VelocitySkew max={3}>
          <Marquee label={hero.marquee.join(", ")} baseSpeed={2.5}>
            {hero.marquee.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="flex items-center gap-[0.35em] pr-[0.35em] font-wide text-[clamp(2.2rem,6vw,5.5rem)] leading-none font-semibold tracking-[-0.02em] uppercase"
              >
                {index % 2 === 1 ? (
                  <span className="text-transparent [-webkit-text-stroke:max(1px,0.012em)_var(--text-primary)]">
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
