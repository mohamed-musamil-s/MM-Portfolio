"use client";

import { Instrument_Serif } from "next/font/google";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/shared/cn";
import type { SplashContent } from "@/lib/shared/content/splash-schema";
import { MONOGRAM_LETTERS, MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";
import {
  EXIT_AT,
  EXIT_SECONDS,
  LOOP_SECONDS,
  TIMES,
  cameraAt,
  cardAt,
  dissolvedAt,
  dotAt,
  dustAt,
  exitAt,
  glitchAt,
  gridOf,
  heroAt,
  inMono,
  linkDistance,
  poolAt,
  revealAt,
  starsAt,
  streakAt,
  toScreen,
  type Box,
  type Point,
  type Reveal,
  type SplashLayout,
} from "./splash-timeline";

/*
 * Renders the name splash (docs/screens/SPLASH_BUSINESS.md): a dark,
 * warm-lit stage. The markup is static; `paint(t)` writes every moving style
 * from the timeline functions and draws the particles on one canvas. A
 * requestAnimationFrame loop only supplies `t`.
 *
 * `overlay`: plays once over the page, then wipes away (Skip / Esc end it early).
 * `preview`: loops in Content Forge's preview frame; Skip restarts it.
 */

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", display: "swap" });

type Variant = "overlay" | "preview";
type Node = HTMLElement | SVGElement;
type Nodes = Map<string, Node>;
type Rgb = readonly [number, number, number];
type Stage = { layout: SplashLayout; outlineLength: number; paper: Rgb; signal: Rgb };
type Bind = (key: string) => (node: Node | null) => void;

const STREAKS = [0, 1] as const;
const MONO_RATIO = MONOGRAM_VIEWBOX.width / MONOGRAM_VIEWBOX.height;
const MAX_DUST = 700;

/* ---------- Measuring (layout only: transforms are ignored) ---------- */

const html = (nodes: Nodes, key: string): HTMLElement => {
  const node = nodes.get(key);
  if (!(node instanceof HTMLElement)) {
    throw new Error(`splash: missing element ${key}`);
  }
  return node;
};

/** Box of `element` relative to `root`, from offsets, so the camera's transform never skews it. */
const boxIn = (element: HTMLElement, root: HTMLElement): Box => {
  let x = 0;
  let y = 0;
  let node: Element | null = element;
  while (node instanceof HTMLElement && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return { x, y, w: element.offsetWidth, h: element.offsetHeight };
};

/** Sets the font size, shrinking it when `measured` would be wider than `maxWidth`. */
const fitFont = (sized: HTMLElement, measured: HTMLElement, fs: number, maxWidth: number): number => {
  sized.style.fontSize = `${fs}px`;
  const fitted = measured.offsetWidth > maxWidth ? (fs * maxWidth) / measured.offsetWidth : fs;
  sized.style.fontSize = `${fitted}px`;
  return fitted;
};

const rgbOf = (color: string): Rgb => {
  const hex = color.trim().replace("#", "");
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const value = Number.parseInt(full, 16);
  return Number.isNaN(value) ? [255, 255, 255] : [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

/** Pixels of the claim word, drawn with its own font, as stage points. */
const sampleText = (element: HTMLElement, box: Box, baseline: number): Point[] => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(box.w));
  canvas.height = Math.max(1, Math.ceil(box.h * 1.3));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return [];
  }
  const style = getComputedStyle(element);
  context.font = style.font;
  context.letterSpacing = style.letterSpacing;
  context.fillStyle = "#fff";
  context.fillText(element.textContent ?? "", 0, baseline);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const step = Math.max(2, Math.round(Math.sqrt((canvas.width * canvas.height) / 2500)));
  const points: Point[] = [];
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      if (data[(y * canvas.width + x) * 4 + 3] > 128) {
        points.push({ x: box.x + x, y: box.y + y });
      }
    }
  }
  const stride = Math.max(1, Math.ceil(points.length / MAX_DUST));
  return points.filter((_, index) => index % stride === 0);
};

