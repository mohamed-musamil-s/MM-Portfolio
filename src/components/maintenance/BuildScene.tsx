"use client";

import { animate, createDrawable, set, stagger, type JSAnimation } from "animejs";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { secondsToMs, toAnimeEase } from "@/lib/motion/anime";
import { cn } from "@/lib/shared/cn";

/*
 * "Portfolio under reconstruction": a looping, purely decorative SVG scene
 * (viewBox 400x500, stroked in currentColor).
 *
 *   wireframe + dimension lines  draw themselves in on mount   (anime.js)
 *   copy lines                   type in and clear, staggered   (motion, loop)
 *   cursor                       travels card to card; each card fills
 *                                with hatch as it lands          (motion, shared loop clock)
 *   scanline                     sweeps down the page           (motion, loop)
 *   gears                        meshed, counter-rotating       (motion, loop)
 *   whole scene                  leans toward the pointer       (motion)
 */

const LOOP_SECONDS = 6;
const DRAW_SECONDS = 1.6;

type Card = { x: number; at: number };
const CARD_Y = 222;
const CARD_W = 88;
const CARD_H = 92;
const CARDS: Card[] = [
  { x: 60, at: 0.17 },
  { x: 156, at: 0.42 },
  { x: 252, at: 0.67 },
];

const cardCenter = (card: Card) => ({ x: card.x + CARD_W / 2, y: CARD_Y + CARD_H / 2 });
const CURSOR_HOME = { x: 330, y: 392 };
const CURSOR_TIMES = [0, 0.15, 0.4, 0.65, 0.9, 1];
const CURSOR_X = [CURSOR_HOME.x, ...CARDS.map((card) => cardCenter(card).x), CURSOR_HOME.x, CURSOR_HOME.x];
const CURSOR_Y = [CURSOR_HOME.y, ...CARDS.map((card) => cardCenter(card).y), CURSOR_HOME.y, CURSOR_HOME.y];

const COPY_LINES = [
  { d: "M60 168H238", delay: 0 },
  { d: "M60 180H218", delay: 0.12 },
  { d: "M60 192H228", delay: 0.24 },
  { d: "M60 338H330", delay: 0.4 },
  { d: "M60 350H290", delay: 0.52 },
  { d: "M60 362H310", delay: 0.64 },
];

/** Gear outline: `teeth` trapezoid teeth between rInner and rOuter around (cx, cy). */
const gearPath = (cx: number, cy: number, teeth: number, rInner: number, rOuter: number): string => {
  const step = (Math.PI * 2) / teeth;
  const point = (r: number, angle: number) =>
    `${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy + r * Math.sin(angle)).toFixed(2)}`;
  const segments = Array.from({ length: teeth }, (_, i) => {
    const a = i * step;
    return `${i === 0 ? "M" : "L"}${point(rInner, a)}L${point(rOuter, a + step * 0.15)}L${point(rOuter, a + step * 0.45)}L${point(rInner, a + step * 0.6)}`;
  });
  return `${segments.join("")}Z`;
};

const BIG_GEAR = { cx: 330, cy: 452, teeth: 12, rInner: 26, rOuter: 33 };
const SMALL_GEAR = { cx: 374, cy: 418, teeth: 8, rInner: 15, rOuter: 22 };
/** Angular speed ∝ 1/teeth so the pair appears to mesh. */
const BIG_GEAR_SECONDS = 12;
const SMALL_GEAR_SECONDS = (BIG_GEAR_SECONDS * SMALL_GEAR.teeth) / BIG_GEAR.teeth;

const loop = (delay: number, extra?: object) => ({
  duration: LOOP_SECONDS,
  repeat: Infinity,
  ease: "easeInOut" as const,
  delay,
  ...extra,
});

