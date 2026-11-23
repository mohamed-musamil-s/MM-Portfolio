import { expoInOut, expoOut, mix, progress, spring } from "@/lib/shared/motion/time-easing";

/*
 * The name splash as pure functions of time (docs/screens/SPLASH_BUSINESS.md §4).
 * Given `t` (seconds) and the measured layout, each function returns where
 * something is. Nothing here touches the DOM or keeps state, so any frame can
 * be rendered in any order.
 */

/** 120 BPM. */
export const BEAT = 0.5;
export const at = (beat: number): number => beat * BEAT;

export const EXIT_AT = at(16);
export const EXIT_SECONDS = 0.55;
/** Preview loop: the end card stays a moment, then the sequence restarts. */
export const LOOP_SECONDS = EXIT_AT + 1;

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

/** A word as laid out (transforms ignored), in stage pixels. */
export type WordLayout = {
  /** The letters' box. */
  box: Box;
  /** Baseline y, and x where the last letter ends. */
  end: Point;
  fs: number;
};

export type SplashLayout = {
  width: number;
  height: number;
  hook: readonly [WordLayout, WordLayout, WordLayout];
  select: WordLayout;
  /** `edges`: right edge of each letter, for the caret. */
  type: WordLayout & { edges: number[] };
  move: WordLayout;
  /** The name block at end-card size; `end` is where its last line ends. */
  name: WordLayout;
  /** The monogram (letters only; the dot lands on its period). */
  mono: Box;
};

/* ---------- Word timings (seconds) ---------- */

const RISE_SECONDS = 0.45;
const LEAVE_SECONDS = 0.2;
const HIDDEN = 105;

/** Words leave just before the beat and the next one enters on it, so letters never overlap. */
export const WORDS = {
  hook: [
    { in: at(1), out: at(2) - LEAVE_SECONDS },
    { in: at(2), out: at(3) - LEAVE_SECONDS },
    { in: at(3), out: at(4) },
  ],
  select: { in: at(5) + 0.1, out: at(7) - 0.05 },
  type: { out: at(10) - LEAVE_SECONDS },
  move: { in: at(10) + 0.1, out: at(12) - 0.18 },
  role: { in: at(14) + 0.05 },
  label: { in: at(15) },
  mono: [at(13) + 0.1, at(13) + 0.18],
} as const;

/**
 * Vertical offset in % of the element's own height: below its mask (hidden),
 * springs up into place at `inAt`, leaves upward from `outAt`.
 */
export const riseAt = (t: number, inAt: number, outAt = Number.POSITIVE_INFINITY, seconds = RISE_SECONDS): number =>
  HIDDEN * (1 - spring(progress(t, inAt, seconds))) - HIDDEN * expoInOut(progress(t, outAt, LEAVE_SECONDS));

/** When letter `index` of the typed word appears. */
export const typeAt = (index: number, count: number): number => at(8) + index * Math.min(0.1, BEAT / count);

const NAME_STAGGER = 0.03;
/** When letter `index` of name line `line` rises (the payoff lands on beat 12). */
export const nameLetterAt = (line: number, index: number): number => at(12) - 0.05 + line * 0.07 + index * NAME_STAGGER;

/* ---------- Geometry helpers ---------- */

/** The dot's radius as a share of the font size: same proportion as the monogram's period. */
const DOT_RADIUS = 0.075;
const CAP_HEIGHT = 0.72;

const capBox = (word: WordLayout): Box => ({
  x: word.box.x,
  y: word.end.y - CAP_HEIGHT * word.fs,
  w: word.box.w,
  h: CAP_HEIGHT * word.fs,
});

const pad = (box: Box, amount: number): Box => ({
  x: box.x - amount,
  y: box.y - amount,
  w: box.w + amount * 2,
  h: box.h + amount * 2,
});

const mixBox = (from: Box, to: Box, p: number): Box => ({
  x: mix(from.x, to.x, p),
  y: mix(from.y, to.y, p),
  w: mix(from.w, to.w, p),
  h: mix(from.h, to.h, p),
});

/** Centre of the full stop after a word. */
const fullStop = (end: Point, fs: number): Point => {
  const r = DOT_RADIUS * fs;
  return { x: end.x + 0.06 * fs + r, y: end.y - r };
};

/* ---------- Selection frame (design moment) ---------- */

export type FrameState = Box & { handles: number };

