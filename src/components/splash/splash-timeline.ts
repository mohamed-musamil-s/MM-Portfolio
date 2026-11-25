import { clamp01, expoInOut, expoOut, mix, progress, spring } from "@/lib/shared/motion/time-easing";
import { MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";
import type { Box, Point, Reveal, WordLayout } from "./splash-kit";

/*
 * The name splash as pure functions of time (docs/screens/SPLASH_BUSINESS.md §4).
 * Given `t` (seconds) and the measured layout, each function returns where
 * something is. Nothing here touches the DOM or keeps state, so any frame can
 * be rendered in any order.
 */

/** 120 BPM. */
export const BEAT = 0.5;

/** Every scene's cues, in seconds. Outgoing things leave before incoming ones arrive. */
export const T = {
  // Hook: "Hello.", then the full name shrinks letter by letter into "MM."
  introIn: 0.12,
  introOut: 0.38,
  helloIn: 0.5,
  bracketIn: 1,
  helloOut: 1.25,
  nameIn: 1.35,
  shrink: 2.75,
  bracketOut: 4.3,
  morph: 4.6,
  hookOut: 5.55,
  // Loading
  loadIn: 6,
  countFrom: 6.15,
  countTo: 7.5,
  loadOut: 7.7,
  // Floods: orange, ink, paper (moments), ink (statements), paper (end card)
  floods: [8, 8.5, 9, 24, 27.5],
  momentsIn: [8.18, 8.68, 9.18],
  momentsOut: [8.4, 8.9, 9.5],
  // Design
  windowIn: 9.65,
  designCaption: 9.9,
  blocks: 10,
  swatches: 11,
  cursorDesign: 11.3,
  grab: 11.75,
  drop: 12.3,
  designOut: 12.75,
  // Code
  terminalIn: 13,
  codeCaption: 13.1,
  lines: [13.35, 13.95, 14.55],
  liveIn: 14.85,
  connect: 14.95,
  ride: 15.1,
  deployed: 15.65,
  codeOut: 16.25,
  // Motion (dot matrix)
  gridIn: 16.5,
  wave: 17,
  sphere: 17.6,
  monogram: 18.4,
  detailIn: 18.5,
  condense: 19.3,
  detailOut: 20.1,
  // Stack
  hubIn: 20.5,
  stackTitle: 20.65,
  chipsIn: 20.85,
  linksIn: 21,
  pulses: 21.6,
  stackPill: 22.2,
  stackOut: 23.7,
  // Statements
  tagsIn: 24.15,
  ruleIn: 24.3,
  statementsIn: 24.5,
  statementsOut: 27.1,
  // End card
  markIn: 27.7,
  orbitCollapse: 28.7,
  markSettle: 29,
  nameRowIn: 29.1,
  taglineIn: 29.6,
  ctaIn: 30,
  labelIn: 30.2,
  cursorEnd: 30.1,
  click: 30.9,
  // Exit: the splash fades while the mark flies to the page's navbar.
  exit: 31.5,
} as const;

export const EXIT_AT = T.exit;
export const EXIT_SECONDS = 1.4;

export const statementAt = (index: number): number => T.statementsIn + index * BEAT;

/* ---------- Layout ---------- */

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

/** The hook's full name: natural letter widths per word, the space between words, the row's centre and baseline. */
export type NameLayout = { letters: number[][]; space: number; centerX: number; baseline: number; fs: number };

export type SplashLayout = {
  width: number;
  height: number;
  intro: WordLayout;
  hello: WordLayout;
  /** The full name in the hook, as it shrinks into "MM." */
  name: NameLayout;
  /** Progress bar track. */
  bar: Box;
  moments: readonly WordLayout[];
  /** Design scene: the browser window, its first window control, the dragged card and its slot. */
  window: Box;
  windowLight: Point;
  dragCard: Box;
  slot: Box;
  /** Code scene: terminal, its first window control, the live site card and its status light. */
  terminal: Box;
  terminalLight: Point;
  live: Box;
  liveLight: Point;
  /** Big centred monogram of the dot matrix. */
  logo: Box;
  grid: { spacing: number; dots: GridDot[] };
  /** Stack scene: the small monogram at the centre and the skill chips around it. */
  hub: Box;
  chips: readonly Box[];
  statements: readonly WordLayout[];
  /** End card: the big mark with its orbit, then the mark beside the name. */
  bigMark: Box;
  endMark: Box;
  pill: Box;
};

/* ---------- Helpers ---------- */

export const mixBox = (from: Box, to: Box, p: number): Box => ({
  x: mix(from.x, to.x, p),
  y: mix(from.y, to.y, p),
  w: mix(from.w, to.w, p),
  h: mix(from.h, to.h, p),
});

export const mixPoint = (from: Point, to: Point, p: number): Point => ({
  x: mix(from.x, to.x, p),
  y: mix(from.y, to.y, p),
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

export const fullStop = (word: WordLayout): Point & { size: number } => {
  const r = STOP_RADIUS * word.fs;
  return { x: word.end.x + 0.05 * word.fs + r, y: word.end.y - r, size: 2 * r };
};

/* ---------- The shrinking name ---------- */

/** One letter goes from the end of every word on each half-beat. */
export const SHRINK_STEP = BEAT / 2;
const CAP_RATIO = 0.73;

const shrinkSteps = (name: NameLayout): number => Math.max(...name.letters.map((word) => word.length)) - 1;

/** 0..1: how far letter `index` of word `word` has gone (the last letter goes first, the first letter stays). */
export const letterGoneAt = (t: number, name: NameLayout, word: number, index: number): number => {
  const length = name.letters[word]?.length ?? 0;
  if (index === 0) {
    return 0;
  }
  return expoInOut(progress(t, T.shrink + (length - index - 1) * SHRINK_STEP, 0.22));
};

/** 0..1: how far the space between the words has closed ("M M" becomes "MM"). */
export const spaceGoneAt = (t: number, name: NameLayout): number =>
  expoInOut(progress(t, T.shrink + shrinkSteps(name) * SHRINK_STEP, 0.3));

/** Current width of the name row as its letters go. */
const nameWidthAt = (t: number, name: NameLayout): number => {
  const letters = name.letters.reduce(
    (sum, word, w) => sum + word.reduce((total, width, i) => total + width * (1 - letterGoneAt(t, name, w, i)), 0),
    0,
  );
  return letters + name.space * (name.letters.length - 1) * (1 - spaceGoneAt(t, name));
};

/** The full stop right after the shrinking name. */
const nameStopAt = (t: number, name: NameLayout): Point & { size: number } => {
  const r = STOP_RADIUS * name.fs;
  return { x: name.centerX + nameWidthAt(t, name) / 2 + 0.05 * name.fs + r, y: name.baseline - r, size: 2 * r };
};

/** The monogram the remaining "MM" turns into: cap height, centred on the row, on its baseline. */
export const hookLogoOf = (name: NameLayout): Box => {
  const h = CAP_RATIO * name.fs;
  const w = (h * MONOGRAM_VIEWBOX.width) / MONOGRAM_VIEWBOX.height;
  return { x: name.centerX - w / 2, y: name.baseline - h, w, h };
};

/** 0..1: the text "MM" giving way to the monogram. */
export const morphAt = (t: number): number => expoInOut(progress(t, T.morph, 0.3));

/** 0..1: the hook's logo leaving before the loading scene. */
export const hookOutAt = (t: number): number => expoInOut(progress(t, T.hookOut, 0.35));

/* ---------- Text motion ---------- */

const RISE_SECONDS = 0.45;
const LEAVE_SECONDS = 0.22;
const HIDDEN = 110;

/** Vertical offset in % of the element's height: rises through its mask at `inAt`, leaves upward at `outAt`. */
export const riseAt = (t: number, inAt: number, outAt = Number.POSITIVE_INFINITY, seconds = RISE_SECONDS): number =>
  HIDDEN * (1 - spring(progress(t, inAt, seconds))) - HIDDEN * expoInOut(progress(t, outAt, LEAVE_SECONDS));

const LETTER_STAGGER = 0.035;

/** Per-letter roll, like a split-flap board. */
export const letterAt = (t: number, index: number, inAt: number, outAt = Number.POSITIVE_INFINITY): number =>
  riseAt(t, inAt + index * LETTER_STAGGER, outAt + index * LETTER_STAGGER * 0.8, 0.4);

/** Blur-in: fades in out of a blur while settling upward; leaves blurring the other way. */
export const revealAt = (t: number, inAt: number, outAt = Number.POSITIVE_INFINITY, seconds = 0.6): Reveal => {
  const shown = spring(progress(t, inAt, seconds));
  const gone = expoInOut(progress(t, outAt, 0.35));
  return {
    opacity: clamp01(shown * 1.5) * (1 - gone),
    blur: (1 - shown) * 12 + gone * 10,
    y: (1 - shown) * 0.35 - gone * 0.25,
  };
};

/** Grows from nothing with a spring (0..~1.03), shrinks away at `outAt`. */
export const growAt = (t: number, inAt: number, outAt = Number.POSITIVE_INFINITY, seconds = 0.5): number =>
  spring(progress(t, inAt, seconds)) * (1 - expoInOut(progress(t, outAt, 0.3)));

/* ---------- Loading ---------- */

/** 0..1 fill of the progress bar (and the counter). */
export const loadAt = (t: number): number => expoInOut(progress(t, T.countFrom, T.countTo - T.countFrom));

/* ---------- Floods ---------- */

export const FLOOD_SECONDS = 0.55;

/* ---------- Design scene ---------- */

/** The browser window unfolds from its first window control (where the dot lands). */
export const windowAt = (t: number) => ({
  scale: spring(progress(t, T.windowIn, 0.55)),
  out: expoInOut(progress(t, T.designOut, 0.3)),
});

/** Block `index` of the wireframe grows in. */
export const blockAt = (t: number, index: number): number => spring(progress(t, T.blocks + index * 0.12, 0.45));

export const cursorDesignAt = (t: number, layout: SplashLayout): Point & { press: number; shown: number } => {
  const grabPoint = { x: layout.dragCard.x + layout.dragCard.w * 0.6, y: layout.dragCard.y + layout.dragCard.h * 0.45 };
  const dropPoint = {
    x: grabPoint.x + (layout.slot.x - layout.dragCard.x),
    y: grabPoint.y + (layout.slot.y - layout.dragCard.y),
  };
  const enter = spring(progress(t, T.cursorDesign, 0.45));
  const start = { x: layout.window.x + layout.window.w * 1.05, y: layout.window.y + layout.window.h * 1.1 };
  let point = mixPoint(start, grabPoint, enter);
  point = mixPoint(point, dropPoint, spring(progress(t, T.grab + 0.08, 0.45)));
  point = mixPoint(
    point,
    { x: point.x + layout.window.w * 0.25, y: point.y + layout.window.h * 0.4 },
    expoInOut(progress(t, T.drop + 0.15, 0.3)),
  );
  const press = clamp01(progress(t, T.grab, 0.08)) * (1 - clamp01(progress(t, T.drop, 0.08)));
  return { ...point, press, shown: clamp01(progress(t, T.cursorDesign, 0.01)) * (1 - windowAt(t).out) };
};

/** Offset of the dragged card from its own place: follows the cursor, snaps into the slot. */
export const dragAt = (t: number, layout: SplashLayout): Point & { lift: number } => {
  const p = spring(progress(t, T.grab + 0.08, 0.45));
  return {
    x: (layout.slot.x - layout.dragCard.x) * p,
    y: (layout.slot.y - layout.dragCard.y) * p,
    lift: clamp01(progress(t, T.grab, 0.1)) * (1 - spring(progress(t, T.drop, 0.25))),
  };
};

/* ---------- Code scene ---------- */

export const terminalAt = (t: number) => ({
  scale: spring(progress(t, T.terminalIn, 0.5)),
  out: expoInOut(progress(t, T.codeOut, 0.3)),
});

/** Share of line `index` typed so far. */
export const typedAt = (t: number, index: number, length: number): number =>
  clamp01((t - T.lines[index]) / Math.max(0.25, length * 0.028));

/** The dashed connection from the terminal to the live card: 0..1 drawn. */
export const connectAt = (t: number): number => expoInOut(progress(t, T.connect, 0.35));

/** Points of the connection curve, terminal to live card (side by side, or stacked on phones). */
export const connectionOf = (layout: SplashLayout): { from: Point; to: Point; c1: Point; c2: Point } => {
  const { terminal, live } = layout;
  const stacked = live.y > terminal.y + terminal.h * 0.5;
  const from = stacked
    ? { x: terminal.x + terminal.w * 0.5, y: terminal.y + terminal.h }
    : { x: terminal.x + terminal.w, y: terminal.y + terminal.h * 0.5 };
  const to = stacked ? { x: live.x + live.w * 0.5, y: live.y } : { x: live.x, y: live.y + live.h * 0.5 };
  const bend = stacked ? { x: 0, y: (to.y - from.y) * 0.5 } : { x: (to.x - from.x) * 0.5, y: 0 };
  return { from, to, c1: { x: from.x + bend.x, y: from.y + bend.y }, c2: { x: to.x - bend.x, y: to.y - bend.y } };
};

export const bezier = (from: Point, c1: Point, c2: Point, to: Point, q: number): Point => {
  const u = 1 - q;
  return {
    x: u * u * u * from.x + 3 * u * u * q * c1.x + 3 * u * q * q * c2.x + q * q * q * to.x,
    y: u * u * u * from.y + 3 * u * u * q * c1.y + 3 * u * q * q * c2.y + q * q * q * to.y,
  };
};

/* ---------- Dot matrix ---------- */

export type MatrixDot = { x: number; y: number; r: number; tone: "ink" | "faint" };

/**
 * Ripples out of the dot, rides a wave, becomes a lit halftone sphere,
 * lights up as the monogram, then the letters' dots swell until they merge.
 */
export const matrixAt = (t: number, layout: SplashLayout): { dots: MatrixDot[]; clipToLetters: boolean } => {
  if (t < T.gridIn || t >= T.condense + 0.45) {
    return { dots: [], clipToLetters: false };
  }
  const { spacing, dots } = layout.grid;
  const waveAmount = progress(t, T.wave, 0.3) * (1 - progress(t, T.sphere, 0.35));
  const sphereAmount = spring(progress(t, T.sphere, 0.5)) * (1 - progress(t, T.monogram, 0.4));
  const condense = expoInOut(progress(t, T.condense, 0.42));
  const sphereCenter = { x: layout.width / 2, y: layout.height / 2 };
  const sphereRadius = 0.34 * Math.min(layout.width, layout.height);
  const light = { x: Math.cos(t * 1.6) * 0.55 - 0.3, y: -0.45 };
  const result: MatrixDot[] = [];
  for (const dot of dots) {
    if (dot.period) {
      continue;
    }
    const grow = spring(progress(t, T.gridIn + dot.distance * 0.55, 0.35));
    const wave = Math.sin((dot.x / layout.width) * Math.PI * 3 - (t - T.wave) * 6) * waveAmount;
    let r = spacing * 0.2 * grow * (1 + 0.55 * wave);
    // Halftone sphere lit from the top left, the light swinging slowly.
    const dx = (dot.x - sphereCenter.x) / sphereRadius;
    const dy = (dot.y - sphereCenter.y) / sphereRadius;
    const inSphere = dx * dx + dy * dy < 1;
    const shade = inSphere
      ? clamp01(0.25 + Math.sqrt(1 - dx * dx - dy * dy) * 0.4 - (dx * light.x + dy * light.y) * 0.55)
      : 0.08;
    r = mix(r, spacing * 0.46 * shade, sphereAmount);
    const on = spring(progress(t, T.monogram + dot.seed * 0.25, 0.4));
    r = dot.inside ? mix(r, spacing * 0.42, on) : mix(r, spacing * 0.1, on);
    r = dot.inside ? mix(r, spacing * 0.8, condense) : r * (1 - condense);
    if (r > 0.2) {
      result.push({
        x: dot.x,
        y: dot.y + wave * spacing * 0.45,
        r,
        tone: dot.inside || on < 0.5 ? "ink" : "faint",
      });
    }
  }
  return { dots: result, clipToLetters: condense > 0 };
};

/* ---------- The monogram (matrix, then the stack hub) ---------- */

/** The solid monogram replaces the dot matrix the moment the dots have merged into letters. */
export const logoAt = (t: number, layout: SplashLayout): { box: Box; shown: boolean } => ({
  box: mixBox(layout.logo, layout.hub, spring(progress(t, T.hubIn, 0.6))),
  shown: t >= T.condense + 0.42 && t < T.floods[3] + 0.3,
});

/* ---------- Stack scene ---------- */

export const chipAt = (t: number, index: number): number => growAt(t, T.chipsIn + index * 0.15, T.stackOut);
export const linkAt = (t: number, index: number): number =>
  expoInOut(progress(t, T.linksIn + index * 0.15, 0.45)) * (1 - expoInOut(progress(t, T.stackOut, 0.3)));

/** Pulses running from each chip into the hub: positions 0..1 along each link. */
export const pulsesAt = (t: number, index: number): number[] => {
  if (t < T.pulses || t > T.stackOut) {
    return [];
  }
  const phase = (t - T.pulses) * 0.9 + rand(index, 2);
  return [phase % 1, (phase + 0.5) % 1];
};

/** The curved link from a chip to the hub. */
export const linkCurve = (layout: SplashLayout, chip: Box): { from: Point; c1: Point; c2: Point; to: Point } => {
  const hub = { x: layout.hub.x + layout.hub.w / 2, y: layout.hub.y + layout.hub.h / 2 };
  const from = { x: chip.x + chip.w / 2, y: chip.y + chip.h / 2 };
  return { from, c1: { x: mix(from.x, hub.x, 0.5), y: from.y }, c2: { x: mix(from.x, hub.x, 0.5), y: hub.y }, to: hub };
};

/* ---------- Statements ---------- */

export const tagAt = (t: number, index: number, layout: SplashLayout): Point & { reveal: Reveal } => {
  const drift = t - T.tagsIn;
  return {
    x: layout.width * (0.04 + 0.8 * rand(index, 11)) + Math.sin(t * 0.6 + index) * 14,
    y: layout.height * (0.08 + 0.84 * rand(index, 12)) - drift * (10 + 14 * rand(index, 13)),
    reveal: revealAt(t, T.tagsIn + index * 0.1, T.statementsOut),
  };
};

/* ---------- End card ---------- */

export const ORBIT_DOTS = 28;

/** The ring of dots orbiting the big mark, spiralling into its period. */
export const orbitAt = (t: number, layout: SplashLayout): { x: number; y: number; r: number; alpha: number }[] => {
  if (t < T.markIn || t > T.markSettle + 0.2) {
    return [];
  }
  const mark = layout.bigMark;
  const middle = { x: mark.x + mark.w / 2, y: mark.y + mark.h / 2 };
  const period = periodOf(mark);
  const open = spring(progress(t, T.markIn + 0.1, 0.6));
  const collapse = expoInOut(progress(t, T.orbitCollapse, 0.4));
  return Array.from({ length: ORBIT_DOTS }, (_, index) => {
    const angle = (index / ORBIT_DOTS) * Math.PI * 2 + (t - T.markIn) * 1.2 + collapse * 4;
    const ring = {
      x: middle.x + Math.cos(angle) * mark.w * 0.78 * open,
      y: middle.y + Math.sin(angle) * mark.h * 1.45 * open,
    };
    return {
      ...mixPoint(ring, period, collapse),
      r: 1.4 + rand(index, 21) * 1.6,
      alpha: open * (1 - collapse * collapse) * (0.4 + 0.6 * rand(index, 22)),
    };
  });
};

/** The end-card mark: grows big and centred, then settles beside the name. */
export const markAt = (t: number, layout: SplashLayout): { box: Box; scale: number } => ({
  box: mixBox(layout.bigMark, layout.endMark, spring(progress(t, T.markSettle, 0.6))),
  scale: spring(progress(t, T.markIn, 0.55)),
});

export type PillState = { scale: number; lit: number };

export const pillAt = (t: number): PillState => {
  const press = Math.sin(Math.PI * progress(t, T.click, 0.22));
  return {
    scale: mix(0.4, 1, spring(progress(t, T.ctaIn, 0.45))) * (1 - 0.05 * press),
    lit: spring(progress(t, T.click, 0.3)),
  };
};

export const cursorEndAt = (t: number, layout: SplashLayout): Point & { scale: number; shown: number } => {
  const { pill } = layout;
  const target = { x: pill.x + pill.w * 0.72, y: pill.y + pill.h * 0.62 };
  const p = spring(progress(t, T.cursorEnd, 0.75));
  const start = { x: layout.width * 1.04, y: layout.height * 1.08 };
  return {
    x: mix(start.x, target.x, p),
    y: mix(start.y, target.y, p) - 0.06 * layout.height * Math.sin(Math.PI * progress(t, T.cursorEnd, 0.75)),
    scale: 1 - 0.15 * Math.sin(Math.PI * progress(t, T.click, 0.22)),
    shown: clamp01(progress(t, T.cursorEnd, 0.01)),
  };
};

/* ---------- Camera ---------- */

const SCENES = [
  0,
  T.loadIn,
  T.floods[0],
  T.windowIn,
  T.terminalIn,
  T.gridIn,
  T.hubIn,
  T.floods[3],
  T.floods[4],
  T.exit,
] as const;
const PUSH_PER_SCENE = 0.014;

export type Camera = { scale: number; focus: Point };

/**
 * Pushes in a little every scene (never still), zooms onto the drag in the
 * design scene, kicks on the end card, and settles back to 1 for the exit so
 * the mark can land on the real navbar.
 */
export const cameraAt = (t: number, layout: SplashLayout): Camera => {
  const index = Math.max(
    0,
    SCENES.findLastIndex((start) => t >= start),
  );
  const scene = Math.min(index, SCENES.length - 2);
  const p = progress(t, SCENES[scene], SCENES[scene + 1] - SCENES[scene]);
  let scale = 1 + PUSH_PER_SCENE * (scene + expoOut(p));
  const zoom = spring(progress(t, T.cursorDesign, 0.7)) * (1 - expoInOut(progress(t, T.drop + 0.2, 0.5)));
  scale *= 1 + 0.16 * zoom;
  const since = t - T.markSettle;
  scale += since <= 0 ? 0 : 0.04 * (1 - Math.exp(-since * 25)) * Math.exp(-since * 4);
  const settle = expoInOut(progress(t, T.exit, 0.4));
  const middle = { x: layout.width / 2, y: layout.height / 2 };
  const slot = { x: layout.slot.x + layout.slot.w / 2, y: layout.slot.y + layout.slot.h / 2 };
  return { scale: mix(scale, 1, settle), focus: mixPoint(middle, slot, zoom * 0.6) };
};

export const toScreen = (point: Point, camera: Camera, layout: SplashLayout): Point => ({
  x: layout.width / 2 + (point.x - camera.focus.x) * camera.scale,
  y: layout.height / 2 + (point.y - camera.focus.y) * camera.scale,
});

/* ---------- The dot (through-line object) ---------- */

export type DotState = Point & { size: number; /** 0 = signal orange, 1 = ink. */ ink: number };

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
 * The orange dot: a caption bullet, the full stop of "Hello." and the name,
 * the tip of the progress bar, the origin of every colour flood, a window
 * control, the live site's status light, the seed of the dot matrix, the
 * monogram's period, a list bullet, and the period of the end-card mark.
 */
export const dotAt = (t: number, layout: SplashLayout): DotState => {
  const { intro, hello, name, bar, moments, statements } = layout;
  const bullet = { x: intro.box.x - 0.8 * intro.fs, y: intro.end.y - 0.36 * intro.fs, size: 0.55 * intro.fs };
  let dot: DotState = { ...bullet, size: bullet.size * spring(progress(t, 0, 0.35)), ink: 0 };
  dot = hop(dot, fullStop(hello), t, T.helloIn, 0.45, 0.25 * hello.fs);
  dot = hop(dot, nameStopAt(t, name), t, T.nameIn + 0.1, 0.42, 0.2 * name.fs);
  dot = hop(dot, periodOf(hookLogoOf(name)), t, T.morph, 0.4);

  const tip = { x: bar.x + bar.w * loadAt(t), y: bar.y + bar.h / 2, size: bar.h * 2.2 };
  dot = hop(dot, tip, t, T.loadIn, 0.4, 0.1 * layout.height);
  if (t >= T.loadIn + 0.4) {
    dot = { ...dot, x: tip.x, y: tip.y };
  }

  moments.forEach((moment, index) => {
    dot = hop(dot, fullStop(moment), t, T.momentsIn[index], 0.42, 0.2 * moment.fs);
  });

  const light = Math.max(8, layout.window.w * 0.016);
  dot = hop(dot, { ...layout.windowLight, size: light }, t, T.windowIn - 0.15, 0.4, 0.08 * layout.height);
  dot = hop(dot, { ...layout.terminalLight, size: light }, t, T.designOut, 0.45, 0.08 * layout.height);
  if (t >= T.ride) {
    const { from, c1, c2, to } = connectionOf(layout);
    const along = bezier(from, c1, c2, to, expoInOut(progress(t, T.ride, 0.55)));
    dot = hop(dot, { ...along, size: light * 1.2 }, t, T.ride, 0.12);
  }
  dot = hop(dot, { ...layout.liveLight, size: light * 1.2 }, t, T.ride + 0.5, 0.2);

  dot = hop(dot, periodOf(layout.logo), t, T.monogram, 0.5, 0.12 * layout.height);
  dot = hop(dot, periodOf(logoAt(t, layout).box), t, T.hubIn, 0.6);

  statements.forEach((line, index) => {
    const marker = { x: line.box.x - 0.45 * line.fs, y: line.end.y - 0.34 * line.fs, size: 0.2 * line.fs };
    dot = hop(dot, marker, t, statementAt(index), 0.4, 0.1 * line.fs);
  });

  dot = hop(dot, periodOf(markAt(t, layout).box), t, T.markIn, 0.5, 0.1 * layout.height);
  if (t >= T.markSettle) {
    dot = { ...dot, ...periodOf(markAt(t, layout).box) };
  }

  // Ink while it sits on the orange flood, so it never vanishes into it.
  const ink = spring(progress(t, T.floods[0] + 0.1, 0.25)) * (1 - spring(progress(t, T.floods[1] + 0.1, 0.25)));
  return { ...dot, ink };
};

/* ---------- Exit ---------- */

/** 0..1: the splash fades away while the mark flies to the navbar. */
export const exitFadeAt = (t: number, start: number): number => expoInOut(progress(t, start, 0.6));
export const exitFlightAt = (t: number, start: number): number => spring(progress(t, start + 0.1, 0.9));