export const BuildScene = ({ className }: { className?: string }) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const drawRef = useRef<SVGGElement>(null);
  const lean = usePointerParallax(12);
  const moving = !reducedMotion;

  // Wireframe draw-in (anime.js owns these strokes).
  useEffect(() => {
    const strokes = drawRef.current?.querySelectorAll("path");
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
      duration: secondsToMs(DRAW_SECONDS),
      delay: stagger(45),
      ease: toAnimeEase(tokens.ease),
    });
    return () => {
      draw.pause();
    };
  }, [reducedMotion, tokens]);

  return (
    <motion.div aria-hidden className={cn("pointer-events-none", className)} style={{ x: lean.x, y: lean.y }}>
      <svg viewBox="0 0 400 500" fill="none" stroke="currentColor" className="size-full overflow-visible">
        <defs>
          <pattern id="build-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0V6" strokeWidth={1.2} />
          </pattern>
          <pattern id="build-dots" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx={2.5} cy={2.5} r={1} fill="currentColor" stroke="none" />
          </pattern>
          <linearGradient id="build-fade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="1" />
            <stop offset="1" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
          <mask id="build-fade-mask">
            <rect x={270} y={110} width={70} height={80} fill="url(#build-fade)" />
          </mask>
        </defs>

        {/* Wireframe, dimension lines and card outlines: drawn in by anime.js */}
        <g ref={drawRef} strokeWidth={1}>
          <path d="M40 60H360V440H40Z" strokeWidth={1.4} />
          <path d="M40 92H360" />
          <path d="M52 72H62V82H52ZM68 72H78V82H68ZM84 72H94V82H84Z" />
          <path d="M240 77H268M280 77H308M320 77H348" />
          <path d="M270 110H340V190H270Z" />
          <path d="M40 404H360" />
          {CARDS.map((card) => (
            <path key={card.x} d={`M${card.x} ${CARD_Y}H${card.x + CARD_W}V${CARD_Y + CARD_H}H${card.x}Z`} />
          ))}
          <path d="M18 60V440M12 60H24M12 440H24" strokeWidth={0.75} />
          <path d="M40 38H360M40 32V44M360 32V44" strokeWidth={0.75} />
        </g>

        {/* Headline blocks + image halftone appear once the frame is drawn */}
        <motion.g
          initial={moving ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: DRAW_SECONDS * 0.8, duration: tokens.duration.base }}
        >
          <path d="M60 122H248" strokeWidth={9} />
          <path d="M60 144H196" strokeWidth={9} />
          <rect x={270} y={110} width={70} height={80} fill="url(#build-dots)" stroke="none" mask="url(#build-fade-mask)" />
        </motion.g>

        {/* Copy lines type in and clear on the loop */}
        {COPY_LINES.map((line) => (
          <motion.path
            key={line.d}
            d={line.d}
            strokeWidth={2}
            style={{ originX: 0, originY: 0.5 }}
            initial={moving ? { scaleX: 0 } : false}
            animate={moving ? { scaleX: [0, 1, 1, 0] } : undefined}
            transition={loop(DRAW_SECONDS + line.delay, { times: [0, 0.25, 0.85, 1] })}
          />
        ))}

        {/* Cards fill with hatch as the cursor lands on each */}
        {CARDS.map((card) => (
          <motion.rect
            key={card.x}
            x={card.x + 6}
            y={CARD_Y + 6}
            width={CARD_W - 12}
            height={CARD_H - 12}
            fill="url(#build-hatch)"
            stroke="none"
            initial={moving ? { opacity: 0 } : false}
            animate={moving ? { opacity: [0, 0, 1, 1, 0] } : undefined}
            transition={loop(DRAW_SECONDS, { times: [0, card.at, card.at + 0.03, 0.88, 0.95], ease: "linear" })}
          />
        ))}

        {/* Landing bursts */}
        {CARDS.map((card) => {
          const center = cardCenter(card);
          return (
            <motion.circle
              key={card.x}
              cx={center.x}
              cy={center.y}
              r={22}
              strokeWidth={1}
              style={{ originX: 0.5, originY: 0.5 }}
              initial={{ opacity: 0, scale: 0.2 }}
              animate={moving ? { opacity: [0, 0, 0.9, 0], scale: [0.2, 0.2, 0.6, 1.4] } : undefined}
              transition={loop(DRAW_SECONDS, { times: [0, card.at, card.at + 0.02, card.at + 0.12], ease: "easeOut" })}
            />
          );
        })}

        {/* Scanline */}
        <motion.path
          d="M40 0H360"
          strokeWidth={1}
          strokeDasharray="2 4"
          initial={{ opacity: 0, y: 60 }}
          animate={moving ? { y: [60, 440], opacity: [0, 0.8, 0.8, 0] } : undefined}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: DRAW_SECONDS, times: [0, 0.1, 0.9, 1] }}
        />

        {/* Cursor: registration crosshair travelling card to card */}
        <motion.g
          initial={{ x: CURSOR_HOME.x, y: CURSOR_HOME.y, opacity: moving ? 0 : 1 }}
          animate={moving ? { x: CURSOR_X, y: CURSOR_Y, opacity: 1 } : undefined}
          transition={{
            x: loop(DRAW_SECONDS, { times: CURSOR_TIMES }),
            y: loop(DRAW_SECONDS, { times: CURSOR_TIMES }),
            opacity: { delay: DRAW_SECONDS, duration: tokens.duration.base },
          }}
        >
          <circle cx={0} cy={0} r={7} strokeWidth={1.2} />
          <path d="M0 -13V13M-13 0H13" strokeWidth={1.2} />
          <circle cx={0} cy={0} r={2} fill="currentColor" stroke="none" />
        </motion.g>

        {/* Maintenance: meshed gears */}
        <motion.path
          d={gearPath(BIG_GEAR.cx, BIG_GEAR.cy, BIG_GEAR.teeth, BIG_GEAR.rInner, BIG_GEAR.rOuter)}
          strokeWidth={1.2}
          style={{ originX: 0.5, originY: 0.5 }}
          animate={moving ? { rotate: 360 } : undefined}
          transition={{ duration: BIG_GEAR_SECONDS, repeat: Infinity, ease: "linear" }}
        />
        <circle cx={BIG_GEAR.cx} cy={BIG_GEAR.cy} r={8} strokeWidth={1.2} />
        <motion.path
          d={gearPath(SMALL_GEAR.cx, SMALL_GEAR.cy, SMALL_GEAR.teeth, SMALL_GEAR.rInner, SMALL_GEAR.rOuter)}
          strokeWidth={1.2}
          style={{ originX: 0.5, originY: 0.5, rotate: 22.5 }}
          animate={moving ? { rotate: 22.5 - 360 } : undefined}
          transition={{ duration: SMALL_GEAR_SECONDS, repeat: Infinity, ease: "linear" }}
        />
        <circle cx={SMALL_GEAR.cx} cy={SMALL_GEAR.cy} r={5} strokeWidth={1.2} />
      </svg>
    </motion.div>
  );
};