export const frameAt = (t: number, layout: SplashLayout): FrameState => {
  const caps = capBox(layout.select);
  const loose = pad(caps, 0.2 * layout.select.fs);
  const tight = pad(caps, 0.07 * layout.select.fs);
  const rect = mixBox(loose, tight, spring(progress(t, at(6), 0.4)));
  const w = rect.w * spring(progress(t, at(4) + 0.45, 0.4));
  const h = rect.h * spring(progress(t, at(4) + 0.6, 0.4));
  // Folds into its far corner on beat 7.
  const fold = spring(progress(t, at(7), 0.38));
  return {
    x: rect.x + w * fold,
    y: rect.y + h * fold,
    w: w * (1 - fold),
    h: h * (1 - fold),
    handles: spring(progress(t, at(5) + 0.3, 0.3)) * (1 - fold),
  };
};

export const handleSize = (layout: SplashLayout): number => Math.min(16, Math.max(9, 0.07 * layout.select.fs));

/* ---------- Ease curve (motion moment) ---------- */

export type Curve = { p0: Point; c1: Point; c2: Point; p1: Point };

export const curveOf = (layout: SplashLayout): Curve => {
  const { move } = layout;
  const left = move.box.x;
  const right = move.box.x + move.box.w;
  const top = move.end.y + 0.24 * move.fs;
  const bottom = top + 0.42 * move.fs;
  return {
    p0: { x: left, y: bottom },
    c1: { x: left + 0.6 * move.box.w, y: bottom },
    c2: { x: right - 0.6 * move.box.w, y: top },
    p1: { x: right, y: top },
  };
};

export const curvePath = ({ p0, c1, c2, p1 }: Curve): string =>
  `M${p0.x} ${p0.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p1.x} ${p1.y}`;

const bezier = ({ p0, c1, c2, p1 }: Curve, q: number): Point => {
  const u = 1 - q;
  const a = u * u * u;
  const b = 3 * u * u * q;
  const c = 3 * u * q * q;
  const d = q * q * q;
  return { x: a * p0.x + b * c1.x + c * c2.x + d * p1.x, y: a * p0.y + b * c1.y + c * c2.y + d * p1.y };
};

const RIDE = { start: at(10) + 0.32, seconds: 0.5 };
const rideAt = (t: number): number => expoInOut(progress(t, RIDE.start, RIDE.seconds));

/** Drawn part of the curve as fractions of its length: [from, to]. */
export const curveDrawAt = (t: number): [number, number] => [expoInOut(progress(t, WORDS.move.out, 0.3)), rideAt(t)];

/* ---------- Name block (payoff) ---------- */

export type NameTransform = { scale: number; dx: number; dy: number; cx: number; cy: number };

/** Huge and centred on beat 12, springs down to its end-card place on beat 13. */
export const nameTransformAt = (t: number, layout: SplashLayout): NameTransform => {
  const { box } = layout.name;
  // Leaves room for the camera push (about 1.17x by the payoff) and the full stop.
  const big = Math.min((0.68 * layout.width) / box.w, (0.4 * layout.height) / box.h);
  const settle = spring(progress(t, at(13), 0.55));
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return {
    scale: mix(big, 1, settle),
    dx: mix(layout.width / 2 - cx, 0, settle),
    dy: mix(layout.height / 2 - cy, 0, settle),
    cx,
    cy,
  };
};

const throughName = (point: Point, n: NameTransform): Point => ({
  x: n.cx + (point.x - n.cx) * n.scale + n.dx,
  y: n.cy + (point.y - n.cy) * n.scale + n.dy,
});

/* ---------- The dot (through-line object) ---------- */

/** `round`: 1 = fully rounded (circle, pill), 0 = square corners. */
export type DotState = { x: number; y: number; w: number; h: number; round: number };

const toward = (from: DotState, to: Partial<DotState>, p: number): DotState => ({
  x: mix(from.x, to.x ?? from.x, p),
  y: mix(from.y, to.y ?? from.y, p),
  w: mix(from.w, to.w ?? from.w, p),
  h: mix(from.h, to.h ?? from.h, p),
  round: mix(from.round, to.round ?? from.round, p),
});

/** Spring move with a small arc over the top. */
const hop = (
  from: DotState,
  to: Partial<DotState>,
  t: number,
  start: number,
  seconds: number,
  lift: number,
): DotState => {
  const next = toward(from, to, spring(progress(t, start, seconds)));
  return { ...next, y: next.y - lift * Math.sin(Math.PI * progress(t, start, seconds)) };
};

const circle = (point: Point, fs: number) => ({ ...point, w: 2 * DOT_RADIUS * fs, h: 2 * DOT_RADIUS * fs, round: 1 });

