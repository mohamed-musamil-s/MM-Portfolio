import { clamp01, expoInOut, expoOut, mix, progress, spring } from "@/lib/shared/motion/time-easing";
import { MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";

/*
 * The name splash as pure functions of time (docs/screens/SPLASH_BUSINESS.md §4).
 * Given `t` (seconds) and the measured layout, each function returns where
 * something is and how it is lit. Nothing here touches the DOM or keeps
 * state, so any frame can be rendered in any order.
 */

/** 120 BPM. */
export const BEAT = 0.5;
export const at = (beat: number): number => beat * BEAT;

export const SCENES = {
  macro: 0,
  claim: at(5),
  cards: at(10),
  stars: at(13),
  card: at(16),
  exit: at(20),
} as const;

export const EXIT_AT = SCENES.exit;
export const EXIT_SECONDS = 0.6;
/** Preview loop: the end card stays a moment, then the sequence restarts. */
export const LOOP_SECONDS = EXIT_AT + 1.2;

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };
export type Card = Box & { moment: number | null };

export type SplashLayout = {
  width: number;
  height: number;
  /** The big monogram, centred (macro shot and the star convergence). */
  hero: Box;
  /** The small monogram inside the claim line. */
  glyph: Box;
  /** The monogram beside the name on the end card. */
  endGlyph: Box;
  /** The claim word ("Two letters") and its font size. */
  claim: Box & { fs: number };
  /** Pixels of the claim word, for the dissolve. */
  dust: Point[];
  /** Points along the monogram's outline, in viewBox units. */
  outline: Point[];
  cards: Card[];
};

/* ---------- Helpers ---------- */

const center = (layout: SplashLayout): Point => ({ x: layout.width / 2, y: layout.height / 2 });

const mixBox = (from: Box, to: Box, p: number): Box => ({
  x: mix(from.x, to.x, p),
  y: mix(from.y, to.y, p),
  w: mix(from.w, to.w, p),
  h: mix(from.h, to.h, p),
});

const mixPoint = (from: Point, to: Point, p: number): Point => ({ x: mix(from.x, to.x, p), y: mix(from.y, to.y, p) });

/** Stable pseudo-random 0..1 for (index, salt): same value every frame. */
export const rand = (index: number, salt: number): number => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

/** A point given in monogram viewBox units, placed in a monogram box. */
export const inMono = (box: Box, point: Point): Point => ({
  x: box.x + (point.x / MONOGRAM_VIEWBOX.width) * box.w,
  y: box.y + (point.y / MONOGRAM_VIEWBOX.height) * box.h,
});

const PERIOD = { x: 398, y: 154, r: 16 } as const;
/** Where the diagonal cut between the two Ms meets the top: the macro shot starts here. */
const CUT = { x: 181, y: 38 } as const;

/* ---------- Reveals (blur in, blur out) ---------- */

export type Reveal = { opacity: number; blur: number; y: number };

const REVEAL_SECONDS = 0.6;
const HIDE_SECONDS = 0.35;

/** Fades in out of a blur while settling upward; leaves blurring the other way. `y` is in em. */
export const revealAt = (t: number, inAt: number, outAt = Number.POSITIVE_INFINITY): Reveal => {
  const shown = spring(progress(t, inAt, REVEAL_SECONDS));
  const gone = expoInOut(progress(t, outAt, HIDE_SECONDS));
  return {
    opacity: clamp01(shown * 1.5) * (1 - gone),
    blur: (1 - shown) * 14 + gone * 10,
    y: (1 - shown) * 0.35 - gone * 0.25,
  };
};

/** Beat-locked entry times. Outgoing things leave before incoming ones arrive. */
export const TIMES = {
  claimIn: at(5) + 0.4,
  subtitleIn: at(6) + 0.1,
  strike: at(7),
  glitch: at(7) + 0.05,
  dissolve: at(7) + 0.4,
  questionIn: at(8) + 0.25,
  lineOut: at(9) + 0.25,
  nameIn: at(16) + 0.2,
  roleIn: at(17),
  taglineIn: at(18),
  labelIn: at(19),
} as const;

/* ---------- Camera ---------- */

export type Camera = { focus: Point; scale: number; rotate: number };

const MACRO = { start: 0.1, seconds: 2.3, scale: 6.5, rotate: -0.25 } as const;

/**
 * Starts as a macro shot on the monogram's diagonal cut, pulls back to the
 * whole mark, pushes in gently through the claim, pulls back to show the card
 * grid, then pushes in again for the convergence and the end card.
 */
