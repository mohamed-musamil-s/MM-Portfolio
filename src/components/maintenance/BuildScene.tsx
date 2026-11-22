"use client";

import { animate, createDrawable, set, stagger, type JSAnimation } from "animejs";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { secondsToMs, toAnimeEase } from "@/lib/motion/anime";
import { cn } from "@/lib/shared/cn";

/*
 * "Portfolio under reconstruction": a calm, looping line illustration
 * (viewBox 400x500, stroked in currentColor). Decorative only.
 *
 *   wireframe     draws itself in on mount                      (anime.js)
 *   copy lines    type in and clear, staggered                  (motion loop)
 *   cursor        signal-orange crosshair visits each card;
 *                 the card fills with hatch as it lands          (motion loop, shared clock)
 *   whole scene   leans gently toward the pointer               (motion)
 */

const LOOP_SECONDS = 6;
const DRAW_SECONDS = 1.6;

type Card = { x: number; at: number };
const CARD_Y = 230;
const CARD_W = 88;
const CARD_H = 96;
const CARDS: Card[] = [
  { x: 60, at: 0.17 },
  { x: 156, at: 0.42 },
  { x: 252, at: 0.67 },
];

const cardCenter = (card: Card) => ({ x: card.x + CARD_W / 2, y: CARD_Y + CARD_H / 2 });
const CURSOR_HOME = { x: 330, y: 380 };
const CURSOR_TIMES = [0, 0.15, 0.4, 0.65, 0.9, 1];
const CURSOR_X = [CURSOR_HOME.x, ...CARDS.map((card) => cardCenter(card).x), CURSOR_HOME.x, CURSOR_HOME.x];
const CURSOR_Y = [CURSOR_HOME.y, ...CARDS.map((card) => cardCenter(card).y), CURSOR_HOME.y, CURSOR_HOME.y];

const COPY_LINES = [
  { d: "M60 172H238", delay: 0 },
  { d: "M60 186H210", delay: 0.12 },
  { d: "M60 362H320", delay: 0.4 },
  { d: "M60 376H280", delay: 0.52 },
];

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
  const lean = usePointerParallax(8);
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
      delay: stagger(60),
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
            <path d="M0 0V6" strokeWidth={1} />
          </pattern>
          <pattern id="build-dots" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx={2.5} cy={2.5} r={0.9} fill="currentColor" stroke="none" />
          </pattern>
        </defs>

        {/* Wireframe: drawn in by anime.js */}
        <g ref={drawRef} strokeWidth={1}>
          <path d="M40 60H360V440H40Z" strokeWidth={1.25} />
          <path d="M40 94H360" />
          <path d="M54 72H64V82H54ZM70 72H80V82H70ZM86 72H96V82H86Z" />
          <path d="M270 112H340V196H270Z" />
          {CARDS.map((card) => (
            <path key={card.x} d={`M${card.x} ${CARD_Y}H${card.x + CARD_W}V${CARD_Y + CARD_H}H${card.x}Z`} />
          ))}
          <path d="M40 410H360" />
        </g>

        {/* Headline blocks + image texture fade in once the frame is drawn */}
        <motion.g
          initial={moving ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: DRAW_SECONDS * 0.8, duration: tokens.duration.base }}
        >
          <path d="M60 126H246" strokeWidth={8} />
          <path d="M60 146H190" strokeWidth={8} />
          <rect x={276} y={118} width={58} height={72} fill="url(#build-dots)" stroke="none" opacity={0.7} />
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

        {/* Cards fill as the cursor lands on each */}
        {CARDS.map((card) => (
          <motion.rect
            key={card.x}
            x={card.x + 8}
            y={CARD_Y + 8}
            width={CARD_W - 16}
            height={CARD_H - 16}
            fill="url(#build-hatch)"
            stroke="none"
            initial={moving ? { opacity: 0 } : false}
            animate={moving ? { opacity: [0, 0, 0.8, 0.8, 0] } : undefined}
            transition={loop(DRAW_SECONDS, { times: [0, card.at, card.at + 0.04, 0.88, 0.95], ease: "linear" })}
          />
        ))}

        {/* Cursor: the scene's one signal-orange element */}
        <motion.g
          className="text-signal"
          initial={{ x: CURSOR_HOME.x, y: CURSOR_HOME.y, opacity: moving ? 0 : 1 }}
          animate={moving ? { x: CURSOR_X, y: CURSOR_Y, opacity: 1 } : undefined}
          transition={{
            x: loop(DRAW_SECONDS, { times: CURSOR_TIMES }),
            y: loop(DRAW_SECONDS, { times: CURSOR_TIMES }),
            opacity: { delay: DRAW_SECONDS, duration: tokens.duration.base },
          }}
        >
          <circle cx={0} cy={0} r={7} strokeWidth={1.4} />
          <path d="M0 -13V13M-13 0H13" strokeWidth={1.4} />
          <circle cx={0} cy={0} r={2} fill="currentColor" stroke="none" />
        </motion.g>
      </svg>
    </motion.div>
  );
};