/** Edge the caret sits on: slides one letter right as each letter types in. */
const typedEdge = (t: number, layout: SplashLayout): number => {
  const { edges, box } = layout.type;
  return edges.reduce(
    (x, edge, index) =>
      x + (edge - (edges[index - 1] ?? box.x)) * spring(progress(t, typeAt(index, edges.length), 0.16)),
    box.x,
  );
};

export const dotAt = (t: number, layout: SplashLayout): DotState => {
  const [first, second, key] = layout.hook;
  const grow = spring(progress(t, 0, 0.45));
  const start = circle({ x: layout.width / 2, y: layout.height / 2 }, first.fs);
  let dot: DotState = { ...start, w: start.w * grow, h: start.h * grow };

  // Hook: full stop of each word, then the key word's underline.
  dot = toward(dot, circle(fullStop(first.end, first.fs), first.fs), spring(progress(t, at(1), 0.45)));
  dot = hop(dot, circle(fullStop(second.end, second.fs), second.fs), t, at(2), 0.42, 0.3 * second.fs);
  dot = hop(dot, circle(fullStop(key.end, key.fs), key.fs), t, at(3), 0.38, 0.3 * key.fs);
  const underline = {
    x: key.box.x + key.box.w / 2,
    y: key.end.y + 0.16 * key.fs,
    w: key.box.w,
    h: 0.08 * key.fs,
  };
  dot = toward(dot, underline, spring(progress(t, at(3) + 0.22, 0.38)));

  // Design: pull back into a dot, become the frame's corner handle.
  dot = toward(dot, { w: underline.h * 1.6, h: underline.h * 1.6 }, spring(progress(t, at(4), 0.3)));
  const frame = frameAt(t, layout);
  const handle = handleSize(layout);
  dot = toward(
    dot,
    { x: frame.x, y: frame.y, w: handle, h: handle, round: 0.3 },
    spring(progress(t, at(4) + 0.2, 0.4)),
  );

  // Code: stretch into a caret, follow the letters, blink on beat 9.
  const { type } = layout;
  const caretHeight = CAP_HEIGHT * 1.05 * type.fs;
  const caret = {
    x: typedEdge(t, layout) + 0.07 * type.fs,
    y: type.end.y - caretHeight / 2,
    w: Math.max(3, 0.07 * type.fs),
    h: caretHeight,
    round: 1,
  };
  dot = toward(dot, caret, spring(progress(t, at(7) + 0.32, 0.35)));
  dot = { ...dot, h: dot.h * (1 - 0.75 * Math.sin(Math.PI * progress(t, at(9), 0.22))) };

  // Motion: back to a dot at the curve's start, then ride it.
  const curve = curveOf(layout);
  dot = toward(dot, circle(curve.p0, layout.move.fs * 0.9), spring(progress(t, at(10), 0.32)));
  if (t >= RIDE.start) {
    dot = { ...dot, ...bezier(curve, rideAt(t)) };
  }

  // Payoff: the name's full stop, carried as the name settles.
  const n = nameTransformAt(t, layout);
  const nameStop = circle(throughName(fullStop(layout.name.end, layout.name.fs), n), layout.name.fs * n.scale);
  dot = hop(dot, nameStop, t, WORDS.move.out, 0.42, 0.06 * layout.height);

  // End card: the monogram's period.
  const { mono } = layout;
  const period = { x: mono.x + (398 / 414) * mono.w, y: mono.y + (154 / 170) * mono.h, w: 0, h: 0, round: 1 };
  const periodSize = (32 / 170) * mono.h;
  dot = hop(dot, { ...period, w: periodSize, h: periodSize }, t, at(14), 0.45, 0.12 * mono.h);

  return dot;
};

/* ---------- Camera ---------- */

const SCENES = [0, at(4), at(7), at(10), at(12), EXIT_AT, EXIT_AT + EXIT_SECONDS] as const;
const PUSH_PER_SCENE = 0.035;

/** Scale: pushes in a little every scene (never sits still), with one kick on the payoff beat. */
export const cameraScaleAt = (t: number): number => {
  const index = Math.max(
    0,
    SCENES.findLastIndex((start) => t >= start),
  );
  const scene = Math.min(index, SCENES.length - 2);
  const p = progress(t, SCENES[scene], SCENES[scene + 1] - SCENES[scene]);
  const since = t - at(12);
  const kick = since <= 0 ? 0 : (1 - Math.exp(-since * 25)) * Math.exp(-since * 4);
  return 1 + PUSH_PER_SCENE * (scene + expoOut(p)) + 0.05 * kick;
};

/** The wipe that reveals the page: share of the screen uncovered from the bottom. */
export const exitAt = (t: number, start: number): number => expoInOut(progress(t, start, EXIT_SECONDS));