export const cameraAt = (t: number, layout: SplashLayout): Camera => {
  const pull = expoInOut(progress(t, MACRO.start, MACRO.seconds));
  const focus = mixPoint(inMono(layout.hero, CUT), center(layout), pull);
  let scale = mix(MACRO.scale, 1, pull);
  scale *= 1 + 0.04 * expoOut(progress(t, SCENES.claim, SCENES.cards - SCENES.claim));
  scale *= mix(1, 0.8, spring(progress(t, at(11), 1)));
  scale *= mix(1, 1.25, expoInOut(progress(t, at(13) + 0.1, 1.4)));
  scale *= 1 + 0.04 * expoOut(progress(t, SCENES.card, SCENES.exit - SCENES.card + EXIT_SECONDS));
  return { focus, scale, rotate: mix(MACRO.rotate, 0, pull) };
};

/** Where a stage point appears on screen through the camera. */
export const toScreen = (point: Point, camera: Camera, layout: SplashLayout): Point => {
  const dx = (point.x - camera.focus.x) * camera.scale;
  const dy = (point.y - camera.focus.y) * camera.scale;
  const cos = Math.cos(camera.rotate);
  const sin = Math.sin(camera.rotate);
  return { x: layout.width / 2 + dx * cos - dy * sin, y: layout.height / 2 + dx * sin + dy * cos };
};

/* ---------- The monogram ---------- */

export type HeroState = {
  box: Box;
  opacity: number;
  /** How much of the paper colour the letters take: dark and rim-lit (low) to bright (high), in %. */
  lit: number;
  /** Orange halo around the mark, 0..1. */
  halo: number;
  /** Strength of the light streaks running along the edges, 0..1. */
  streaks: number;
  /** The warm light gliding over the letters, in viewBox units. */
  light: Point;
};

export const heroAt = (t: number, layout: SplashLayout): HeroState => {
  const inStars = t >= SCENES.cards;
  let box = mixBox(layout.hero, layout.glyph, spring(progress(t, SCENES.claim, 0.55)));
  if (inStars) {
    box = layout.hero;
  }
  box = mixBox(box, layout.endGlyph, spring(progress(t, SCENES.card, 0.6)));

  const opacity = inStars
    ? spring(progress(t, at(15) + 0.05, 0.45))
    : 1 - expoInOut(progress(t, TIMES.lineOut, HIDE_SECONDS));
  const lit = inStars
    ? mix(8, 92, spring(progress(t, at(15) + 0.2, 0.5)))
    : mix(8, 90, spring(progress(t, SCENES.claim + 0.1, 0.6)));
  const halo = inStars ? spring(progress(t, at(15), 0.6)) * (1 - 0.6 * spring(progress(t, SCENES.card, 0.8))) : 0;
  const streaks = inStars ? spring(progress(t, at(15), 0.4)) * 0.9 : 1 - 0.6 * progress(t, SCENES.claim, 0.6);
  const sweep = expoInOut(progress(t, 0, SCENES.claim));
  const light = inStars ? { x: 210, y: 40 } : { x: mix(40, 330, sweep), y: mix(10, 120, sweep) };
  return { box, opacity, lit, halo, streaks, light };
};

/** Position of a light streak along the outline (fraction of its length), for streak 0 or 1. */
export const streakAt = (t: number, index: number): number => (index * 0.5 + 0.12 + t * 0.32) % 1;

/* ---------- Claim line ---------- */

/** Strike-through drawn by the dot: 0..1 grow, then retract. */
const strikeAt = (t: number) => ({
  grow: spring(progress(t, TIMES.strike, 0.35)),
  retract: spring(progress(t, TIMES.dissolve + 0.15, 0.4)),
});

/** Horizontal RGB offset of the claim while it glitches, in px. */
export const glitchAt = (t: number, layout: SplashLayout): number => {
  const p = progress(t, TIMES.glitch, 0.4);
  if (p <= 0 || p >= 1) {
    return 0;
  }
  const jitter = Math.sign(Math.sin(t * 173)) * (0.5 + 0.5 * Math.abs(Math.sin(t * 91)));
  return Math.sin(Math.PI * p) * 0.06 * layout.claim.fs * jitter;
};

/** Share of the claim (from the left) already dissolved into dust. */
export const dissolvedAt = (t: number): number => expoInOut(progress(t, TIMES.dissolve, 0.35));

export type Dust = { x: number; y: number; r: number; alpha: number; accent: boolean };

const DUST_LIFE = 0.75;

export const dustAt = (t: number, layout: SplashLayout): Dust[] => {
  const { claim } = layout;
  const result: Dust[] = [];
  layout.dust.forEach((point, index) => {
    const start = TIMES.dissolve + ((point.x - claim.x) / claim.w) * 0.35;
    const age = t - start;
    if (age <= 0 || age >= DUST_LIFE) {
      return;
    }
    result.push({
      x: point.x + (90 + 220 * rand(index, 1)) * age,
      y: point.y + (-60 + 70 * rand(index, 2)) * age - 40 * age * age,
      r: 0.7 + rand(index, 3) * 1.3,
      alpha: (1 - age / DUST_LIFE) * 0.9,
      accent: index % 9 === 0,
    });
  });
  return result;
};

