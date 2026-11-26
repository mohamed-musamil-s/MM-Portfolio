"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import { EASE_PRINT } from "@/lib/motion/tokens";

/*
 * Shared pieces of the home sections (docs/screens/HOME_BUSINESS.md §6): the
 * section frame and header, reveal-on-view, scroll-ink text, bold phrases,
 * technology chips and pill buttons. Motion runs once per element as it
 * enters the viewport; reduced motion is honoured by MotionConfig.
 */

export type Header = { index: string; eyebrow: string; title: string; count: string };
export type Tech = { name: string; icon: string; core: boolean; ink: boolean };

const VIEW = { once: true, margin: "0px 0px -12% 0px" } as const;

/**
 * Scroll parallax: a vertical drift from +distance to -distance (px) while the
 * element crosses the viewport. Positive distances move slower than the page,
 * negative ones faster. Still with reduced motion.
 */
export const useParallax = <T extends HTMLElement>(distance: number) => {
  const ref = useRef<T>(null);
  const { reducedMotion } = useMotionTheme();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [distance, -distance]);
  return { ref, y };
};

/** A block on its own parallax layer (see useParallax). */
export const Parallax = ({
  children,
  className,
  distance = 40,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) => {
  const { ref, y } = useParallax<HTMLDivElement>(distance);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

/** The section number, giant and outlined, drifting behind the header on a slower layer. */
const GhostIndex = ({ index, tone }: { index: string; tone: "paper" | "ink" }) => {
  const { ref, y } = useParallax<HTMLSpanElement>(110);
  return (
    <motion.span
      ref={ref}
      aria-hidden
      style={{ y }}
      className={cn(
        "pointer-events-none absolute -top-[0.12em] right-0 -z-10 font-wide text-[clamp(8rem,24vw,22rem)] leading-none font-semibold text-transparent select-none",
        tone === "ink"
          ? "[-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--bg-primary)_16%,transparent)]"
          : "[-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--text-primary)_13%,transparent)]",
      )}
    >
      {index}
    </motion.span>
  );
};

/** Fades and rises into place the first time it enters the viewport. */
export const Reveal = ({
  children,
  className,
  delay = 0,
  x = 0,
  y = 32,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  x?: number;
  y?: number;
  as?: "div" | "li" | "article" | "p";
}) => {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={VIEW}
      transition={{ delay, duration: 0.9, ease: EASE_PRINT }}
    >
      {children}
    </Component>
  );
};

/**
 * A line rising through its mask the first time it enters the viewport. The
 * mask (not the clipped line) is what's watched: a line still hidden below
 * its mask never counts as visible, so watching it would never fire.
 */
export const MaskRise = ({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.span className="block overflow-hidden pb-[0.05em]" initial="hidden" whileInView="shown" viewport={VIEW}>
    <motion.span
      className={cn("block", className)}
      variants={{
        hidden: { y: "105%" },
        shown: { y: "0%", transition: { delay, duration: 1, ease: EASE_PRINT } },
      }}
    >
      {children}
    </motion.span>
  </motion.span>
);

/** A full-width section with the page margins, anchored for the navbar links. */
export const Section = ({
  id,
  children,
  className,
  tone = "paper",
}: {
  id: string;
  children: ReactNode;
  className?: string;
  tone?: "paper" | "ink";
}) => (
  <section
    id={id}
    className={cn(
      // Clip sideways only: cards that slide in from the side never widen the page; sticky still works.
      "relative scroll-mt-20 overflow-x-clip px-page py-[clamp(4.5rem,12svh,8rem)]",
      tone === "ink" ? "bg-ink text-paper" : "bg-paper text-ink",
      className,
    )}
  >
    <div className="relative mx-auto w-full max-w-[1440px]">{children}</div>
  </section>
);

/** Number and eyebrow on a hairline, the title massive in the wide face rising through a mask, the count on the right. */
export const SectionHeader = ({
  header,
  tone = "paper",
  compact = false,
}: {
  header: Header;
  tone?: "paper" | "ink";
  /** Smaller title and spacing, for pinned sections that must fit one screen. */
  compact?: boolean;
}) => (
  <header
    className={cn(
      "relative isolate flex flex-col gap-6",
      compact ? "mb-[clamp(1.5rem,4svh,2.5rem)]" : "mb-[clamp(2.5rem,7svh,4.5rem)]",
    )}
  >
    {compact ? null : <GhostIndex index={header.index} tone={tone} />}
    <Reveal
      y={0}
      className={cn(
        "flex items-center justify-between gap-4 border-t pt-3 font-technical text-micro uppercase",
        tone === "ink" ? "border-paper/20 text-paper/60" : "border-ink/15 text-graphite",
      )}
    >
      <span className="flex items-center gap-3">
        <span className="text-signal">{header.index}</span>
        <span>{header.eyebrow}</span>
      </span>
      <span className="hidden sm:block">{header.count}</span>
    </Reveal>
    <h2
      className={cn(
        "font-wide leading-[0.92] font-semibold tracking-[-0.02em] uppercase",
        compact ? "text-[clamp(2.2rem,min(5vw,9svh),4.6rem)]" : "text-[clamp(1.9rem,8vw,7.5rem)]",
      )}
    >
      <MaskRise>{header.title}</MaskRise>
    </h2>
  </header>
);

const InkWord = ({
  word,
  progress,
  range,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
}) => {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return <motion.span style={{ opacity }}>{word} </motion.span>;
};

/** Text that inks in word by word as it scrolls through the viewport. */
export const ScrollInk = ({ text, className }: { text: string; className?: string }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <p ref={ref} aria-label={text} className={className}>
      {words.map((word, index) => (
        <InkWord
          key={`${word}-${index}`}
          word={word}
          progress={scrollYProgress}
          range={[index / words.length, (index + 1) / words.length]}
        />
      ))}
    </p>
  );
};

/** Renders `**bold**` phrases in ink, the rest as given. */
export const Bold = ({ text, strongClassName }: { text: string; strongClassName?: string }) => (
  <>
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={index} className={cn("font-semibold text-ink", strongClassName)}>
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={index}>{part}</span>
      ),
    )}
  </>
);

