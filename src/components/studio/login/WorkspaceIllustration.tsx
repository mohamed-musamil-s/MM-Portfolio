"use client";

import { motion, useTransform } from "motion/react";
import type { CSSProperties } from "react";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

/*
 * Tilted "Studio workspace" illustration for the login brand panel: a glass
 * app window (logo, workspace label, a blue chart card, a line chart, a
 * toggle, a gauge) with abstract glass pills (no text) floating out of it,
 * a shelf and a tick ruler below. CSS 3D (perspective + preserve-3d),
 * sized in container units so it scales with the panel.
 *
 * Motion: the whole rig floats and leans a few degrees toward the pointer;
 * the chart draws, bars grow, the gauge needle sweeps, the toggle flips and
 * the pills bob at their own pace. Reduced motion: a still frame.
 */

type WorkspaceIllustrationProps = {
  title: string;
  workspace: string;
  className?: string;
};

const REST = { rotateX: 7, rotateY: 15, rotateZ: -4 } as const;
const EASE = [0.2, 0, 0, 1] as const;
const z = (px: number): CSSProperties => ({ transform: `translateZ(${px}px)` });

const BARS = [34, 52, 44, 62, 48];
/** Abstract glass pills floating out of the window: position and the two placeholder bar widths. */
const PILLS = [
  { top: "10%", left: "60%", bars: ["62%", "34%"] },
  { top: "21%", left: "61.5%", bars: ["48%", "40%"] },
  { top: "32%", left: "63%", bars: ["56%", "26%"] },
  { top: "43%", left: "64.5%", bars: ["40%", "44%"] },
];

const LogoTile = () => (
  <span className="grid size-[7cqw] shrink-0 place-items-center rounded-[1.8cqw] bg-linear-to-br from-aurora-violet to-aurora-indigo shadow-md shadow-aurora-indigo/30">
    <svg viewBox="0 0 24 24" className="size-[4cqw]" fill="none" strokeLinecap="round" strokeWidth={3.2}>
      <path d="M6 17v-4" className="stroke-card/70" />
      <path d="M12 17V8" className="stroke-card" />
      <path d="M18 17v-6" className="stroke-card" />
      <circle cx={18} cy={6} r={1.6} className="fill-card stroke-none" />
    </svg>
  </span>
);

const ChartCard = ({ still }: { still: boolean }) => (
  <div className="relative overflow-hidden rounded-[3cqw] bg-linear-to-br from-aurora-sky via-aurora-cyan to-aurora-blue shadow-lg shadow-aurora-blue/20">
    <div className="absolute top-[8%] left-[7%] flex w-[45%] flex-col gap-[1.2cqw]">
      <span className="h-[1.6cqw] w-full rounded-full bg-card/85" />
      <span className="h-[1.2cqw] w-2/3 rounded-full bg-card/55" />
    </div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" fill="none">
      <path
        d="M0 32 L32 30 L46 44 L100 40"
        className="stroke-card/55"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />
      <motion.path
        d="M0 78 C18 66 30 70 42 72 C58 74 64 40 80 38 C90 37 96 42 100 46"
        className="stroke-card/70"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: still ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: EASE, delay: 0.4 }}
      />
      <path
        d="M0 92 C20 86 34 84 48 82 C62 80 70 58 84 56 C92 55 97 60 100 62"
        className="stroke-card/45"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
    <div className="absolute bottom-[6%] left-[8%] flex h-[62%] w-[42%] items-end gap-[1.4cqw]">
      {BARS.map((height, index) => (
        <motion.span
          key={index}
          className="flex-1 origin-bottom rounded-t-[0.8cqw] bg-card/95 shadow-sm"
          style={{ height: `${height + 30}%` }}
          initial={{ scaleY: still ? 1 : 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.5 + index * 0.08 }}
        />
      ))}
    </div>
  </div>
);