/* ---------- Cards ---------- */

/** Grid of cards: 5 × 3 on wide screens, 3 × 5 on phones. The middle row's centre three carry the moments. */
export const gridOf = (width: number, height: number): Card[] => {
  const phone = width < 640;
  const columns = phone ? 3 : 5;
  const rows = phone ? 5 : 3;
  const w = phone ? 0.3 * width : Math.min(0.19 * width, 0.34 * height, 300);
  const h = w * 0.68;
  const gap = w * 0.12;
  const left = width / 2 - (columns * w + (columns - 1) * gap) / 2;
  const top = height / 2 - (rows * h + (rows - 1) * gap) / 2;
  const middleRow = Math.floor(rows / 2);
  const middleColumn = Math.floor(columns / 2);
  const cards: Card[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const offset = column - middleColumn;
      const moment = row === middleRow && Math.abs(offset) <= 1 ? [1, 0, 2][offset + 1] : null;
      cards.push({ x: left + column * (w + gap), y: top + row * (h + gap), w, h, moment: moment ?? null });
    }
  }
  return cards;
};

export type CardState = { x: number; y: number; scale: number; opacity: number; blur: number };

const COLLAPSE = at(12) + 0.45;

const nearestMoment = (layout: SplashLayout, card: Card): Card =>
  layout.cards
    .filter((item) => item.moment !== null)
    .sort((a, b) => Math.hypot(a.x - card.x, a.y - card.y) - Math.hypot(b.x - card.x, b.y - card.y))[0] ?? card;

export const cardAt = (t: number, layout: SplashLayout, index: number): CardState => {
  const card = layout.cards[index];
  const lead = layout.cards.find((item) => item.moment === 0) ?? card;
  const collapse = expoInOut(progress(t, COLLAPSE + rand(index, 7) * 0.1, 0.3));
  let from: Box = lead;
  let move = 1;
  let shown = 1;
  let blur = 0;
  let grow = 1;
  if (card.moment === 0) {
    const reveal = revealAt(t, SCENES.cards);
    shown = reveal.opacity;
    blur = reveal.blur;
    from = { ...card, y: card.y + reveal.y * card.h * 0.4 };
    move = 0;
  } else if (card.moment !== null) {
    move = spring(progress(t, SCENES.cards + 0.4, 0.55));
    shown = clamp01(progress(t, SCENES.cards + 0.4, 0.2));
  } else {
    // The rest multiply out of the nearest moment card, nearest first.
    from = nearestMoment(layout, card);
    const distance = Math.hypot(from.x - card.x, from.y - card.y) / card.w;
    const start = at(11) + 0.05 + distance * 0.07;
    move = spring(progress(t, start, 0.6));
    shown = clamp01(progress(t, start, 0.25));
    grow = mix(0.7, 1, move);
  }
  return {
    x: mix(from.x, card.x, move),
    y: mix(from.y, card.y, move),
    scale: grow * (1 - 0.95 * collapse),
    opacity: shown * (1 - collapse),
    blur,
  };
};

/** Top-right status point of the lead card: the dot sits here during the card scene. */
const statusPoint = (card: Box, state: CardState): Point => ({
  x: state.x + card.w * 0.9,
  y: state.y + card.w * 0.1,
});

/* ---------- Stars (cards collapse, drift, converge into the monogram) ---------- */

export const PARTICLES = 64;
const LINK_SHARE = 0.11;

export type Star = { x: number; y: number; r: number; alpha: number; accent: boolean };

const leadIndex = (layout: SplashLayout) =>
  Math.max(
    0,
    layout.cards.findIndex((card) => card.moment === 0),
  );

const starAt = (t: number, layout: SplashLayout, index: number): Point => {
  const { width, height, cards } = layout;
  const lead = leadIndex(layout);
  const source = cards[index - 1];
  const spawn =
    index === 0
      ? statusPoint(cards[lead], cardAt(COLLAPSE, layout, lead))
      : source
        ? { x: source.x + source.w / 2, y: source.y + source.h / 2 }
        : { x: width * (0.35 + 0.3 * rand(index, 8)), y: height * (0.35 + 0.3 * rand(index, 9)) };
  const field = {
    x: width * (0.05 + 0.9 * rand(index, 1)) + Math.sin(t * 0.9 + index) * 0.012 * width,
    y: height * (0.07 + 0.86 * rand(index, 2)) + Math.cos(t * 0.7 + index * 1.3) * 0.012 * height,
  };
  const outline = layout.outline[(index * 7) % Math.max(1, layout.outline.length)] ?? PERIOD;
  const target = inMono(layout.hero, index === 0 ? PERIOD : outline);
  const spread = spring(progress(t, COLLAPSE + rand(index, 3) * 0.12, 0.7));
  const gather = expoInOut(progress(t, at(14) + 0.25 + rand(index, 4) * 0.2, 0.55));
  return mixPoint(mixPoint(spawn, field, spread), target, gather);
};