const measure = (nodes: Nodes): Stage => {
  const root = html(nodes, "camera");
  const width = root.offsetWidth;
  const height = root.offsetHeight;

  const row = html(nodes, "line-row");
  const lineFs = fitFont(row, row, Math.min(0.085 * width, 0.12 * height), 0.9 * width);
  html(nodes, "subtitle").style.fontSize = `${Math.max(12, lineFs * 0.22)}px`;
  fitFont(html(nodes, "end"), html(nodes, "end-row"), Math.min(0.06 * width, 0.085 * height), 0.88 * width);

  const heroWidth = Math.min(0.5 * width, 0.5 * height * MONO_RATIO);
  const heroHeight = heroWidth / MONO_RATIO;
  const hero = { x: (width - heroWidth) / 2, y: (height - heroHeight) / 2, w: heroWidth, h: heroHeight };

  const cards = gridOf(width, height);
  cards.forEach((card, index) => {
    const element = nodes.get(`card-${index}`);
    if (element instanceof HTMLElement) {
      element.style.width = `${card.w}px`;
      element.style.height = `${card.h}px`;
      element.style.fontSize = `${card.w / 11}px`;
    }
  });

  const claimElement = html(nodes, "claim");
  const claimBox = boxIn(claimElement, root);
  const claimEnd = boxIn(html(nodes, "claim-end"), root);
  const body = nodes.get("hero-body");
  const outlineLength = body instanceof SVGPathElement ? body.getTotalLength() : 0;
  const outline =
    body instanceof SVGPathElement
      ? Array.from({ length: 90 }, (_, index) => {
          const point = body.getPointAtLength((index / 90) * outlineLength);
          return { x: point.x, y: point.y };
        })
      : [];

  const canvas = nodes.get("canvas");
  if (canvas instanceof HTMLCanvasElement) {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }

  const tokens = getComputedStyle(html(nodes, "root"));
  return {
    layout: {
      width,
      height,
      hero,
      glyph: boxIn(html(nodes, "glyph"), root),
      endGlyph: boxIn(html(nodes, "end-glyph"), root),
      claim: { ...claimBox, fs: lineFs },
      dust: sampleText(claimElement, claimBox, claimEnd.y - claimBox.y),
      outline,
      cards,
    },
    outlineLength,
    paper: rgbOf(tokens.getPropertyValue("--bg-primary")),
    signal: rgbOf(tokens.getPropertyValue("--signal")),
  };
};

/** Null while the markup is not (or no longer) mounted, e.g. a resize callback after unmount. */
const measureIfMounted = (nodes: Nodes): Stage | null => (nodes.get("camera")?.isConnected ? measure(nodes) : null);

/* ---------- Painting one frame ---------- */

const px = (value: number) => `${value}px`;
const rgba = ([r, g, b]: Rgb, alpha: number) => `rgb(${r} ${g} ${b} / ${alpha.toFixed(3)})`;

const paintReveal = (nodes: Nodes, key: string, reveal: Reveal, extra = "") => {
  const style = nodes.get(key)?.style;
  if (!style) {
    return;
  }
  style.opacity = reveal.opacity.toFixed(3);
  style.filter = reveal.blur > 0.3 ? `blur(${reveal.blur.toFixed(1)}px)` : "none";
  style.transform = `translateY(${reveal.y}em)${extra}`;
};

const drawParticles = (canvas: HTMLCanvasElement, stage: Stage, t: number) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  const { layout, paper, signal } = stage;
  const ratio = canvas.width / layout.width;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, layout.width, layout.height);

  const { stars, links } = starsAt(t, layout);
  if (links > 0.01) {
    const reach = linkDistance(layout);
    context.lineWidth = 0.6;
    for (let a = 1; a < stars.length; a += 1) {
      for (let b = a + 1; b < stars.length; b += 1) {
        const distance = Math.hypot(stars[a].x - stars[b].x, stars[a].y - stars[b].y);
        if (distance < reach) {
          context.strokeStyle = rgba(stars[a].accent ? signal : paper, (1 - distance / reach) * 0.28 * links);
          context.beginPath();
          context.moveTo(stars[a].x, stars[a].y);
          context.lineTo(stars[b].x, stars[b].y);
          context.stroke();
        }
      }
    }
  }
  for (const particle of [...stars, ...dustAt(t, layout)]) {
    if (particle.alpha > 0.01) {
      context.fillStyle = rgba(particle.accent ? signal : paper, particle.alpha);
      context.beginPath();
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fill();
    }
  }
};