const LineChart = ({ still }: { still: boolean }) => (
  <svg viewBox="0 0 100 40" className="w-full" fill="none">
    <motion.path
      d="M2 34 L24 33 L40 8 L62 22 L80 12 L98 10"
      className="stroke-aurora-blue"
      strokeWidth={2.2}
      strokeLinejoin="round"
      strokeLinecap="round"
      initial={{ pathLength: still ? 1 : 0 }}
      animate={still ? { pathLength: 1 } : { pathLength: [0, 1, 1, 0] }}
      transition={still ? undefined : { duration: 6, times: [0, 0.3, 0.85, 1], ease: "easeInOut", repeat: Infinity }}
    />
  </svg>
);

const Gauge = ({ still }: { still: boolean }) => (
  <svg viewBox="0 0 100 100" className="mx-auto w-[62%]" fill="none">
    <circle cx={50} cy={50} r={44} className="stroke-aurora-lavender" strokeWidth={1.5} />
    <circle cx={50} cy={50} r={34} className="stroke-aurora-mist" strokeWidth={9} />
    <path d="M24 74 A36 36 0 0 1 30 20" className="stroke-aurora-blue" strokeWidth={3} strokeLinecap="round" />
    <path d="M40 16 A36 36 0 0 1 68 18" className="stroke-aurora-cyan" strokeWidth={5} strokeLinecap="round" />
    <motion.g
      style={{ transformOrigin: "50px 50px" }}
      initial={false}
      animate={still ? { rotate: 0 } : { rotate: [-40, 18, -12, 30, -40] }}
      transition={still ? undefined : { duration: 9, ease: "easeInOut", repeat: Infinity }}
    >
      <path d="M50 50 L70 22" className="stroke-aurora-blue" strokeWidth={2.4} strokeLinecap="round" />
    </motion.g>
    <circle cx={50} cy={50} r={6.5} className="fill-aurora-blue" />
  </svg>
);

