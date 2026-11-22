"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

type InkRevealProps = {
  as?: "h1" | "h2" | "h3" | "p" | "div";
  /** One masked line per entry. Omit to reveal `children` as a single block. */
  lines?: readonly string[];
  children?: ReactNode;
  className?: string;
  /** Applied to each line's mask (e.g. bottom padding so descenders are not clipped). */
  lineClassName?: string;
  /** Per-line extra classes by index, e.g. to indent the second line of a headline. */
  lineClassNames?: readonly string[];
  delay?: number;
  stagger?: number;
  /** `mount` plays on load; `inView` plays once when scrolled into view. */
  trigger?: "mount" | "inView";
};

const HIDDEN = { y: "110%", clipPath: "inset(0% 100% 0% 0%)" };
const SHOWN = { y: "0%", clipPath: "inset(0% 0% 0% 0%)" };
const DEFAULT_STAGGER = 0.09;

/**
 * Ink-stamp reveal: each line rises out of a mask while an ink wipe uncovers
 * it left to right. The text is real DOM text, readable before and without JS.
 */
export const InkReveal = ({
  as: Tag = "div",
  lines,
  children,
  className,
  lineClassName,
  lineClassNames,
  delay = 0,
  stagger = DEFAULT_STAGGER,
  trigger = "mount",
}: InkRevealProps) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const items: readonly ReactNode[] = lines ?? [children];
  // The mask is what gets observed: the line itself starts translated out of
  // its overflow-hidden mask, which IntersectionObserver treats as clipped.
  const play =
    trigger === "inView" ? { whileInView: "shown", viewport: { once: true, amount: 0.5 } } : { animate: "shown" };
  // Masks must be phrasing content inside headings/paragraphs, but may wrap block content inside a div.
  const inline = Tag !== "div";
  const Mask = inline ? motion.span : motion.div;
  const Line = inline ? motion.span : motion.div;

  return (
    <Tag className={className}>
      {items.map((item, index) => (
        <Mask
          key={index}
          className={cn("block overflow-hidden", lineClassName, lineClassNames?.[index])}
          initial={reducedMotion ? false : "hidden"}
          {...play}
        >
          <Line
            className="block"
            variants={{
              hidden: HIDDEN,
              shown: {
                ...SHOWN,
                transition: { duration: tokens.duration.slow, ease: tokens.ease, delay: delay + index * stagger },
              },
            }}
          >
            {item}
          </Line>
          {/* Keeps words apart in the accessible name ("UPGRADING THE SYSTEM."), invisible in layout. */}
          {index < items.length - 1 ? " " : null}
        </Mask>
      ))}
    </Tag>
  );
};