const paint = (nodes: Nodes, stage: Stage, t: number, exitStart: number | null) => {
  const { layout, outlineLength } = stage;
  const camera = cameraAt(t, layout);
  const cameraStyle = nodes.get("camera")?.style;
  if (cameraStyle) {
    cameraStyle.transform = `translate(${layout.width / 2}px, ${layout.height / 2}px) rotate(${camera.rotate}rad) scale(${camera.scale}) translate(${-camera.focus.x}px, ${-camera.focus.y}px)`;
  }

  // Warm light pool, in screen space, following the light on the mark.
  const hero = heroAt(t, layout);
  const pool = nodes.get("pool")?.style;
  if (pool) {
    const light = toScreen(inMono(hero.box, hero.light), camera, layout);
    const reach = 0.6 * Math.hypot(layout.width, layout.height);
    pool.background = `radial-gradient(circle at ${light.x}px ${light.y}px, color-mix(in srgb, var(--signal) ${(17 * poolAt(t)).toFixed(1)}%, transparent) 0, transparent ${reach}px)`;
  }

  // The monogram: dark and rim-lit, brightening as it lands.
  const heroStyle = nodes.get("hero")?.style;
  if (heroStyle) {
    heroStyle.width = px(hero.box.w);
    heroStyle.height = px(hero.box.h);
    heroStyle.transform = `translate(${hero.box.x}px, ${hero.box.y}px)`;
    heroStyle.opacity = hero.opacity.toFixed(3);
    heroStyle.filter =
      hero.halo > 0.01
        ? `drop-shadow(0 0 ${(hero.box.h * 0.25 * hero.halo).toFixed(1)}px color-mix(in srgb, var(--signal) ${(70 * hero.halo).toFixed(0)}%, transparent))`
        : "none";
  }
  const body = nodes.get("hero-body")?.style;
  if (body) {
    body.fill = `color-mix(in srgb, var(--bg-primary) ${hero.lit.toFixed(1)}%, var(--text-primary))`;
  }
  const sheen = nodes.get("hero-sheen")?.style;
  if (sheen) {
    sheen.opacity = (1 - (hero.lit - 8) / 84).toFixed(3);
  }
  const lightSpot = nodes.get("hero-light");
  lightSpot?.setAttribute("cx", hero.light.x.toFixed(1));
  lightSpot?.setAttribute("cy", hero.light.y.toFixed(1));
  const unit = (hero.box.w / MONOGRAM_VIEWBOX.width) * camera.scale;
  const dash = outlineLength * 0.07;
  STREAKS.forEach((index) => {
    const offset = -streakAt(t, index) * outlineLength;
    for (const [key, width] of [
      [`streak-${index}`, 2],
      [`streak-glow-${index}`, 6],
    ] as const) {
      const style = nodes.get(key)?.style;
      if (style) {
        style.strokeDasharray = `${dash} ${outlineLength - dash}`;
        style.strokeDashoffset = `${offset}`;
        style.strokeWidth = `${width / unit}`;
        style.opacity = hero.streaks.toFixed(3);
      }
    }
  });

  // Claim line: "MM. = Two letters", struck, glitched, dissolved, answered with "?".
  paintReveal(nodes, "eq", revealAt(t, TIMES.claimIn, TIMES.lineOut));
  const glitch = glitchAt(t, layout);
  paintReveal(nodes, "claim", revealAt(t, TIMES.claimIn), glitch ? ` translateX(${(glitch * 0.4).toFixed(1)}px)` : "");
  const claim = nodes.get("claim")?.style;
  if (claim) {
    claim.clipPath = `inset(-30% -10% -30% ${(dissolvedAt(t) * 112).toFixed(1)}%)`;
    claim.textShadow = glitch
      ? `${glitch.toFixed(1)}px 0 rgb(255 40 90 / 0.75), ${(-glitch).toFixed(1)}px 0 rgb(40 200 255 / 0.75)`
      : "none";
  }
  paintReveal(nodes, "question", revealAt(t, TIMES.questionIn, TIMES.lineOut));
  paintReveal(nodes, "subtitle", revealAt(t, TIMES.subtitleIn, TIMES.lineOut));

  // Cards.
  layout.cards.forEach((_, index) => {
    const style = nodes.get(`card-${index}`)?.style;
    if (style) {
      const card = cardAt(t, layout, index);
      style.opacity = card.opacity.toFixed(3);
      style.filter = card.blur > 0.3 ? `blur(${card.blur.toFixed(1)}px)` : "none";
      style.transform = `translate(${card.x}px, ${card.y}px) scale(${card.scale})`;
    }
  });

  const canvas = nodes.get("canvas");
  if (canvas instanceof HTMLCanvasElement) {
    drawParticles(canvas, stage, t);
  }

  // The dot: the through-line, glowing.
  const dot = dotAt(t, layout);
  const dotStyle = nodes.get("dot")?.style;
  if (dotStyle) {
    const glow = Math.max(0, dot.glow);
    const size = Math.max(dot.h, 6);
    dotStyle.width = px(dot.w);
    dotStyle.height = px(dot.h);
    dotStyle.borderRadius = px(Math.min(dot.w, dot.h) / 2);
    dotStyle.transform = `translate(${dot.x - dot.w / 2}px, ${dot.y - dot.h / 2}px)`;
    dotStyle.boxShadow = `0 0 ${(size * 2.2 * glow).toFixed(1)}px ${(size * 0.4 * glow).toFixed(1)}px color-mix(in srgb, var(--signal) ${(65 * glow).toFixed(0)}%, transparent)`;
  }

  // End card.
  paintReveal(nodes, "name", revealAt(t, TIMES.nameIn));
  paintReveal(nodes, "role", revealAt(t, TIMES.roleIn));
  paintReveal(nodes, "tagline", revealAt(t, TIMES.taglineIn));
  paintReveal(nodes, "label", revealAt(t, TIMES.labelIn));

  const root = nodes.get("root")?.style;
  if (root && exitStart !== null) {
    root.clipPath = `inset(0 0 ${exitAt(t, exitStart) * 100}% 0)`;
  }
};

