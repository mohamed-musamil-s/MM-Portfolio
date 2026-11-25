"use client";

import { motion, type Transition } from "motion/react";
import { useId, useState } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import {
  MONOGRAM_CUT,
  MONOGRAM_CUT_DIRECTION,
  MONOGRAM_DOT,
  MONOGRAM_M1,
  MONOGRAM_M2,
  MONOGRAM_VIEWBOX,
} from "@/lib/shared/brand/monogram";

/*
 * "MM." with a slice-split animation (docs/brand/LOGO.md §6).
 *
 * Intro (~1.2s, once on mount):
 *   1. each M is cut into five horizontal slices that slide in from
 *      alternating sides and lock into place (second M 0.12s behind);
 *   2. the two letters start pushed apart along their diagonal cut, and an
 *      orange line flashes down the cut as they snap together;
 *   3. the orange full stop pops in last.
 * Hover: the letters slide apart along the cut, the orange cut line draws
 * between them, and the full stop swells; they close again on leave.
 *
 * After the intro the slices are swapped for whole paths, so the resting mark
 * has no anti-aliasing seams. Reduced motion: the finished mark, no hover.
 */

const SLICES = 5;
const SLICE_HEIGHT = MONOGRAM_VIEWBOX.height / SLICES;
const SLICE_TRAVEL = 64;
const SLICE_STAGGER = 0.06;
const LETTER_LAG = 0.12;
const SLICE_SECONDS = 0.6;
/** How far (units) the letters sit apart along the cut at the start, and on hover. */
const INTRO_SPLIT = 12;
const HOVER_SPLIT = 7;
const EASE = [0.2, 0, 0, 1] as const;
const SNAP: Transition = { type: "spring", stiffness: 520, damping: 30 };
const LETTERS = [MONOGRAM_M1, MONOGRAM_M2] as const;

/** First M slides down-left along the cut, the second up-right. */
const splitOffset = (letter: number, distance: number) => {
  const sign = letter === 0 ? 1 : -1;
  return { x: MONOGRAM_CUT_DIRECTION.x * distance * sign, y: MONOGRAM_CUT_DIRECTION.y * distance * sign };
};

type AnimatedMonogramProps = {
  /** Accessible name. Omit when a visible label sits next to the mark. */
  label?: string;
  className?: string;
};

export const AnimatedMonogram = ({ label, className }: AnimatedMonogramProps) => {
  const { reducedMotion } = useMotionTheme();
  const clipId = useId();
  const [assembled, setAssembled] = useState(reducedMotion);
  const [hovered, setHovered] = useState(false);
  const split = hovered && !reducedMotion ? HOVER_SPLIT : 0;
  const lastSliceDelay = (SLICES - 1) * SLICE_STAGGER + LETTER_LAG;

  return (
    <svg
      viewBox={`0 0 ${MONOGRAM_VIEWBOX.width} ${MONOGRAM_VIEWBOX.height}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      // Where the name splash's logo lands when it hands over to the page (components/splash).
      data-brand-mark=""
      className={cn("block h-auto overflow-visible text-ink", className)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <defs>
        {Array.from({ length: SLICES }, (_, i) => (
          // Slightly overlapping bands so no hairline shows between slices while they move.
          <clipPath key={i} id={`${clipId}-${i}`}>
            <rect x={-200} y={i * SLICE_HEIGHT - 0.5} width={MONOGRAM_VIEWBOX.width + 400} height={SLICE_HEIGHT + 1} />
          </clipPath>
        ))}
      </defs>

      {LETTERS.map((d, letter) => (
        <motion.g
          key={d}
          initial={reducedMotion ? false : splitOffset(letter, INTRO_SPLIT)}
          animate={splitOffset(letter, split)}
          transition={assembled ? SNAP : { ...SNAP, delay: 0.6 }}
        >
          {assembled ? (
            <path d={d} fill="currentColor" />
          ) : (
            Array.from({ length: SLICES }, (_, i) => {
              const from = (i + letter) % 2 === 0 ? -1 : 1;
              const delay = i * SLICE_STAGGER + letter * LETTER_LAG;
              return (
                <g key={i} clipPath={`url(#${clipId}-${i})`}>
                  <motion.path
                    d={d}
                    fill="currentColor"
                    initial={{ x: from * SLICE_TRAVEL, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: SLICE_SECONDS, ease: EASE, delay }}
                    onAnimationComplete={delay === lastSliceDelay ? () => setAssembled(true) : undefined}
                  />
                </g>
              );
            })
          )}
        </motion.g>
      ))}

      {/* The cut: flashes as the letters close on intro, draws between them on hover. */}
      <motion.line
        x1={MONOGRAM_CUT.x1}
        y1={MONOGRAM_CUT.y1}
        x2={MONOGRAM_CUT.x2}
        y2={MONOGRAM_CUT.y2}
        strokeWidth={4}
        strokeLinecap="round"
        className="stroke-signal"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          reducedMotion
            ? { pathLength: 0, opacity: 0 }
            : assembled
              ? { pathLength: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }
              : { pathLength: [0, 1, 1], opacity: [1, 1, 0] }
        }
        transition={assembled ? { duration: 0.3, ease: EASE } : { duration: 0.8, ease: EASE, delay: 0.4 }}
      />

      <motion.circle
        cx={MONOGRAM_DOT.cx}
        cy={MONOGRAM_DOT.cy}
        r={MONOGRAM_DOT.r}
        className="fill-signal"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        initial={reducedMotion ? false : { scale: 0 }}
        animate={{ scale: hovered && !reducedMotion ? 1.2 : 1 }}
        transition={assembled ? SNAP : { type: "spring", stiffness: 420, damping: 18, delay: 0.9 }}
      />
    </svg>
  );
};