export const WorkspaceIllustration = ({ title, workspace, className }: WorkspaceIllustrationProps) => {
  const { reducedMotion } = useMotionTheme();
  const lean = usePointerParallax(5);
  const rotateY = useTransform(lean.x, (value) => REST.rotateY + value);
  const rotateX = useTransform(lean.y, (value) => REST.rotateX - value * 0.6);
  const still = reducedMotion;

  return (
    <div aria-hidden className={cn("[container-type:inline-size] relative w-full", className)}>
      <div className="relative aspect-square perspective-[1800px]">
        {/* Soft shadow on the "floor" */}
        <div className="absolute top-[72%] left-[10%] h-[16%] w-[75%] rounded-[50%] bg-aurora-indigo/15 blur-3xl" />

        <motion.div className="absolute inset-0 transform-3d" style={{ rotateX, rotateY, rotateZ: REST.rotateZ }}>
          <motion.div
            className="absolute inset-0 transform-3d"
            animate={still ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
          >
            {/* Ghost card behind the window */}
            <div
              className="absolute top-[18%] left-[10%] h-[56%] w-[76%] rounded-[4cqw] border border-card/70 bg-card/35"
              style={z(-70)}
            />

            {/* Main window */}
            <div
              className="absolute top-[12%] left-[3%] flex h-[58%] w-[82%] flex-col gap-[2.4cqw] rounded-[4cqw] border border-card bg-card/80 p-[3.6cqw] shadow-2xl shadow-aurora-indigo/15 backdrop-blur-xl"
              style={z(0)}
            >
              <div className="flex items-center justify-between gap-[3cqw]">
                <div className="flex items-center gap-[2.2cqw]">
                  <LogoTile />
                  <span className="text-[4.4cqw] leading-none font-bold tracking-tight text-foreground italic">
                    {title}
                  </span>
                </div>
                <div className="flex w-[40%] items-center gap-[1.6cqw]">
                  <motion.span
                    className="h-[0.7cqw] flex-1 origin-left rounded-full bg-aurora-indigo"
                    initial={{ scaleX: still ? 1 : 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
                  />
                  <motion.span
                    className="h-[0.7cqw] flex-[1.4] origin-left rounded-full bg-aurora-violet/80"
                    initial={{ scaleX: still ? 1 : 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-[2cqw]">
                <span className="text-[3cqw] font-medium text-muted-foreground italic">{workspace}</span>
                <span className="h-[2.2cqw] w-[42%] bg-[repeating-linear-gradient(110deg,var(--studio-aurora-periwinkle)_0_1.5px,transparent_1.5px_6px)]" />
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_1fr] gap-[3cqw]">
                <ChartCard still={still} />
                <div className="flex min-h-0 flex-col justify-between gap-[1.6cqw]">
                  <LineChart still={still} />
                  <div className="flex items-center gap-[1.6cqw]">
                    <span className="relative h-[3.2cqw] w-[9cqw] rounded-full bg-aurora-lavender/70">
                      <motion.span
                        className="absolute top-1/2 size-[2.6cqw] -translate-y-1/2 rounded-full bg-aurora-indigo shadow"
                        initial={false}
                        animate={still ? { left: "6%" } : { left: ["6%", "6%", "64%", "64%", "6%"] }}
                        transition={still ? undefined : { duration: 6, times: [0, 0.4, 0.5, 0.9, 1], repeat: Infinity }}
                      />
                    </span>
                    <span className="h-[1.2cqw] flex-1 rounded-full bg-aurora-lavender/80" />
                  </div>
                  <div className="flex gap-[1.4cqw]">
                    {Array.from({ length: 6 }, (_, index) => (
                      <span key={index} className="h-[0.9cqw] flex-1 rounded-full bg-aurora-periwinkle/70" />
                    ))}
                  </div>
                  <Gauge still={still} />
                </div>
              </div>
            </div>

            {/* Shelf under the window */}
            <div
              className="absolute top-[74%] left-[0%] flex h-[8%] w-[70%] items-center gap-[3cqw] rounded-[3cqw] border border-card bg-card/80 px-[3.6cqw] shadow-xl shadow-aurora-indigo/10 backdrop-blur-xl"
              style={z(40)}
            >
              <span className="size-[4.4cqw] rounded-[1.2cqw] bg-aurora-indigo" />
              <span className="h-[1.2cqw] w-[36%] rounded-full bg-aurora-periwinkle/80" />
            </div>

            {/* Tick ruler */}
            <svg viewBox="0 0 300 12" className="absolute top-[86%] left-[8%] w-[78%]" style={z(10)}>
              {Array.from({ length: 60 }, (_, index) => (
                <line
                  key={index}
                  x1={index * 5 + 1}
                  x2={index * 5 + 1}
                  y1={0}
                  y2={12}
                  className="stroke-aurora-periwinkle"
                  strokeWidth={0.8}
                  opacity={0.25 + (index / 60) * 0.6}
                />
              ))}
            </svg>

            {/* Abstract pills floating out of the window */}
            {PILLS.map(({ top, left, bars }, index) => {
              return (
                <div key={top} className="absolute w-[30%] transform-3d" style={{ top, left, ...z(80 + index * 14) }}>
                  <motion.div
                    className="flex items-center gap-[1.8cqw] rounded-[2.2cqw] border border-card bg-card/80 px-[2.8cqw] py-[2.2cqw] shadow-lg shadow-aurora-indigo/10 backdrop-blur-xl"
                    initial={still ? false : { opacity: 0, x: -20 }}
                    animate={still ? { opacity: 1 } : { opacity: 1, x: 0, y: [0, -4, 0] }}
                    transition={
                      still
                        ? undefined
                        : {
                            opacity: { duration: 0.5, delay: 0.6 + index * 0.12 },
                            x: { duration: 0.7, ease: EASE, delay: 0.6 + index * 0.12 },
                            y: { duration: 4 + index * 0.6, ease: "easeInOut", repeat: Infinity, delay: 1.5 },
                          }
                    }
                  >
                    <span
                      className="size-[1.5cqw] rounded-full bg-aurora-indigo"
                      style={{ opacity: 1 - index * 0.15 }}
                    />
                    <span className="flex flex-1 items-center gap-[1.2cqw]">
                      <span className="h-[1.3cqw] rounded-full bg-aurora-indigo/25" style={{ width: bars[0] }} />
                      <span className="h-[1.3cqw] rounded-full bg-aurora-periwinkle/45" style={{ width: bars[1] }} />
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