/* ---------- Markup ---------- */

/** First paint (server HTML): everything moving starts hidden until the clock runs. */
const HIDDEN: CSSProperties = { opacity: 0 };

/** Element registry filled by ref callbacks; paint() looks elements up by key. */
const createRegistry = (): { nodes: Nodes; bind: Bind } => {
  const nodes: Nodes = new Map();
  const bind: Bind = (key) => (node) => {
    if (node) {
      nodes.set(key, node);
    } else {
      nodes.delete(key);
    }
  };
  return { nodes, bind };
};

const Bar = ({ className }: { className: string }) => (
  <span className={cn("block h-[0.38em] rounded-full", className)} />
);

/** A dark glass card like a feed item; the three moment cards carry a word. */
const GlassCard = ({ index, bind, word, lead }: { index: number; bind: Bind; word?: string; lead: boolean }) => (
  <div
    ref={bind(`card-${index}`)}
    style={HIDDEN}
    className={cn(
      "absolute top-0 left-0 flex flex-col justify-between rounded-[0.9em] border bg-paper/4 p-[0.9em]",
      lead ? "border-signal/60 shadow-[0_0_3em_-0.6em_var(--signal)]" : word ? "border-paper/15" : "border-paper/8",
    )}
  >
    <div className="flex items-center gap-[0.6em]">
      <span className="size-[1.6em] rounded-full bg-paper/10" />
      <span className="flex flex-col gap-[0.35em]">
        <Bar className="w-[5em] bg-paper/15" />
        <Bar className="w-[3em] bg-paper/10" />
      </span>
      {lead ? null : <span className="ml-auto size-[0.6em] self-start rounded-full bg-paper/15" />}
    </div>
    {word ? (
      <p className="text-[2.1em] leading-none font-bold tracking-tight text-paper">{word}</p>
    ) : (
      <div className="flex flex-col gap-[0.45em]">
        <Bar className="w-full bg-paper/8" />
        <Bar className="w-4/5 bg-paper/8" />
      </div>
    )}
    <div className="flex gap-[1.2em]">
      <Bar className="w-[1.6em] bg-paper/8" />
      <Bar className="w-[1.6em] bg-paper/8" />
      <Bar className="w-[1.6em] bg-paper/8" />
    </div>
  </div>
);

