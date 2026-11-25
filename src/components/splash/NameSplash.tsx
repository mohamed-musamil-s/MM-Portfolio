"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/shared/cn";
import type { SplashContent } from "@/lib/shared/content/splash-schema";
import { MONOGRAM_LETTERS, MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";
import {
  EXIT_AT,
  EXIT_SECONDS,
  TIMES,
  bannerAt,
  cameraScaleAt,
  cursorAt,
  dotAt,
  exitHoleAt,
  floodAt,
  letterAt,
  logoAt,
  matrixAt,
  periodOf,
  pillAt,
  rand,
  riseAt,
  signatureAt,
  solidAt,
  toScreen,
  type Box,
  type GridDot,
  type SplashLayout,
  type WordLayout,
} from "./splash-timeline";

/*
 * Renders the name splash (docs/screens/SPLASH_BUSINESS.md) on the
 * portfolio's paper surface with its own three typefaces. The markup is
 * static; `paint(t)` writes every moving style from the timeline functions
 * and draws the dot matrix on one canvas. A requestAnimationFrame loop only
 * supplies `t`.
 *
 * Plays once over the home page; the clicked call to action, Skip or Esc
 * open a hole onto the page beneath.
 */

type Node = HTMLElement | SVGElement;
type Nodes = Map<string, Node>;
type Rgb = readonly [number, number, number];
type Stage = { layout: SplashLayout; letters: Path2D; ink: Rgb; faint: Rgb };
type Bind = (key: string) => (node: Node | null) => void;

const MOMENT_KEYS = ["moment-0", "moment-1", "moment-2"] as const;
const FLOOD_KEYS = ["flood-0", "flood-1", "flood-2"] as const;
const MONO_RATIO = MONOGRAM_VIEWBOX.width / MONOGRAM_VIEWBOX.height;
const STOP_RADIUS = 0.085;

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

/** Sets the font size, shrinking it when the widest of `measured` would be wider than `maxWidth`. */
const fitFont = (sized: HTMLElement, measured: HTMLElement[], fs: number, maxWidth: number): number => {
  sized.style.fontSize = `${fs}px`;
  const widest = Math.max(...measured.map((element) => element.offsetWidth));
  const fitted = widest > maxWidth ? (fs * maxWidth) / widest : fs;
  sized.style.fontSize = `${fitted}px`;
  return fitted;
};

const wordIn = (nodes: Nodes, root: HTMLElement, key: string, fs: number): WordLayout => {
  const end = boxIn(html(nodes, `${key}-end`), root);
  return { box: boxIn(html(nodes, key), root), end: { x: end.x, y: end.y }, fs };
};

const rgbOf = (color: string): Rgb => {
  const hex = color.trim().replace("#", "");
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const value = Number.parseInt(full, 16);
  return Number.isNaN(value) ? [0, 0, 0] : [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

/** Grid of dots over the whole frame, tagged with whether each one falls inside the monogram. */
const buildGrid = (width: number, height: number, logo: Box, origin: { x: number; y: number }, letters: Path2D) => {
  const spacing = Math.min(44, Math.max(12, Math.min(width, height) / 18));
  const probe = document.createElement("canvas").getContext("2d");
  const period = periodOf(logo);
  const diagonal = Math.hypot(width, height);
  const dots: GridDot[] = [];
  const columns = Math.ceil(width / spacing) + 1;
  const rows = Math.ceil(height / spacing) + 1;
  const left = (width - (columns - 1) * spacing) / 2;
  const top = (height - (rows - 1) * spacing) / 2;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = left + column * spacing;
      const y = top + row * spacing;
      const vx = ((x - logo.x) / logo.w) * MONOGRAM_VIEWBOX.width;
      const vy = ((y - logo.y) / logo.h) * MONOGRAM_VIEWBOX.height;
      dots.push({
        x,
        y,
        inside: probe?.isPointInPath(letters, vx, vy) ?? false,
        period: Math.hypot(x - period.x, y - period.y) < period.size * 0.8,
        distance: Math.hypot(x - origin.x, y - origin.y) / diagonal,
        seed: rand(row * columns + column, 4),
      });
    }
  }
  return { spacing, dots };
};

const measure = (nodes: Nodes): Stage => {
  const root = html(nodes, "camera");
  const width = root.offsetWidth;
  const height = root.offsetHeight;
  const small = Math.min(22, Math.max(13, 0.014 * width));

  html(nodes, "intro-slot").style.fontSize = `${small}px`;
  html(nodes, "bracket").style.fontSize = `${small}px`;
  const bigFs = fitFont(
    html(nodes, "stack"),
    [html(nodes, "hello"), html(nodes, "name")],
    Math.min(0.2 * width, 0.28 * height),
    0.84 * width,
  );
  const momentFs = MOMENT_KEYS.map((key) =>
    fitFont(html(nodes, `${key}-slot`), [html(nodes, key)], Math.min(0.12 * width, 0.17 * height), 0.88 * width),
  );
  fitFont(html(nodes, "end"), [html(nodes, "signature")], Math.min(0.08 * width, 0.1 * height), 0.86 * width);

  const logoWidth = Math.min(0.62 * width, 0.42 * height * MONO_RATIO);
  const logo = {
    x: (width - logoWidth) / 2,
    y: (height - logoWidth / MONO_RATIO) / 2,
    w: logoWidth,
    h: logoWidth / MONO_RATIO,
  };
  html(nodes, "detail").style.top = `${logo.y + logo.h + Math.max(24, 0.05 * height)}px`;
  html(nodes, "detail").style.fontSize = `${small}px`;

  const moments = MOMENT_KEYS.map((key, index) => wordIn(nodes, root, key, momentFs[index]));
  const last = moments[2];
  const origin = { x: last.end.x + (0.05 + STOP_RADIUS) * last.fs, y: last.end.y - STOP_RADIUS * last.fs };
  const letters = new Path2D(MONOGRAM_LETTERS);

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
      intro: wordIn(nodes, root, "intro", small),
      hello: wordIn(nodes, root, "hello", bigFs),
      name: wordIn(nodes, root, "name", bigFs),
      moments: [moments[0], moments[1], moments[2]],
      logo,
      endLogo: boxIn(html(nodes, "end-logo"), root),
      pill: boxIn(html(nodes, "pill"), root),
      grid: buildGrid(width, height, logo, origin, letters),
    },
    letters,
    ink: rgbOf(tokens.getPropertyValue("--text-primary")),
    faint: rgbOf(tokens.getPropertyValue("--text-secondary")),
  };
};

