"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/shared/cn";
import type { IllustrationScene, MaintenanceContent } from "@/lib/shared/content/maintenance-schema";

/*
 * Maintenance "film": one continuous shot on a single browser canvas, driven
 * by one GSAP timeline (GSAP owns every element inside the SVG; motion only
 * leans the wrapper toward the pointer). No cuts, no carousel:
 *
 *    0.0  camera starts close, dollies out while the browser frame draws in
 *    1.0  MANAGE     settings panel slides in, cursor flips toggles, gears spin
 *    3.2             panel slides away
 *    3.4  CONSTRUCT  dashed slots appear, cursor guides each block into place
 *    6.0  CONTENT    camera pushes in, copy types into the hero, bulb lights
 *    8.8  REDESIGN   hero and image swap places, a pen draws a curve
 *   11.2  UPGRADE    page dims, version tag drops in, bar fills, from -> to, check
 *   14.6             everything dissolves, camera returns close -> loop
 *
 * Subtitles (DB step labels) fade in and out under the picture like film
 * captions. Reduced motion: the timeline is paused on a finished frame.
 *
 * Strokes use butt caps: an undrawn path (dashoffset 1) would otherwise still
 * paint a square cap dot at its end.
 */

type Illustration = MaintenanceContent["illustration"];

const VIEW = { width: 480, height: 340 };
/** Frame (seconds) shown, paused, under reduced motion: the page after content is written. */
const STILL_FRAME_SECONDS = 8.2;

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;

const gearPath = (cx: number, cy: number, teeth: number, rInner: number, rOuter: number): string => {
  const step = (Math.PI * 2) / teeth;
  const point = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  return `${Array.from({ length: teeth }, (_, i) => {
    const a = i * step;
    return `${i === 0 ? "M" : "L"}${point(rInner, a)}L${point(rOuter, a + step * 0.15)}L${point(rOuter, a + step * 0.45)}L${point(rInner, a + step * 0.6)}`;
  }).join("")}Z`;
};

/** Page layout the film builds (x, y, w, h). */
const BLOCKS = {
  header: [64, 72, 352, 20],
  hero: [64, 106, 196, 84],
  image: [276, 106, 140, 84],
  card1: [64, 206, 108, 92],
  card2: [186, 206, 108, 92],
  card3: [308, 206, 108, 92],
} as const;
type BlockKey = keyof typeof BLOCKS;
const BLOCK_ORDER: BlockKey[] = ["header", "hero", "image", "card1", "card2", "card3"];
const center = (key: BlockKey) => {
  const [x, y, w, h] = BLOCKS[key];
  return { x: x + w / 2, y: y + h / 2 };
};

const TOGGLES_Y = [110, 144, 178];
const SLIDERS_Y = [226, 258];
const COPY_LINES = [
  { y: 124, w: 150, width: 6 },
  { y: 140, w: 110, width: 6 },
  { y: 160, w: 160, width: 2 },
  { y: 172, w: 140, width: 2 },
];
const CURVE = "M76 284C150 214 260 312 404 232";

const CAPTION_SCENES: IllustrationScene[] = ["manage", "construct", "content", "redesign", "upgrade"];