export const starsAt = (t: number, layout: SplashLayout): { stars: Star[]; links: number } => {
  if (t < COLLAPSE || t > at(15) + 0.6) {
    return { stars: [], links: 0 };
  }
  const alpha = spring(progress(t, COLLAPSE, 0.3)) * (1 - progress(t, at(15) + 0.25, 0.3));
  const stars = Array.from({ length: PARTICLES }, (_, index) => ({
    ...starAt(t, layout, index),
    r: 1.1 + rand(index, 5) * 1.7,
    alpha: index === 0 ? 0 : alpha * (0.55 + 0.45 * rand(index, 6)),
    accent: index % 7 === 3,
  }));
  return { stars, links: alpha * (1 - expoInOut(progress(t, at(14) + 0.2, 0.5))) };
};

export const linkDistance = (layout: SplashLayout): number => LINK_SHARE * Math.hypot(layout.width, layout.height);

/* ---------- The dot (through-line object) ---------- */

export type DotState = { x: number; y: number; w: number; h: number; glow: number };

const toward = (from: DotState, to: Partial<DotState>, p: number): DotState => ({
  x: mix(from.x, to.x ?? from.x, p),
  y: mix(from.y, to.y ?? from.y, p),
  w: mix(from.w, to.w ?? from.w, p),
  h: mix(from.h, to.h ?? from.h, p),
  glow: mix(from.glow, to.glow ?? from.glow, p),
});

const periodOf = (box: Box) => {
  const point = inMono(box, PERIOD);
  const size = ((2 * PERIOD.r) / MONOGRAM_VIEWBOX.height) * box.h;
  return { ...point, w: size, h: size };
};

/**
 * The monogram's orange full stop: ignites as the macro shot pulls back,
 * draws the strike-through, becomes the lead card's status light, leads the
 * stars into the monogram, and ends as its period on the end card.
 */
export const dotAt = (t: number, layout: SplashLayout): DotState => {
  const ignite = spring(progress(t, 1.7, 0.5));
  // Follows the mark into the claim line (not reset for the stars, so the dot never jumps).
  const period = periodOf(mixBox(layout.hero, layout.glyph, spring(progress(t, SCENES.claim, 0.55))));
  let dot: DotState = { ...period, w: period.w * ignite, h: period.h * ignite, glow: ignite };

  // Strike-through: stretch from the period across the claim, then pull back.
  const { claim } = layout;
  const strike = strikeAt(t);
  const thickness = Math.max(3, 0.06 * claim.fs);
  const lineWidth = claim.x + claim.w - period.x + period.w / 2;
  // Through the middle of the lowercase letters, not on the baseline.
  const strikeY = period.y + period.h / 2 - 0.3 * claim.fs;
  dot = toward(dot, { x: period.x + (lineWidth - period.w) / 2, y: strikeY, w: lineWidth, h: thickness }, strike.grow);
  dot = toward(dot, { x: period.x, y: period.y, w: period.w, h: period.h }, strike.retract);

  // Cards: the lead card's status light.
  const lead = leadIndex(layout);
  const status = statusPoint(layout.cards[lead], cardAt(t, layout, lead));
  const light = 0.07 * layout.cards[lead].w;
  dot = toward(dot, { ...status, w: light, h: light, glow: 0.7 }, spring(progress(t, SCENES.cards, 0.6)));

  // Stars: lead them into the monogram's period.
  if (t >= COLLAPSE) {
    const star = starAt(t, layout, 0);
    dot = toward(dot, { ...star, w: light * 0.8, h: light * 0.8, glow: 1 }, spring(progress(t, COLLAPSE, 0.25)));
  }
  dot = toward(dot, { ...periodOf(heroAt(t, layout).box), glow: 0.8 }, spring(progress(t, at(15), 0.35)));
  return dot;
};

/* ---------- Light and exit ---------- */

/** Strength of the warm light pool behind everything, 0..1. */
export const poolAt = (t: number): number =>
  spring(progress(t, 0, 0.8)) * mix(1, 0.6, progress(t, SCENES.cards, 1)) * mix(1, 1.5, progress(t, at(15), 0.6));

/** Share of the screen uncovered from the bottom by the exit wipe. */
export const exitAt = (t: number, start: number): number => expoInOut(progress(t, start, EXIT_SECONDS));