/** A technology chip: logo icon (ink icons invert on dark), name; core skills marked with a signal ring. */
export const TechChip = ({
  tech,
  dark = false,
  small = false,
}: {
  tech: Tech;
  dark?: boolean;
  /** Tighter chip for dense cards. */
  small?: boolean;
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border font-medium whitespace-nowrap",
      small ? "gap-1.5 px-2.5 py-1 text-[0.72rem]" : "gap-2 px-3 py-1.5 text-[0.8125rem]",
      dark ? "border-paper/15 bg-paper/5 text-paper" : "border-ink/12 bg-paper text-ink",
      tech.core && (dark ? "border-signal/60" : "border-signal/50"),
    )}
  >
    {tech.icon ? (
      <Image
        src={tech.icon}
        alt=""
        width={16}
        height={16}
        unoptimized
        // Loaded up front (at low priority): the chips live in pinned, 3D-turned cards, where the browser's
        // lazy loading can fail to notice them coming on screen and leave the icons empty.
        loading="eager"
        fetchPriority="low"
        className={cn("object-contain", small ? "size-3.5" : "size-4", tech.ink && dark && "invert")}
      />
    ) : (
      <span aria-hidden className="size-1.5 rounded-full bg-signal" />
    )}
    {tech.name}
  </span>
);

/** A pill button whose label rolls on hover; the button itself never moves. */
export const Pill = ({
  href,
  tone,
  icon,
  children,
  external = false,
}: {
  href: string;
  tone: "ink" | "line" | "paper";
  icon: string;
  children: string;
  external?: boolean;
}) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noreferrer" : undefined}
    className={cn(
      "group inline-flex min-h-12 items-center gap-3 rounded-full py-1.5 pr-1.5 pl-6 text-label font-bold uppercase transition-colors duration-300 ease-print focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal",
      tone === "ink" && "bg-ink text-paper hover:bg-ink/88",
      tone === "line" && "border border-ink/20 text-ink hover:border-ink",
      tone === "paper" && "bg-paper text-ink hover:bg-paper/90",
    )}
  >
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-500 ease-print group-hover:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-print group-hover:translate-y-0"
      >
        {children}
      </span>
    </span>
    <span
      aria-hidden
      className={cn(
        "grid size-9 place-items-center rounded-full text-sm transition-transform duration-500 ease-print group-hover:rotate-[-45deg]",
        tone === "line" ? "border border-ink/20" : "bg-signal text-paper",
      )}
    >
      {icon}
    </span>
  </a>
);

/** True for links that leave the site. */
export const isExternal = (href: string) => /^https?:\/\//.test(href);