/** Null while the markup is not (or no longer) mounted, e.g. a resize callback after unmount. */
const measureIfMounted = (nodes: Nodes): Stage | null => (nodes.get("camera")?.isConnected ? measure(nodes) : null);

/* ---------- Painting one frame ---------- */

const px = (value: number) => `${value}px`;
/** A 0..1 share as a CSS percentage; springs overshoot, and color-mix() rejects anything past 100%. */
const percent = (share: number) => `${Math.round(Math.min(1, Math.max(0, share)) * 100)}%`;
const rgba = ([r, g, b]: Rgb, alpha: number) => `rgb(${r} ${g} ${b} / ${alpha})`;

const rise = (nodes: Nodes, key: string, offset: number) => {
  const style = nodes.get(key)?.style;
  if (style) {
    style.transform = `translate3d(0, ${offset}%, 0)`;
  }
};

const drawMatrix = (canvas: HTMLCanvasElement, stage: Stage, t: number) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  const { layout } = stage;
  const ratio = canvas.width / layout.width;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, layout.width, layout.height);
  const { dots, clipToLetters } = matrixAt(t, layout);
  if (dots.length === 0) {
    return;
  }
  context.save();
  if (clipToLetters) {
    // Swelling dots merge into the letters exactly, so the solid mark can take over unnoticed.
    const { logo } = layout;
    context.setTransform(
      (ratio * logo.w) / MONOGRAM_VIEWBOX.width,
      0,
      0,
      (ratio * logo.h) / MONOGRAM_VIEWBOX.height,
      ratio * logo.x,
      ratio * logo.y,
    );
    context.clip(stage.letters);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  for (const dot of dots) {
    context.fillStyle = dot.tone === "ink" ? rgba(stage.ink, 1) : rgba(stage.faint, 0.3);
    context.beginPath();
    context.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
};

const paint = (nodes: Nodes, stage: Stage, t: number, exitStart: number) => {
  const { layout } = stage;
  const scale = cameraScaleAt(t);
  const camera = nodes.get("camera")?.style;
  if (camera) {
    camera.transform = `scale(${scale})`;
  }

  // Colour floods, in screen space so the camera never shows their edges.
  FLOOD_KEYS.forEach((key, index) => {
    const style = nodes.get(key)?.style;
    if (style) {
      const { origin, radius } = floodAt(t, index, layout);
      const center = toScreen(origin, scale, layout);
      style.visibility = radius < 0.5 ? "hidden" : "visible";
      style.width = px(radius * 2);
      style.height = px(radius * 2);
      style.transform = `translate(${center.x - radius}px, ${center.y - radius}px)`;
    }
  });

  rise(nodes, "intro", riseAt(t, TIMES.introIn, TIMES.introOut));
  rise(nodes, "bracket", riseAt(t, TIMES.bracketIn, TIMES.bracketOut));
  nodes.forEach((node, key) => {
    const match = /^(hello|name)-(\d+)$/.exec(key);
    if (match) {
      const isHello = match[1] === "hello";
      const offset = letterAt(
        t,
        Number(match[2]),
        isHello ? TIMES.helloIn : TIMES.nameIn,
        isHello ? TIMES.helloOut : TIMES.nameOut,
      );
      node.style.transform = `translate3d(0, ${offset}%, 0)`;
    }
  });
  MOMENT_KEYS.forEach((key, index) => rise(nodes, key, riseAt(t, TIMES.momentsIn[index], TIMES.momentsOut[index])));

  const canvas = nodes.get("canvas");
  if (canvas instanceof HTMLCanvasElement) {
    drawMatrix(canvas, stage, t);
  }
  rise(nodes, "detail-text", riseAt(t, TIMES.detailIn, TIMES.detailOut));

  const logo = logoAt(t, layout);
  const solid = nodes.get("logo")?.style;
  if (solid) {
    solid.visibility = solidAt(t) ? "visible" : "hidden";
    solid.width = px(logo.w);
    solid.height = px(logo.h);
    solid.transform = `translate(${logo.x}px, ${logo.y}px)`;
  }

  // End card: brush signature writes in, banner sweeps, the cursor clicks the pill.
  const signature = nodes.get("signature")?.style;
  if (signature) {
    const shown = signatureAt(t);
    signature.visibility = shown > 0 ? "visible" : "hidden";
    signature.clipPath = `inset(-30% ${((1 - shown) * 100).toFixed(2)}% -30% -10%)`;
  }
  const banner = nodes.get("banner")?.style;
  if (banner) {
    banner.transform = `scaleX(${bannerAt(t)})`;
  }
  rise(nodes, "role", riseAt(t, TIMES.roleIn));
  const pill = pillAt(t);
  const pillStyle = nodes.get("pill")?.style;
  if (pillStyle) {
    pillStyle.visibility = t >= TIMES.pillIn ? "visible" : "hidden";
    pillStyle.transform = `scale(${pill.scale})`;
    pillStyle.backgroundColor = `color-mix(in srgb, var(--signal) ${percent(pill.lit)}, var(--text-primary))`;
  }
  const cursor = cursorAt(t, layout);
  const cursorStyle = nodes.get("cursor")?.style;
  if (cursorStyle) {
    cursorStyle.visibility = cursor.shown ? "visible" : "hidden";
    cursorStyle.transform = `translate(${cursor.x}px, ${cursor.y}px) scale(${cursor.scale})`;
  }

  // The dot.
  const dot = dotAt(t, layout);
  const dotStyle = nodes.get("dot")?.style;
  if (dotStyle) {
    dotStyle.width = px(dot.size);
    dotStyle.height = px(dot.size);
    dotStyle.transform = `translate(${dot.x - dot.size / 2}px, ${dot.y - dot.size / 2}px)`;
    dotStyle.backgroundColor = `color-mix(in srgb, var(--text-primary) ${percent(dot.ink)}, var(--signal))`;
  }

  // Exit: a hole opens onto the page from the clicked pill (or from the dot when skipped early).
  const root = nodes.get("root")?.style;
  if (root) {
    const radius = exitHoleAt(t, exitStart, layout);
    const from =
      exitStart >= TIMES.pillIn
        ? { x: layout.pill.x + layout.pill.w / 2, y: layout.pill.y + layout.pill.h / 2 }
        : { x: dot.x, y: dot.y };
    const center = toScreen(from, scale, layout);
    const mask =
      radius > 0
        ? `radial-gradient(circle at ${center.x}px ${center.y}px, transparent ${radius}px, #000 ${radius + 1}px)`
        : "none";
    root.maskImage = mask;
    root.webkitMaskImage = mask;
  }
};

/* ---------- Markup ---------- */

/** First paint (server HTML): moving text waits below its mask until the clock runs. */
const BELOW: CSSProperties = { transform: "translate3d(0, 110%, 0)" };
const HIDDEN: CSSProperties = { visibility: "hidden" };

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

/** A line in its own mask; `-end` marks where its last letter ends, on the baseline. */
const Masked = ({
  id,
  bind,
  className,
  children,
}: {
  id: string;
  bind: Bind;
  className?: string;
  children: ReactNode;
}) => (
  <span className={cn("relative block overflow-hidden py-[0.08em] pr-[0.3em] pl-[0.05em]", className)}>
    <span ref={bind(id)} style={BELOW} className="block whitespace-pre">
      {children}
      <span ref={bind(`${id}-end`)} className="inline-block size-0" />
    </span>
  </span>
);

/** A giant word whose letters roll in and out one by one. */
const Rolling = ({ id, word, bind, className }: { id: string; word: string; bind: Bind; className?: string }) => (
  <span className={cn("relative block overflow-hidden py-[0.06em] pr-[0.3em] pl-[0.05em]", className)}>
    <span ref={bind(id)} className="block whitespace-pre">
      {Array.from(word).map((letter, index) => (
        <span key={`${letter}-${index}`} ref={bind(`${id}-${index}`)} style={BELOW} className="inline-block">
          {letter}
        </span>
      ))}
      <span ref={bind(`${id}-end`)} className="inline-block size-0" />
    </span>
  </span>
);

const Bracketed = ({ children }: { children: ReactNode }) => (
  <>
    <span className="text-signal">[ </span>
    {children}
    <span className="text-signal"> ]</span>
  </>
);

type NameSplashProps = {
  content: SplashContent;
  /** Called once the exit has finished. */
  onFinished?: () => void;
};

export const NameSplash = ({ content, onFinished }: NameSplashProps) => {
  const [{ nodes, bind }] = useState(createRegistry);
  const stage = useRef<Stage | null>(null);
  const start = useRef(0);
  const exitStart = useRef(EXIT_AT);
  const paused = useRef(false);
  const lastT = useRef(0);
  const finished = useRef(onFinished);
  const moments = [content.moments.first, content.moments.second, content.moments.third];

  useEffect(() => {
    finished.current = onFinished;
  }, [onFinished]);

  // Re-measure if the words change.
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
      const t = elapsed;
      if (!paused.current && stage.current) {
        lastT.current = t;
        paint(nodes, stage.current, t, exitStart.current);
        if (t >= exitStart.current + EXIT_SECONDS) {
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
  }, [nodes]);

  /** Skip, the clicked call to action and Esc all open the page now (or keep the exit already under way). */
  const enter = () => {
    exitStart.current = Math.min(lastT.current, exitStart.current);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        exitStart.current = Math.min(lastT.current, exitStart.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      className={cn("overflow-hidden bg-paper font-grotesk text-ink", "fixed inset-0 z-55")}
    >
      <p className="sr-only">
        {content.name.first} {content.name.last}. {content.role}
      </p>

      {/* Colour floods (screen space). */}
      <div aria-hidden className="absolute inset-0">
        <div ref={bind("flood-0")} style={HIDDEN} className="absolute top-0 left-0 rounded-full bg-signal" />
        <div ref={bind("flood-1")} style={HIDDEN} className="absolute top-0 left-0 rounded-full bg-ink" />
        <div ref={bind("flood-2")} style={HIDDEN} className="absolute top-0 left-0 rounded-full bg-paper" />
      </div>

      <div ref={bind("camera")} aria-hidden className="absolute inset-0">
        {/* Hook: caption, "Hello.", then the name. */}
        <div ref={bind("intro-slot")} className="absolute inset-0 flex items-center justify-center font-technical">
          <Masked id="intro" bind={bind}>
            {content.intro.lead} <span className="text-signal">{content.intro.key}</span>
          </Masked>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="relative block overflow-hidden font-technical">
            <span ref={bind("bracket")} style={BELOW} className="block">
              <Bracketed>{content.bracket}</Bracketed>
            </span>
          </span>
          {/* Both words share one grid cell, so the stack is as wide as the wider one. */}
          <div ref={bind("stack")} className="relative grid leading-none font-extrabold tracking-tighter">
            <Rolling
              id="hello"
              word={content.hello}
              bind={bind}
              className="col-start-1 row-start-1 justify-self-center"
            />
            <Rolling
              id="name"
              word={content.name.first}
              bind={bind}
              className="col-start-1 row-start-1 justify-self-center"
            />
          </div>
        </div>

        {/* "I DESIGN. / I BUILD. / I ANIMATE." on orange, ink and paper. */}
        {MOMENT_KEYS.map((key, index) => (
          <div
            key={key}
            ref={bind(`${key}-slot`)}
            className={cn(
              "absolute inset-0 flex items-center justify-center leading-none font-extrabold tracking-tighter uppercase",
              index === 1 ? "text-paper" : "text-ink",
            )}
          >
            <Masked id={key} bind={bind}>
              {content.moments.lead} {moments[index]}
            </Masked>
          </div>
        ))}

        {/* Dot matrix, the solid mark it condenses into, and its caption. */}
        <canvas ref={bind("canvas")} className="absolute inset-0 size-full" />
        <div ref={bind("logo")} style={HIDDEN} className="absolute top-0 left-0">
          <svg viewBox={`0 0 ${MONOGRAM_VIEWBOX.width} ${MONOGRAM_VIEWBOX.height}`} className="block size-full">
            <path d={MONOGRAM_LETTERS} className="fill-ink" />
          </svg>
        </div>
        <div ref={bind("detail")} className="absolute inset-x-0 flex justify-center font-technical">
          <span className="relative block overflow-hidden">
            <span ref={bind("detail-text")} style={BELOW} className="block">
              <Bracketed>
                {content.detail.lead} <span className="text-signal">{content.detail.key}</span>
              </Bracketed>
            </span>
          </span>
        </div>

        {/* End card. */}
        <div ref={bind("end")} className="absolute inset-0 flex flex-col items-center justify-center">
          <span ref={bind("end-logo")} className="block h-[1.15em] w-[2.8em]" />
          <p
            ref={bind("signature")}
            style={HIDDEN}
            className="mt-[0.15em] -rotate-3 font-brush leading-tight whitespace-nowrap"
          >
            {content.name.first} {content.name.last}
          </p>
          <div className="my-[0.35em] w-[150vw] -rotate-2">
            <div ref={bind("banner")} style={{ transform: "scaleX(0)" }} className="origin-left bg-signal py-[0.22em]">
              <span className="relative mx-auto block w-fit overflow-hidden">
                <span
                  ref={bind("role")}
                  style={BELOW}
                  className="block text-[0.42em] leading-none font-extrabold tracking-tight text-paper uppercase"
                >
                  {content.role}
                </span>
              </span>
            </div>
          </div>
          <button
            ref={bind("pill")}
            type="button"
            tabIndex={-1}
            onClick={enter}
            style={HIDDEN}
            className="rounded-full px-[1.2em] py-[0.6em] text-[length:max(13px,0.24em)] font-semibold text-paper"
          >
            {content.cta} →
          </button>
        </div>

        <svg
          ref={bind("cursor")}
          viewBox="0 0 24 24"
          style={HIDDEN}
          className="pointer-events-none absolute top-0 left-0 size-[clamp(18px,2vw,28px)] origin-top-left"
        >
          <path
            d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.2 L17.5 13 Z"
            className="fill-ink stroke-paper"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>

        <div ref={bind("dot")} className="absolute top-0 left-0 size-0 rounded-full bg-signal" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url(/textures/grain.svg)] bg-size-[256px] opacity-4 mix-blend-multiply"
      />

      <button
        type="button"
        onClick={enter}
        className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/90 px-4 py-2 font-technical text-xs tracking-[0.16em] text-ink uppercase shadow-sm backdrop-blur-sm transition-colors duration-200 ease-print hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:right-8 sm:bottom-8"
      >
        {content.skip}
        <span aria-hidden>→</span>
      </button>
    </section>
  );
};