export const MaintenanceIllustration = ({
  illustration,
  className,
}: {
  illustration: Illustration;
  className?: string;
}) => {
  const { reducedMotion } = useMotionTheme();
  const scopeRef = useRef<HTMLElement>(null);
  const lean = usePointerParallax(6);
  const captionFor = (scene: IllustrationScene) => illustration.steps.find((step) => step.scene === scene)?.label;

  useGSAP(
    () => {
      const q = gsap.utils.selector(scopeRef);
      const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.out", duration: 0.6 } });
      const cursorTo = (key: BlockKey | { x: number; y: number }, at: number | string, duration = 0.45) =>
        tl.to(
          q("[data-cursor]"),
          { ...(typeof key === "string" ? center(key) : key), duration, ease: "power2.inOut" },
          at,
        );
      const caption = (scene: IllustrationScene, inAt: number, outAt: number) => {
        const el = q(`[data-caption="${scene}"]`);
        tl.fromTo(el, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5 }, inAt);
        // Out finishes (0.35s) before the next caption starts, so subtitles never overlap.
        tl.to(el, { autoAlpha: 0, y: -6, duration: 0.35, ease: "power2.in" }, outAt);
      };

      /* ── Initial state (re-applied at the start of every loop) ── */
      tl.set(q("[data-camera]"), { scale: 1.18, transformOrigin: "50% 50%" }, 0)
        .set(q("[data-draw]"), { strokeDasharray: 1, strokeDashoffset: 1 }, 0)
        .set(q("[data-panel]"), { x: -60, autoAlpha: 0 }, 0)
        .set(q("[data-knob]"), { x: 0 }, 0)
        .set(q("[data-slider-knob]"), { x: 0 }, 0)
        .set(q("[data-gears]"), { autoAlpha: 0 }, 0)
        .set(q("[data-slot]"), { autoAlpha: 0 }, 0)
        .set(q("[data-block]"), { autoAlpha: 0, y: -36 }, 0)
        .set(q("[data-hero], [data-image]"), { x: 0 }, 0)
        .set(q("[data-line]"), { scaleX: 0, transformOrigin: "0% 50%" }, 0)
        .set(q("[data-bulb]"), { autoAlpha: 0 }, 0)
        .set(q("[data-anchor]"), { scale: 0, transformOrigin: "50% 50%" }, 0)
        .set(q("[data-page]"), { autoAlpha: 1 }, 0)
        .set(q("[data-tag]"), { autoAlpha: 0, y: -24 }, 0)
        .set(q("[data-version-from]"), { autoAlpha: 1 }, 0)
        .set(q("[data-version-to]"), { autoAlpha: 0, y: 8 }, 0)
        .set(q("[data-bar]"), { scaleX: 0, transformOrigin: "0% 50%" }, 0)
        .set(q("[data-cursor]"), { autoAlpha: 0, x: 420, y: 300 }, 0)
        .set(q("[data-caption]"), { autoAlpha: 0 }, 0);

      /* ── Opening: dolly out while the browser draws in ── */
      tl.to(q("[data-camera]"), { scale: 1, duration: 2.2, ease: "power2.inOut" }, 0)
        .to(q("[data-frame] [data-draw]"), { strokeDashoffset: 0, duration: 1, stagger: 0.12 }, 0.1)
        .to(q("[data-cursor]"), { autoAlpha: 1, duration: 0.3 }, 1.1);

      /* ── MANAGE ── */
      caption("manage", 0.6, 3.0);
      tl.to(q("[data-panel]"), { x: 0, autoAlpha: 1, duration: 0.7 }, 1.0).to(
        q("[data-gears]"),
        { autoAlpha: 1, duration: 0.5 },
        1.2,
      );
      TOGGLES_Y.forEach((y, i) => {
        const at = 1.35 + i * 0.4;
        cursorTo({ x: 186, y }, at, 0.3);
        tl.to(q(`[data-knob="${i}"]`), { x: 16, duration: 0.25, ease: "power2.out" }, at + 0.3);
      });
      cursorTo({ x: 150, y: SLIDERS_Y[0] ?? 226 }, 2.6, 0.3);
      tl.to(q('[data-slider-knob="0"]'), { x: 72, duration: 0.5, ease: "power2.inOut" }, 2.6)
        .to(q('[data-slider-knob="1"]'), { x: 40, duration: 0.5, ease: "power2.inOut" }, 2.7)
        .to(q("[data-panel]"), { x: -60, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 3.2)
        .to(q("[data-gears]"), { autoAlpha: 0, duration: 0.4 }, 3.2);

      /* ── CONSTRUCT ── */
      caption("construct", 3.45, 5.7);
      tl.to(q("[data-slot]"), { autoAlpha: 0.4, duration: 0.4, stagger: 0.06 }, 3.4);
      BLOCK_ORDER.forEach((key, i) => {
        const at = 3.7 + i * 0.36;
        cursorTo(key, at, 0.3);
        tl.to(q(`[data-block="${key}"]`), { autoAlpha: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" }, at + 0.22);
      });
      tl.to(q("[data-slot]"), { autoAlpha: 0, duration: 0.4 }, 6.0);

      /* ── CONTENT ── */
      caption("content", 6.15, 8.5);
      tl.to(q("[data-camera]"), { scale: 1.14, x: 34, y: 18, duration: 1, ease: "power2.inOut" }, 6.0);
      COPY_LINES.forEach((line, i) => {
        const at = 6.4 + i * 0.32;
        cursorTo({ x: 80 + line.w, y: line.y }, at, 0.3);
        tl.to(q(`[data-line="${i}"]`), { scaleX: 1, duration: 0.3, ease: "none" }, at);
      });
      cursorTo({ x: 360, y: 128 }, 7.7, 0.35);
      tl.to(q("[data-bulb]"), { autoAlpha: 1, duration: 0.2 }, 7.8)
        .to(q("[data-bulb] [data-draw]"), { strokeDashoffset: 0, duration: 0.7, stagger: 0.08 }, 7.8)
        .to(q("[data-camera]"), { scale: 1, x: 0, y: 0, duration: 1, ease: "power2.inOut" }, 8.4)
        .to(q("[data-bulb]"), { autoAlpha: 0, duration: 0.4 }, 8.7);

      /* ── REDESIGN ── */
      caption("redesign", 8.95, 10.9);
      cursorTo("hero", 8.9, 0.35);
      tl.to(q("[data-hero]"), { x: 156, duration: 0.9, ease: "power3.inOut" }, 9.3)
        .to(q("[data-image]"), { x: -212, duration: 0.9, ease: "power3.inOut" }, 9.3)
        .to(q("[data-curve] [data-draw]"), { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut" }, 9.9)
        .to(q("[data-anchor]"), { scale: 1, duration: 0.25, stagger: 1.1 }, 9.9);
      cursorTo({ x: 76, y: 284 }, 9.6, 0.3);
      cursorTo({ x: 404, y: 232 }, 9.95, 1.25);

      /* ── UPGRADE ── */
      caption("upgrade", 11.35, 14.4);
      tl.to(q("[data-page]"), { autoAlpha: 0.18, duration: 0.5 }, 11.2)
        .to(q("[data-curve] [data-draw]"), { strokeDashoffset: 1, duration: 0.4 }, 11.2)
        .to(q("[data-anchor]"), { scale: 0, duration: 0.2 }, 11.2)
        .to(q("[data-tag]"), { autoAlpha: 1, y: 0, duration: 0.6, ease: "back.out(1.6)" }, 11.4)
        .to(q("[data-tag] [data-draw]"), { strokeDashoffset: 0, duration: 0.5 }, 11.6)
        .to(q("[data-bar]"), { scaleX: 1, duration: 1.3, ease: "power2.inOut" }, 11.9)
        .to(q("[data-version-from]"), { autoAlpha: 0, y: -8, duration: 0.25 }, 13.1)
        .to(q("[data-version-to]"), { autoAlpha: 1, y: 0, duration: 0.35 }, 13.25)
        .to(q("[data-check] [data-draw]"), { strokeDashoffset: 0, duration: 0.6 }, 13.4);
      cursorTo({ x: 240, y: 270 }, 12.9, 0.4);

      /* ── Dissolve and loop ── */
      tl.to(
        q("[data-tag], [data-page], [data-cursor], [data-check]"),
        { autoAlpha: 0, duration: 0.6, ease: "power2.in" },
        14.6,
      )
        .to(q("[data-frame] [data-draw]"), { strokeDashoffset: 1, duration: 0.6, ease: "power2.in" }, 14.8)
        .to(q("[data-camera]"), { scale: 1.18, duration: 0.8, ease: "power2.in" }, 14.8)
        .set(q("[data-check]"), { autoAlpha: 1 }, 15.6);

      // Gears turn continuously; their visibility is choreographed by the timeline.
      const gears = gsap.to(q("[data-gear]"), {
        rotation: (i: number) => (i === 0 ? 360 : -540),
        transformOrigin: "50% 50%",
        duration: 8,
        ease: "none",
        repeat: -1,
      });

      if (reducedMotion) {
        tl.pause(STILL_FRAME_SECONDS);
        gears.pause();
      }
    },
    { scope: scopeRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return (
    <figure ref={scopeRef} aria-hidden className={cn("flex flex-col gap-5", className)}>
      <motion.svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="butt"
        className="min-h-0 w-full flex-1 overflow-hidden text-ink"
        style={{ x: lean.x, y: lean.y }}
      >
        <g data-camera>
          {/* Browser frame */}
          <g data-frame strokeWidth={1.25}>
            <path data-draw pathLength={1} d={rect(40, 20, 400, 300)} />
            <path data-draw pathLength={1} d="M40 52H440" />
            <path data-draw pathLength={1} d={`${rect(54, 32, 8, 8)}${rect(68, 32, 8, 8)}${rect(82, 32, 8, 8)}`} />
            <path data-draw pathLength={1} d={rect(150, 30, 180, 12)} opacity={0.5} />
          </g>

          {/* Page being built */}
          <g data-page>
            {BLOCK_ORDER.map((key) => {
              const [x, y, w, h] = BLOCKS[key];
              return <path key={`slot-${key}`} data-slot d={rect(x, y, w, h)} strokeDasharray="4 5" />;
            })}
            {BLOCK_ORDER.filter((key) => key !== "hero" && key !== "image").map((key) => {
              const [x, y, w, h] = BLOCKS[key];
              return (
                <path
                  key={key}
                  data-block={key}
                  d={rect(x, y, w, h)}
                  fill="currentColor"
                  fillOpacity={0.07}
                  strokeWidth={1.25}
                />
              );
            })}
            <g data-image>
              <path
                data-block="image"
                d={rect(...BLOCKS.image)}
                fill="currentColor"
                fillOpacity={0.07}
                strokeWidth={1.25}
              />
            </g>
            <g data-hero>
              <path
                data-block="hero"
                d={rect(...BLOCKS.hero)}
                fill="currentColor"
                fillOpacity={0.07}
                strokeWidth={1.25}
              />
              {COPY_LINES.map((line, i) => (
                <path key={line.y} data-line={i} d={`M80 ${line.y}H${80 + line.w}`} strokeWidth={line.width} />
              ))}
            </g>
            {/* Redesign pen curve */}
            <g data-curve strokeWidth={2}>
              <path data-draw pathLength={1} d={CURVE} />
            </g>
            <path data-anchor className="text-signal" fill="currentColor" d={rect(72, 280, 8, 8)} />
            <path data-anchor className="text-signal" fill="currentColor" d={rect(400, 228, 8, 8)} />
          </g>

          {/* Manage: settings panel + gears */}
          <g data-panel strokeWidth={1.25}>
            <path d={rect(56, 84, 160, 196)} fill="var(--bg-primary)" />
            {TOGGLES_Y.map((y, i) => (
              <g key={y}>
                <path d={`M74 ${y}H134`} strokeWidth={2} />
                <path d={rect(164, y - 8, 34, 16)} />
                <circle
                  data-knob={i}
                  cx={172}
                  cy={y}
                  r={5}
                  fill="currentColor"
                  stroke="none"
                  className={i === 1 ? "text-signal" : undefined}
                />
              </g>
            ))}
            {SLIDERS_Y.map((y, i) => (
              <g key={y}>
                <path d={`M74 ${y}H198`} opacity={0.4} />
                <circle data-slider-knob={i} cx={84} cy={y} r={6} fill="var(--bg-primary)" />
              </g>
            ))}
          </g>
          <g data-gears strokeWidth={1.25}>
            <path data-gear d={gearPath(330, 170, 12, 40, 52)} fill="var(--bg-primary)" />
            <circle cx={330} cy={170} r={12} />
            <path data-gear className="text-signal" d={gearPath(400, 240, 8, 22, 34)} fill="var(--bg-primary)" />
          </g>

          {/* Content: the idea */}
          <g data-bulb strokeWidth={1.5}>
            <path data-draw pathLength={1} d="M372 142a26 26 0 1 0 -26 0v14h26z M352 166h14 M354 174h10" />
            <path data-draw pathLength={1} className="text-signal" d="M354 132l5 -10l5 10" />
            <path data-draw pathLength={1} d="M359 82V70M392 96l9 -8M326 96l-9 -8M402 124h12M316 124h-12" />
          </g>

          {/* Upgrade: version tag, progress, done */}
          <g data-tag strokeWidth={1.5}>
            <path data-draw pathLength={1} d={rect(176, 112, 128, 52)} fill="var(--bg-primary)" />
            <path data-draw pathLength={1} d="M240 104V84M230 94l10 -10l10 10" />
            <text
              data-version-from
              x={240}
              y={145}
              textAnchor="middle"
              fill="currentColor"
              stroke="none"
              fontSize={22}
              className="font-technical"
            >
              {illustration.versionFrom}
            </text>
            <text
              data-version-to
              x={240}
              y={145}
              textAnchor="middle"
              fill="currentColor"
              stroke="none"
              fontSize={22}
              className="font-technical text-signal"
            >
              {illustration.versionTo}
            </text>
            <path d="M100 210H380" strokeWidth={6} opacity={0.12} />
            <path data-bar className="text-signal" d="M100 210H380" strokeWidth={6} />
          </g>
          <g data-check strokeWidth={1.75}>
            <path data-draw pathLength={1} d="M240 262m-20 0a20 20 0 1 0 40 0a20 20 0 1 0 -40 0 M231 263l6 6l13 -14" />
          </g>

          {/* The actor: signal-orange cursor */}
          <g data-cursor className="text-signal" strokeWidth={1.4}>
            <circle cx={0} cy={0} r={7} />
            <path d="M0 -13V13M-13 0H13" />
            <circle cx={0} cy={0} r={2} fill="currentColor" stroke="none" />
          </g>
        </g>
      </motion.svg>

      {/* Film subtitles */}
      <figcaption className="relative h-4 text-center font-technical text-micro tracking-[0.3em] text-graphite uppercase">
        {CAPTION_SCENES.map((scene) => {
          const label = captionFor(scene);
          return label ? (
            <span key={scene} data-caption={scene} className="invisible absolute inset-x-0 top-0">
              {label}
            </span>
          ) : null;
        })}
      </figcaption>
    </figure>
  );
};
