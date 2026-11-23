"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/shared/cn";
import type { SplashContent } from "@/lib/shared/content/splash-schema";
import { MONOGRAM_M1, MONOGRAM_M2, MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";
import {
  EXIT_AT,
  EXIT_SECONDS,
  LOOP_SECONDS,
  WORDS,
  cameraScaleAt,
  curveDrawAt,
  curveOf,
  curvePath,
  dotAt,
  exitAt,
  frameAt,
  handleSize,
  nameLetterAt,
  nameTransformAt,
  riseAt,
  typeAt,
  type Box,
  type SplashLayout,
  type WordLayout,
} from "./splash-timeline";

/*
 * Renders the name splash (docs/screens/SPLASH_BUSINESS.md). The markup is
 * static; `paint(t)` writes every moving style from the timeline functions.
 * A requestAnimationFrame loop only supplies `t`.
 *
 * `overlay`: plays once over the page, then wipes away (Skip / Esc end it early).
 * `preview`: loops in Content Forge's preview frame; Skip restarts it.
 */

type Variant = "overlay" | "preview";
type Node = HTMLElement | SVGElement;
type Nodes = Map<string, Node>;
type Stage = { layout: SplashLayout; curveLength: number };

const HOOK_KEYS = ["hook-0", "hook-1", "hook-2"] as const;
const BLURRED = [...HOOK_KEYS, "select", "type", "move", "role", "label"] as const;
const FRAME_HANDLES = ["handle-tr", "handle-bl", "handle-br"] as const;
const FIT_WIDTH = 0.84;
const FRAME_SECONDS = 1 / 120;

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

/** Sets the font size, shrinking it when the word would be wider than the screen allows. */
const fitFont = (sized: HTMLElement, measured: HTMLElement, fs: number, maxWidth: number): number => {
  sized.style.fontSize = `${fs}px`;
  const fitted = measured.offsetWidth > maxWidth ? (fs * maxWidth) / measured.offsetWidth : fs;
  sized.style.fontSize = `${fitted}px`;
  return fitted;
};

const measureWord = (nodes: Nodes, root: HTMLElement, key: string, fs: number, maxWidth: number): WordLayout => {
  const word = html(nodes, key);
  const mask = word.parentElement ?? word;
  const size = fitFont(html(nodes, `${key}-slot`), mask, fs, maxWidth);
  const end = boxIn(html(nodes, `${key}-end`), root);
  return { box: boxIn(word, root), end: { x: end.x, y: end.y }, fs: size };
};

/** Null while the markup is not (or no longer) mounted, e.g. a resize callback after unmount. */
const measureIfMounted = (nodes: Nodes, typeLetters: number): Stage | null =>
  nodes.get("camera")?.isConnected ? measure(nodes, typeLetters) : null;

const measure = (nodes: Nodes, typeLetters: number): Stage => {
  const root = html(nodes, "camera");
  const width = root.offsetWidth;
  const height = root.offsetHeight;
  const maxWidth = FIT_WIDTH * width;
  const hookFs = Math.min(0.17 * width, 0.24 * height);
  const momentFs = Math.min(0.14 * width, 0.2 * height);
  const nameFs = Math.min(0.07 * width, 0.075 * height);

  const hook = HOOK_KEYS.map((key) => measureWord(nodes, root, key, hookFs, maxWidth));
  const type = measureWord(nodes, root, "type", momentFs, maxWidth);
  const edges = Array.from({ length: typeLetters }, (_, index) => {
    const letter = boxIn(html(nodes, `type-${index}`), root);
    return letter.x + letter.w;
  });

  const nameFit = fitFont(html(nodes, "card"), html(nodes, "name"), nameFs, 0.8 * width);
  const nameEnd = boxIn(html(nodes, "name-end"), root);

  const layout: SplashLayout = {
    width,
    height,
    hook: [hook[0], hook[1], hook[2]],
    select: measureWord(nodes, root, "select", momentFs, maxWidth),
    type: { ...type, edges },
    move: measureWord(nodes, root, "move", momentFs, maxWidth),
    name: { box: boxIn(html(nodes, "name"), root), end: { x: nameEnd.x, y: nameEnd.y }, fs: nameFit },
    mono: boxIn(html(nodes, "mono"), root),
  };

  const curve = nodes.get("curve");
  let curveLength = 0;
  if (curve instanceof SVGPathElement) {
    curve.setAttribute("d", curvePath(curveOf(layout)));
    curve.style.strokeWidth = `${Math.max(2, 0.028 * layout.move.fs)}px`;
    curveLength = curve.getTotalLength();
  }
  return { layout, curveLength };
};

/* ---------- Painting one frame ---------- */

const styleOf = (nodes: Nodes, key: string): CSSStyleDeclaration | undefined => nodes.get(key)?.style;

/** Moves a word through its mask and blurs it along the move while it is fast. */
const paintRise = (nodes: Nodes, key: string, t: number, inAt: number, outAt?: number, size = 0) => {
  const offset = riseAt(t, inAt, outAt);
  const style = styleOf(nodes, key);
  if (!style) {
    return;
  }
  style.transform = `translate3d(0, ${offset}%, 0)`;
  const blur = nodes.get(`${key}-blur`);
  if (!blur || size === 0) {
    return;
  }
  const speed = Math.abs(offset - riseAt(t - FRAME_SECONDS, inAt, outAt)) / FRAME_SECONDS;
  const amount = Math.min(8, (speed / 100) * size * 0.0035);
  blur.setAttribute("stdDeviation", `0 ${amount.toFixed(2)}`);
  style.filter = amount > 0.25 ? `url(#${blur.dataset.filter})` : "none";
};

const px = (value: number) => `${value}px`;

const paint = (nodes: Nodes, stage: Stage, t: number, exitStart: number | null) => {
  const { layout, curveLength } = stage;

  // The dot, smeared along its path while it moves fast as a circle.
  const dot = dotAt(t, layout);
  const before = dotAt(t - FRAME_SECONDS, layout);
  const vx = (dot.x - before.x) / FRAME_SECONDS;
  const vy = (dot.y - before.y) / FRAME_SECONDS;
  const isCircle = dot.round > 0.95 && Math.abs(dot.w - dot.h) < 0.5;
  const smear = isCircle ? 1 + Math.min(Math.hypot(vx, vy) / 3000, 0.9) : 1;
  const angle = smear > 1.01 ? Math.atan2(vy, vx) : 0;
  const dotStyle = styleOf(nodes, "dot");
  if (dotStyle) {
    dotStyle.width = px(dot.w);
    dotStyle.height = px(dot.h);
    dotStyle.borderRadius = px((dot.round * Math.min(dot.w, dot.h)) / 2);
    dotStyle.transform = `translate(${dot.x - dot.w / 2}px, ${dot.y - dot.h / 2}px) rotate(${angle}rad) scale(${smear}, ${1 / Math.sqrt(smear)})`;
  }

  // Camera: always pushing in, leaning a little towards the dot.
  const camera = styleOf(nodes, "camera");
  if (camera) {
    const lean = 0.05;
    camera.transform = `translate(${(layout.width / 2 - dot.x) * lean}px, ${(layout.height / 2 - dot.y) * lean}px) scale(${cameraScaleAt(t)})`;
  }

  HOOK_KEYS.forEach((key, index) =>
    paintRise(nodes, key, t, WORDS.hook[index].in, WORDS.hook[index].out, layout.hook[index].fs),
  );

  // Design: selection frame and its handles.
  paintRise(nodes, "select", t, WORDS.select.in, WORDS.select.out, layout.select.fs);
  const frame = frameAt(t, layout);
  const frameStyle = styleOf(nodes, "frame");
  if (frameStyle) {
    frameStyle.visibility = frame.w + frame.h < 1 ? "hidden" : "visible";
    frameStyle.width = px(frame.w);
    frameStyle.height = px(frame.h);
    frameStyle.transform = `translate(${frame.x}px, ${frame.y}px)`;
  }
  const handle = handleSize(layout);
  const corners = [
    [frame.x + frame.w, frame.y],
    [frame.x, frame.y + frame.h],
    [frame.x + frame.w, frame.y + frame.h],
  ] as const;
  FRAME_HANDLES.forEach((key, index) => {
    const style = styleOf(nodes, key);
    if (style) {
      const [x, y] = corners[index];
      style.width = px(handle);
      style.height = px(handle);
      style.transform = `translate(${x - handle / 2}px, ${y - handle / 2}px) scale(${frame.handles})`;
    }
  });

  // Code: letters type in behind the caret, then the word leaves.
  paintRise(nodes, "type", t, -1, WORDS.type.out, layout.type.fs);
  layout.type.edges.forEach((_, index) => {
    const style = styleOf(nodes, `type-${index}`);
    if (style) {
      style.transform = `translate3d(0, ${riseAt(t, typeAt(index, layout.type.edges.length), undefined, 0.2)}%, 0)`;
    }
  });

  // Motion: the curve draws under the dot, then erases from its start.
  paintRise(nodes, "move", t, WORDS.move.in, WORDS.move.out, layout.move.fs);
  const curve = styleOf(nodes, "curve");
  if (curve) {
    const [from, to] = curveDrawAt(t);
    const drawn = Math.max(0, to - from) * curveLength;
    // A zero-length dash still paints a round cap, so hide the curve until it has length.
    curve.visibility = drawn < 0.5 ? "hidden" : "visible";
    curve.strokeDasharray = `0 ${from * curveLength} ${drawn} ${curveLength}`;
  }

  // Payoff and end card.
  const name = nameTransformAt(t, layout);
  const nameStyle = styleOf(nodes, "name");
  if (nameStyle) {
    nameStyle.transform = `translate(${name.dx}px, ${name.dy}px) scale(${name.scale})`;
  }
  nodes.forEach((node, key) => {
    const match = /^name-(\d)-(\d+)$/.exec(key);
    if (match) {
      node.style.transform = `translate3d(0, ${riseAt(t, nameLetterAt(Number(match[1]), Number(match[2])), undefined, 0.5)}%, 0)`;
    }
  });
  WORDS.mono.forEach((inAt, index) => {
    const style = styleOf(nodes, `mono-${index}`);
    if (style) {
      style.transform = `translateY(${(riseAt(t, inAt) / 100) * MONOGRAM_VIEWBOX.height}px)`;
    }
  });
  paintRise(nodes, "role", t, WORDS.role.in, undefined, layout.name.fs * 0.3);
  paintRise(nodes, "label", t, WORDS.label.in, undefined, layout.name.fs * 0.3);

  const root = styleOf(nodes, "root");
  if (root && exitStart !== null) {
    root.clipPath = `inset(0 0 ${exitAt(t, exitStart) * 100}% 0)`;
  }
};

/* ---------- Markup ---------- */

type Bind = (key: string) => (node: Node | null) => void;

/** A word in its own mask, centred in the frame. `-end` marks where the last letter ends (on the baseline). */
const WordSlot = ({
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
  <div ref={bind(`${id}-slot`)} className={cn("absolute inset-0 flex items-center justify-center", className)}>
    <span className="relative block overflow-hidden py-[0.06em] pr-[0.26em] pl-[0.04em]">
      <span ref={bind(id)} className="block whitespace-pre" style={BELOW}>
        {children}
        <span ref={bind(`${id}-end`)} className="inline-block size-0" />
      </span>
    </span>
  </div>
);

const letters = (word: string) => Array.from(word);

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

/** First paint (server HTML): everything waits below its mask until the clock starts. */
const BELOW = { transform: "translate3d(0, 105%, 0)" } as const;
const MONO_BELOW = { transform: `translateY(${MONOGRAM_VIEWBOX.height * 1.05}px)` } as const;

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
  const filterPrefix = useId().replace(/[^a-zA-Z0-9]/g, "");
  const typeLetters = letters(content.moments.type);
  const nameLines = [letters(content.name.first), letters(content.name.last)];

  useEffect(() => {
    finished.current = onFinished;
  }, [onFinished]);

  // Re-measure when the words change (preview drafts).
  const letterCount = typeLetters.length;
  useLayoutEffect(() => {
    if (stage.current) {
      stage.current = measureIfMounted(nodes, letterCount);
    }
  }, [content, letterCount, nodes]);

  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    const root = nodes.get("root");
    const resize = new ResizeObserver(() => {
      if (stage.current) {
        stage.current = measureIfMounted(nodes, letterCount);
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
    // Measure with the real typeface; don't wait forever for it.
    const fonts = Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
    void fonts.then(() => {
      if (cancelled) {
        return;
      }
      stage.current = measureIfMounted(nodes, letterCount);
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
    // The clock runs once per mount; word changes re-measure above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

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

  const hook = [content.hook.first, content.hook.second, content.hook.keyWord];

  return (
    <section
      ref={bind("root")}
      aria-label={content.srLabel}
      className={cn(
        "overflow-hidden bg-paper text-ink",
        variant === "overlay" ? "fixed inset-0 z-55" : "relative h-svh",
      )}
    >
      <p className="sr-only">
        {content.name.first} {content.name.last}. {content.role}
      </p>
      <svg aria-hidden className="absolute size-0">
        <defs>
          {BLURRED.map((key) => (
            <filter key={key} id={`${filterPrefix}-${key}`} x="-5%" y="-40%" width="110%" height="180%">
              <feGaussianBlur ref={bind(`${key}-blur`)} data-filter={`${filterPrefix}-${key}`} stdDeviation="0 0" />
            </filter>
          ))}
        </defs>
      </svg>

      <div
        ref={bind("camera")}
        aria-hidden
        className="absolute inset-0 font-grotesk leading-none font-extrabold tracking-tighter uppercase"
      >
        {hook.map((word, index) => (
          <WordSlot key={HOOK_KEYS[index]} id={HOOK_KEYS[index]} bind={bind}>
            {word}
          </WordSlot>
        ))}

        <WordSlot id="select" bind={bind}>
          {content.moments.select}
        </WordSlot>
        <div ref={bind("frame")} className="invisible absolute top-0 left-0 border-2 border-ink" />
        {FRAME_HANDLES.map((key) => (
          <div key={key} ref={bind(key)} className="absolute top-0 left-0 size-0 border-2 border-ink bg-paper" />
        ))}

        <div ref={bind("type-slot")} className="absolute inset-0 flex items-center justify-center">
          <span className="relative block overflow-hidden py-[0.06em] pr-[0.26em] pl-[0.04em]">
            <span ref={bind("type")} className="block whitespace-pre">
              {typeLetters.map((letter, index) => (
                <span key={`${letter}-${index}`} ref={bind(`type-${index}`)} className="inline-block" style={BELOW}>
                  {letter}
                </span>
              ))}
              <span ref={bind("type-end")} className="inline-block size-0" />
            </span>
          </span>
        </div>

        <WordSlot id="move" bind={bind} className="pb-[0.66em]">
          {content.moments.move}
        </WordSlot>
        <svg className="absolute inset-0 size-full overflow-visible">
          <path ref={bind("curve")} fill="none" strokeLinecap="round" className="invisible stroke-ink" />
        </svg>

        <div ref={bind("card")} className="absolute inset-0 flex flex-col items-center justify-center gap-[0.4em]">
          <div ref={bind("mono")} className="relative overflow-hidden">
            <svg viewBox={`0 0 ${MONOGRAM_VIEWBOX.width} ${MONOGRAM_VIEWBOX.height}`} className="block h-[2em] w-auto">
              <path ref={bind("mono-0")} d={MONOGRAM_M1} fill="currentColor" style={MONO_BELOW} />
              <path ref={bind("mono-1")} d={MONOGRAM_M2} fill="currentColor" style={MONO_BELOW} />
            </svg>
          </div>
          <div ref={bind("name")} className="relative flex flex-col items-center leading-[0.9]">
            {nameLines.map((line, lineIndex) => (
              <span key={lineIndex} className="relative block overflow-hidden py-[0.05em] pr-[0.26em] pl-[0.04em]">
                {line.map((letter, index) => (
                  <span
                    key={`${letter}-${index}`}
                    ref={bind(`name-${lineIndex}-${index}`)}
                    className="inline-block whitespace-pre"
                    style={BELOW}
                  >
                    {letter}
                  </span>
                ))}
                {lineIndex === 1 ? <span ref={bind("name-end")} className="inline-block size-0" /> : null}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-center gap-[0.5em] text-[length:max(11px,0.2em)] font-semibold tracking-[0.24em]">
            <span className="relative block overflow-hidden">
              <span ref={bind("role")} className="block" style={BELOW}>
                {content.role}
              </span>
            </span>
            <span className="relative block overflow-hidden text-graphite">
              <span ref={bind("label")} className="block" style={BELOW}>
                {content.label}
              </span>
            </span>
          </div>
        </div>

        <div ref={bind("dot")} className="absolute top-0 left-0 size-0 bg-signal" />
      </div>

      <button
        type="button"
        onClick={skip}
        className="absolute right-4 bottom-4 font-grotesk text-xs font-semibold tracking-[0.2em] text-graphite uppercase underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none sm:right-8 sm:bottom-8"
      >
        {content.skip}
      </button>
    </section>
  );
};