/** Card slots in paint order: the lead card last, so it sits on top of the two it deals out. */
const CARD_SLOTS = gridOf(1280, 800)
  .map((card, index) => ({ moment: card.moment, index }))
  .sort((a, b) => Number(a.moment === 0) - Number(b.moment === 0));

type NameSplashProps = {
  content: SplashContent;
  variant: Variant;
  /** Overlay only: called once the exit wipe has finished. */
  onFinished?: () => void;
};

export const NameSplash = ({ content, variant, onFinished }: NameSplashProps) => {
  const [{ nodes, bind }] = useState(createRegistry);
  const stage = useRef<Stage | null>(null);
  const start = useRef(0);
  const exitStart = useRef<number | null>(variant === "overlay" ? EXIT_AT : null);
  const paused = useRef(false);
  const lastT = useRef(0);
  const finished = useRef(onFinished);
  const ids = useId().replace(/[^a-zA-Z0-9]/g, "");
  const words = [content.moments.first, content.moments.second, content.moments.third];

  useEffect(() => {
    finished.current = onFinished;
  }, [onFinished]);

  // Re-measure when the words change (preview drafts).
  useLayoutEffect(() => {
    if (stage.current) {
      stage.current = measureIfMounted(nodes);
    }
  }, [content, nodes]);

  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    const root = nodes.get("root");
    const resize = new ResizeObserver(() => {
      if (stage.current) {
        stage.current = measureIfMounted(nodes);
      }
    });
    const tick = (now: number) => {
      const elapsed = (now - start.current) / 1000;
      const t = variant === "preview" ? elapsed % LOOP_SECONDS : elapsed;
      if (!paused.current && stage.current) {
        lastT.current = t;
        paint(nodes, stage.current, t, exitStart.current);
        if (exitStart.current !== null && t >= exitStart.current + EXIT_SECONDS) {
          finished.current?.();
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    // Measure with the real typefaces; don't wait forever for them.
    const fonts = Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
    void fonts.then(() => {
      if (cancelled) {
        return;
      }
      stage.current = measureIfMounted(nodes);
      if (root instanceof HTMLElement) {
        resize.observe(root);
      }
      start.current = performance.now();
      frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [variant, nodes]);

  const skip = () => {
    if (variant === "preview") {
      start.current = performance.now();
      return;
    }
    exitStart.current = Math.min(lastT.current, exitStart.current ?? EXIT_AT);
  };

  useEffect(() => {
    if (variant !== "overlay") {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        exitStart.current = Math.min(lastT.current, exitStart.current ?? EXIT_AT);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  // Development only: window.__splash.seek(t) freezes on a frame, play() resumes.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    const target = window as Window & { __splash?: { seek: (t: number) => void; play: () => void } };
    target.__splash = {
      seek: (t) => {
        paused.current = true;
        if (stage.current) {
          paint(nodes, stage.current, t, exitStart.current);
        }
      },
      play: () => {
        paused.current = false;
        start.current = performance.now();
      },
    };
    return () => {
      delete target.__splash;
    };
  }, [nodes]);

  return (
    <section
      ref={bind("root")}
      aria-label={content.srLabel}
      className={cn(
        "overflow-hidden bg-ink font-grotesk text-paper",
        variant === "overlay" ? "fixed inset-0 z-55" : "relative h-svh",
      )}
    >
      <p className="sr-only">
        {content.name.first} {content.name.last}. {content.role}
      </p>
      <div ref={bind("pool")} aria-hidden className="absolute inset-0" />

      <div ref={bind("camera")} aria-hidden className="absolute inset-0 origin-top-left">
        {CARD_SLOTS.map(({ moment, index }) => (
          <GlassCard
            key={index}
            index={index}
            bind={bind}
            lead={moment === 0}
            word={moment === null ? undefined : words[moment]}
          />
        ))}

        <canvas ref={bind("canvas")} className="absolute inset-0 size-full" />

        {/* Claim line. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            ref={bind("line-row")}
            className="flex items-baseline gap-[0.28em] leading-none font-bold tracking-tight"
          >
            <span ref={bind("glyph")} className="inline-block h-[0.72em] w-[1.753em]" />
            <span ref={bind("eq")} style={HIDDEN} className="inline-block">
              =
            </span>
            <span className="relative inline-block">
              <span ref={bind("claim")} style={HIDDEN} className="inline-block whitespace-pre">
                {content.claim.word}
                <span ref={bind("claim-end")} className="inline-block size-0" />
              </span>
              <span
                ref={bind("question")}
                style={HIDDEN}
                className={cn(serif.className, "absolute top-0 left-0 inline-block text-[1.15em] font-normal")}
              >
                {content.claim.question}
              </span>
            </span>
          </div>
          <p ref={bind("subtitle")} style={HIDDEN} className="mt-[1.4em] font-medium text-paper/60">
            {content.claim.subtitle}
          </p>
        </div>

        {/* End card. */}
        <div ref={bind("end")} className="absolute inset-0 flex flex-col items-center justify-center">
          <div ref={bind("end-row")} className="flex items-center gap-[0.4em]">
            <span ref={bind("end-glyph")} className="inline-block h-[0.8em] w-[1.948em] shrink-0" />
            <span
              ref={bind("name")}
              style={HIDDEN}
              className="inline-block leading-none font-bold tracking-tight whitespace-nowrap"
            >
              {content.name.first} {content.name.last}
            </span>
          </div>
          <p
            ref={bind("role")}
            style={HIDDEN}
            className="mt-[0.55em] text-[length:max(13px,0.42em)] font-semibold text-paper/85"
          >
            {content.role}
          </p>
          <p
            ref={bind("tagline")}
            style={HIDDEN}
            className={cn(serif.className, "mt-[0.1em] text-[1.05em] leading-tight")}
          >
            {content.tagline}
          </p>
          <p
            ref={bind("label")}
            style={HIDDEN}
            className="mt-[1.2em] text-[length:max(10px,0.2em)] font-medium tracking-[0.18em] text-paper/45 uppercase"
          >
            {content.label}
          </p>
        </div>

        {/* The monogram: rim-lit letters with light streaks running along the outline. */}
        <div ref={bind("hero")} style={HIDDEN} className="absolute top-0 left-0">
          <svg
            viewBox={`0 0 ${MONOGRAM_VIEWBOX.width} ${MONOGRAM_VIEWBOX.height}`}
            className="block size-full overflow-visible"
          >
            <defs>
              <radialGradient
                ref={bind("hero-light")}
                id={`${ids}-light`}
                gradientUnits="userSpaceOnUse"
                cx="40"
                cy="10"
                r="230"
              >
                <stop offset="0" stopColor="var(--signal)" stopOpacity="0.3" />
                <stop offset="0.45" stopColor="var(--signal)" stopOpacity="0.07" />
                <stop offset="1" stopColor="var(--signal)" stopOpacity="0" />
              </radialGradient>
              <filter id={`${ids}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            <path ref={bind("hero-body")} d={MONOGRAM_LETTERS} />
            <path ref={bind("hero-sheen")} d={MONOGRAM_LETTERS} fill={`url(#${ids}-light)`} />
            {STREAKS.map((index) => (
              <g key={index} fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path
                  ref={bind(`streak-glow-${index}`)}
                  d={MONOGRAM_LETTERS}
                  stroke="var(--signal)"
                  filter={`url(#${ids}-glow)`}
                />
                <path
                  ref={bind(`streak-${index}`)}
                  d={MONOGRAM_LETTERS}
                  stroke="color-mix(in srgb, var(--signal) 55%, var(--bg-primary))"
                />
              </g>
            ))}
          </svg>
        </div>

        <div ref={bind("dot")} className="absolute top-0 left-0 size-0 rounded-full bg-signal" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--text-primary)_100%)] opacity-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url(/textures/grain.svg)] bg-size-[256px] opacity-6 mix-blend-screen"
      />

      <button
        type="button"
        onClick={skip}
        className="absolute right-4 bottom-4 text-xs font-semibold tracking-[0.2em] text-paper/55 uppercase underline-offset-4 hover:text-paper hover:underline focus-visible:text-paper focus-visible:underline focus-visible:outline-none sm:right-8 sm:bottom-8"
      >
        {content.skip}
      </button>
    </section>
  );
};
