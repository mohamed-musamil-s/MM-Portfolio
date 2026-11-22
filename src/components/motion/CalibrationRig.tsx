"use client";

import { animate, createDrawable, set, type JSAnimation } from "animejs";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { secondsToMs, toAnimeEase } from "@/lib/motion/anime";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/shared/cn";

/*
 * Multi-layer calibration instrument (viewBox 200x200, centre 100,100):
 *   degree ring   rotates clockwise, slow      (motion)
 *   orbital ring  counter-rotates               (motion)
 *   vernier arc   draws in, then pulses         (anime.js draw, motion opacity)
 *   reticle       locks on at load, leans to the pointer (motion)
 *   whole rig     turns with scroll             (GSAP ScrollTrigger, outer element)
 */

const C = 100;

const polar = (deg: number, r: number): string => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return `${(C + r * Math.cos(rad)).toFixed(2)} ${(C + r * Math.sin(rad)).toFixed(2)}`;
};

const ticks = (degrees: number[], r1: number, r2: number): string =>
  degrees.map((deg) => `M${polar(deg, r1)}L${polar(deg, r2)}`).join("");

const range = (count: number, step: number, start = 0) => Array.from({ length: count }, (_, i) => start + i * step);

const MINOR_TICKS = ticks(range(72, 5).filter((deg) => deg % 30 !== 0), 88, 92);
const MAJOR_TICKS = ticks(range(12, 30), 84, 92);
const DEGREE_LABELS = range(12, 30);
const VERNIER_ARC = `M${polar(-60, 58)}A58 58 0 0 1 ${polar(60, 58)}`;
const VERNIER_TICKS = ticks(range(25, 5, -60), 58, 63);
const RETICLE_CROSS = "M100 78V92M100 108V122M78 100H92M108 100H122";

const DEGREE_RING_SECONDS = 90;
const ORBIT_RING_SECONDS = 40;
const SCROLL_TURN_DEGREES = 120;

export const CalibrationRig = ({ className }: { className?: string }) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const vernierRef = useRef<SVGGElement>(null);
  const lean = usePointerParallax(10);
  const spin = (seconds: number, direction: 1 | -1) =>
    reducedMotion ? undefined : { rotate: 360 * direction, transition: { duration: seconds, ease: "linear" as const, repeat: Infinity } };

  // Vernier ticks draw themselves in (anime.js owns these strokes).
  useEffect(() => {
    const strokes = vernierRef.current?.querySelectorAll("path");
    if (!strokes?.length) {
      return;
    }
    const drawable = createDrawable(strokes);
    if (reducedMotion) {
      set(drawable, { draw: "0 1" });
      return;
    }
    const draw: JSAnimation = animate(drawable, {
      draw: ["0 0", "0 1"],
      duration: secondsToMs(tokens.duration.slow * 1.6),
      delay: 300,
      ease: toAnimeEase(tokens.ease),
    });
    return () => {
      draw.pause();
    };
  }, [reducedMotion, tokens]);

  // The whole instrument turns as the page scrolls past it.
  useGSAP(
    () => {
      if (reducedMotion || !scrollRef.current) {
        return;
      }
      gsap.to(scrollRef.current, {
        rotate: SCROLL_TURN_DEGREES,
        ease: "none",
        scrollTrigger: { trigger: scrollRef.current, start: "top bottom", end: "bottom top", scrub: true },
      });
    },
    { dependencies: [reducedMotion], scope: scrollRef, revertOnUpdate: true },
  );

  return (
    <div ref={scrollRef} aria-hidden className={cn("pointer-events-none aspect-square text-ink print:hidden", className)}>
      <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" className="size-full overflow-visible">
        <motion.g style={{ originX: 0.5, originY: 0.5 }} animate={spin(DEGREE_RING_SECONDS, 1)}>
          <circle cx={C} cy={C} r={92} strokeWidth={0.75} />
          <path d={MINOR_TICKS} strokeWidth={0.5} />
          <path d={MAJOR_TICKS} strokeWidth={1} />
          {DEGREE_LABELS.map((deg) => {
            const [x, y] = polar(deg, 77).split(" ");
            return (
              <text
                key={deg}
                x={x}
                y={y}
                fill="currentColor"
                stroke="none"
                fontSize={5.5}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-technical tracking-widest"
                transform={`rotate(${deg} ${x} ${y})`}
              >
                {String(deg).padStart(3, "0")}
              </text>
            );
          })}
        </motion.g>

        <motion.g style={{ originX: 0.5, originY: 0.5 }} animate={spin(ORBIT_RING_SECONDS, -1)}>
          <circle cx={C} cy={C} r={70} strokeWidth={0.75} strokeDasharray="1.5 5" />
          <circle cx={C} cy={C - 70} r={2.5} fill="currentColor" stroke="none" />
        </motion.g>

        <motion.g
          ref={vernierRef}
          animate={reducedMotion ? undefined : { opacity: [1, 0.45, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
        >
          <path d={VERNIER_ARC} strokeWidth={1} />
          <path d={VERNIER_TICKS} strokeWidth={0.6} />
        </motion.g>

        <motion.g style={{ x: lean.x, y: lean.y }}>
          <motion.g
            style={{ originX: 0.5, originY: 0.5 }}
            initial={reducedMotion ? false : { scale: 1.8, rotate: 45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", ...tokens.spring, delay: 0.7 }}
          >
            <circle cx={C} cy={C} r={16} strokeWidth={1} />
            <path d={RETICLE_CROSS} strokeWidth={1} />
            <circle cx={C} cy={C} r={2.5} fill="currentColor" stroke="none" />
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
};
