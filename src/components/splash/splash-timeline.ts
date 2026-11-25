import { clamp01, expoInOut, expoOut, mix, progress, spring } from "@/lib/shared/motion/time-easing";
import { MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";

/*
 * The name splash as pure functions of time (docs/screens/SPLASH_BUSINESS.md §4).
 * Given `t` (seconds) and the measured layout, each function returns where
 * something is. Nothing here touches the DOM or keeps state, so any frame can
 * be rendered in any order.
 */

/** 120 BPM. */
export const BEAT = 0.5;
export const at = (beat: number): number => beat * BEAT;

export const EXIT_AT = at(17);
export const EXIT_SECONDS = 0.6;

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

/** A word as laid out (transforms ignored), in stage pixels. `end`: baseline point after the last letter. */
export type WordLayout = { box: Box; end: Point; fs: number };

export type GridDot = {
  x: number;
  y: number;
  /** Inside the monogram's letters. */
  inside: boolean;
  /** Covered by the monogram's period (the real dot is drawn there instead). */
  period: boolean;
  /** Distance from the ripple's origin, 0..1. */
  distance: number;
  seed: number;
};

export type SplashLayout = {
  width: number;
  height: number;
  intro: WordLayout;
  hello: WordLayout;
  name: WordLayout;
  moments: readonly [WordLayout, WordLayout, WordLayout];
  /** Big centred monogram: dot matrix, then solid. */
  logo: Box;
  /** Monogram on the end card. */
  endLogo: Box;
  pill: Box;
  grid: { spacing: number; dots: GridDot[] };
};

/* ---------- Helpers ---------- */

export const mixBox = (from: Box, to: Box, p: number): Box => ({
  x: mix(from.x, to.x, p),
  y: mix(from.y, to.y, p),
  w: mix(from.w, to.w, p),
  h: mix(from.h, to.h, p),
});

/** Stable pseudo-random 0..1 for (index, salt): same value every frame. */
export const rand = (index: number, salt: number): number => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const PERIOD = { x: 398, y: 154, r: 16 } as const;

export const periodOf = (box: Box): Point & { size: number } => ({
  x: box.x + (PERIOD.x / MONOGRAM_VIEWBOX.width) * box.w,
  y: box.y + (PERIOD.y / MONOGRAM_VIEWBOX.height) * box.h,
  size: ((2 * PERIOD.r) / MONOGRAM_VIEWBOX.height) * box.h,
});

/** The dot's radius as a share of the font size: same proportion as the monogram's period. */
const STOP_RADIUS = 0.085;

const fullStop = (word: WordLayout) => {
  const r = STOP_RADIUS * word.fs;
  return { x: word.end.x + 0.05 * word.fs + r, y: word.end.y - r, size: 2 * r };
};

/* ---------- Text timing ---------- */

const RISE_SECONDS = 0.45;
const LEAVE_SECONDS = 0.22;
const HIDDEN = 110;

/** Vertical offset in % of the element's height: rises through its mask at `inAt`, leaves upward at `outAt`. */
export const riseAt = (t: number, inAt: number, outAt = Number.POSITIVE_INFINITY, seconds = RISE_SECONDS): number =>
  HIDDEN * (1 - spring(progress(t, inAt, seconds))) - HIDDEN * expoInOut(progress(t, outAt, LEAVE_SECONDS));

const LETTER_STAGGER = 0.035;

/** Per-letter roll: letters leave and arrive one after another, like a split-flap board. */
export const letterAt = (t: number, index: number, inAt: number, outAt = Number.POSITIVE_INFINITY): number =>
  riseAt(t, inAt + index * LETTER_STAGGER, outAt + index * LETTER_STAGGER * 0.8, 0.4);

/** Beat-locked times. Outgoing words leave before incoming ones arrive. */
export const TIMES = {
  introIn: 0.12,
  introOut: at(1) - 0.12,
  helloIn: at(1),
  bracketIn: at(2),
  helloOut: at(2) + 0.25,
  nameIn: at(3) - 0.15,
  bracketOut: at(5) - 0.3,
  nameOut: at(5) - 0.15,
  floods: [at(5), at(6), at(7)],
  momentsIn: [at(5) + 0.18, at(6) + 0.18, at(7) + 0.18],
  momentsOut: [at(6) - 0.1, at(7) - 0.1, at(8) + 0.1],
  gridIn: at(8),
  wave: at(9),
  monogram: at(10),
  condense: at(11),
  detailIn: at(10) + 0.15,
  detailOut: at(12) + 0.25,
  logoUp: at(13),
  signature: at(13) + 0.15,
  banner: at(14),
  roleIn: at(14) + 0.2,
  pillIn: at(15),
  cursorIn: at(15) + 0.05,
  click: at(16) + 0.1,
} as const;

export const FLOOD_SECONDS = 0.55;

/* ---------- Camera ---------- */

const SCENES = [0, at(5), at(8), at(13), EXIT_AT, EXIT_AT + EXIT_SECONDS] as const;
const PUSH_PER_SCENE = 0.03;

/** Scale about the centre: pushes in a little every scene, with one kick on the payoff beat. */
export const cameraScaleAt = (t: number): number => {
  const index = Math.max(
    0,
    SCENES.findLastIndex((start) => t >= start),
  );
  const scene = Math.min(index, SCENES.length - 2);
  const p = progress(t, SCENES[scene], SCENES[scene + 1] - SCENES[scene]);
  const since = t - TIMES.logoUp;
  const kick = since <= 0 ? 0 : (1 - Math.exp(-since * 25)) * Math.exp(-since * 4);
  return 1 + PUSH_PER_SCENE * (scene + expoOut(p)) + 0.05 * kick;
};

export const toScreen = (point: Point, scale: number, layout: SplashLayout): Point => ({
  x: layout.width / 2 + (point.x - layout.width / 2) * scale,
  y: layout.height / 2 + (point.y - layout.height / 2) * scale,
});

/* ---------- The monogram ---------- */

export const logoAt = (t: number, layout: SplashLayout): Box =>
  mixBox(layout.logo, layout.endLogo, spring(progress(t, TIMES.logoUp, 0.6)));

/** The solid monogram replaces the dot matrix the moment the dots have merged into letters. */
export const solidAt = (t: number): number => (t >= TIMES.condense + 0.42 ? 1 : 0);

/* ---------- Dot matrix ---------- */

export type MatrixDot = { x: number; y: number; r: number; tone: "ink" | "faint" };

/**
 * The grid ripples out of the dot, rides a wave, lights up as the monogram,
 * then the letters' dots swell until they merge (`clipToLetters` while they do).
 */
export const matrixAt = (t: number, layout: SplashLayout): { dots: MatrixDot[]; clipToLetters: boolean } => {
  if (t < TIMES.gridIn || t >= TIMES.condense + 0.45) {
    return { dots: [], clipToLetters: false };
  }
  const { spacing, dots } = layout.grid;
  const waveAmount = progress(t, TIMES.wave, 0.3) * (1 - progress(t, TIMES.monogram, 0.4));
  const condense = expoInOut(progress(t, TIMES.condense, 0.42));
  const result: MatrixDot[] = [];
  for (const dot of dots) {
    if (dot.period) {
      continue;
    }
    const grow = spring(progress(t, TIMES.gridIn + dot.distance * 0.55, 0.35));
    const phase = (dot.x / layout.width) * Math.PI * 3 - (t - TIMES.wave) * 6;
    const wave = Math.sin(phase) * waveAmount;
    let r = spacing * 0.2 * grow * (1 + 0.55 * wave);
    const lit = spring(progress(t, TIMES.monogram + dot.seed * 0.25, 0.4));
    r = dot.inside ? mix(r, spacing * 0.42, lit) : mix(r, spacing * 0.1, lit);
    r = dot.inside ? mix(r, spacing * 0.8, condense) : r * (1 - condense);
    if (r > 0.2) {
      result.push({
        x: dot.x,
        y: dot.y + wave * spacing * 0.45,
        r,
        tone: dot.inside || lit < 0.5 ? "ink" : "faint",
      });
    }
  }
  return { dots: result, clipToLetters: condense > 0 };
};

/* ---------- Floods ---------- */

/** Radius of flood `index` (orange, ink, paper), growing from where the dot was when it started. */
export const floodAt = (t: number, index: number, layout: SplashLayout): { origin: Point; radius: number } => {
  const start = TIMES.floods[index];
  const origin = dotAt(start, layout);
  const reach =
    Math.max(
      Math.hypot(origin.x, origin.y),
      Math.hypot(layout.width - origin.x, origin.y),
      Math.hypot(origin.x, layout.height - origin.y),
      Math.hypot(layout.width - origin.x, layout.height - origin.y),
    ) * 1.15;
  return { origin, radius: reach * expoInOut(progress(t, start, FLOOD_SECONDS)) };
};

/* ---------- The dot (through-line object) ---------- */

export type DotState = { x: number; y: number; size: number; /** 0 = signal orange, 1 = ink. */ ink: number };

const hop = (
  from: DotState,
  to: Point & { size: number },
  t: number,
  start: number,
  seconds = 0.42,
  lift = 0,
): DotState => {
  const p = spring(progress(t, start, seconds));
  return {
    ...from,
    x: mix(from.x, to.x, p),
    y: mix(from.y, to.y, p) - lift * Math.sin(Math.PI * progress(t, start, seconds)),
    size: mix(from.size, to.size, p),
  };
};

/**
 * The orange dot: the caption's bullet, the full stop of "Hello." and of the
 * name, the origin of each colour flood and the period of each statement,
 * the seed of the dot matrix, and finally the monogram's period.
 */
export const dotAt = (t: number, layout: SplashLayout): DotState => {
  const { intro, hello, name, moments } = layout;
  const bullet = { x: intro.box.x - 0.8 * intro.fs, y: intro.end.y - 0.36 * intro.fs, size: 0.55 * intro.fs };
  let dot: DotState = { ...bullet, size: bullet.size * spring(progress(t, 0, 0.35)), ink: 0 };
  dot = hop(dot, fullStop(hello), t, at(1), 0.45, 0.25 * hello.fs);
  dot = hop(dot, fullStop(name), t, TIMES.nameIn + 0.1, 0.42, 0.2 * name.fs);
  moments.forEach((moment, index) => {
    dot = hop(dot, fullStop(moment), t, TIMES.momentsIn[index], 0.42, 0.2 * moment.fs);
  });
  dot = hop(dot, periodOf(layout.logo), t, TIMES.monogram, 0.5, 0.15 * layout.height);
  dot = hop(dot, periodOf(logoAt(t, layout)), t, TIMES.logoUp, 0.6);
  // Ink while it sits on the orange flood, so it never vanishes into it.
  const ink = spring(progress(t, TIMES.floods[0] + 0.1, 0.25)) * (1 - spring(progress(t, TIMES.floods[1] + 0.1, 0.25)));
  return { ...dot, ink };
};

/* ---------- End card ---------- */

export const signatureAt = (t: number): number => expoOut(progress(t, TIMES.signature, 0.75));
export const bannerAt = (t: number): number => spring(progress(t, TIMES.banner, 0.45));

export type PillState = { scale: number; pressed: number; lit: number };

export const pillAt = (t: number): PillState => {
  const grow = spring(progress(t, TIMES.pillIn, 0.45));
  const press = Math.sin(Math.PI * progress(t, TIMES.click, 0.22));
  return { scale: mix(0.4, 1, grow) * (1 - 0.05 * press), pressed: press, lit: spring(progress(t, TIMES.click, 0.3)) };
};

export const cursorAt = (t: number, layout: SplashLayout): Point & { scale: number; shown: number } => {
  const { pill } = layout;
  const target = { x: pill.x + pill.w * 0.72, y: pill.y + pill.h * 0.62 };
  const p = spring(progress(t, TIMES.cursorIn, 0.75));
  const start = { x: layout.width * 1.04, y: layout.height * 1.08 };
  return {
    x: mix(start.x, target.x, p),
    y: mix(start.y, target.y, p) - 0.06 * layout.height * Math.sin(Math.PI * progress(t, TIMES.cursorIn, 0.75)),
    scale: 1 - 0.15 * Math.sin(Math.PI * progress(t, TIMES.click, 0.22)),
    shown: clamp01(progress(t, TIMES.cursorIn, 0.01)),
  };
};

/* ---------- Exit ---------- */

/** Radius of the hole that opens onto the page, from where the pill was clicked. */
export const exitHoleAt = (t: number, start: number, layout: SplashLayout): number =>
  expoInOut(progress(t, start, EXIT_SECONDS)) * Math.hypot(layout.width, layout.height) * 1.1;
