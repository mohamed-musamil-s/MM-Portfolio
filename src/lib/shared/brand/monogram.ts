/**
 * "MM." monogram geometry (docs/brand/LOGO.md). One source for the React
 * component and the exported SVG assets (scripts/build-brand-assets.mjs).
 *
 * Grid: cap height 170, stem 42. Each M is a stem plus a V drawn as two
 * 42-wide diagonals with a round join at the bottom. The first M has no right
 * stem: its right arm runs into the second M, whose left stem is cut parallel
 * to that arm with an 8-unit gap (the "crisp diagonal separation").
 *
 * Plain data, no imports, so Node can load it with type stripping.
 */

export const MONOGRAM_VIEWBOX = { width: 414, height: 170 } as const;

/** First M: stem + V, its right arm running into the second M. */
export const MONOGRAM_M1 = "M0 170V0H46.4L98 86.9L149.6 0H198.4L116.05 138.72A21 21 0 0 1 79.95 138.72L42 74.7V170Z";

/** Second M: left stem cut parallel to the first M's arm, V, right stem. */
export const MONOGRAM_M2 =
  "M163 170V75.3L207.7 0H209.4L261 86.9L312.6 0H363V170H321V68L279.05 138.72A21 21 0 0 1 242.95 138.72L205 74.7V170Z";

/** Both letterforms as one path (filled). */
export const MONOGRAM_LETTERS = MONOGRAM_M1 + MONOGRAM_M2;

/**
 * Centre line of the diagonal gap between the two Ms, from the top edge down
 * to where the second M's stem cut ends. The slice-split animation draws it
 * and slides the letters apart along it.
 */
export const MONOGRAM_CUT = { x1: 203.05, y1: 0, x2: 158.3, y2: 75.3 } as const;

/** Unit vector along the cut, pointing down-left (first M's way out). */
export const MONOGRAM_CUT_DIRECTION = { x: -0.511, y: 0.86 } as const;

/** The period: sits on the baseline, one stem-gap right of the last stem. */
export const MONOGRAM_DOT = { cx: 398, cy: 154, r: 16 } as const;

/** Circuit variation: fine traces that stay inside the letterforms. */
export const MONOGRAM_TRACES = [
  "M14 152V96L28 82V44",
  "M44 24L84 91.5",
  "M168 12L128 79",
  "M184 154V104L194 94V82",
  "M216 34L250 91",
  "M342 152V70L330 58V24",
] as const;

/** Terminal nodes at each trace end. */
export const MONOGRAM_NODES = [
  [14, 152],
  [28, 44],
  [44, 24],
  [84, 91.5],
  [168, 12],
  [128, 79],
  [184, 154],
  [194, 82],
  [216, 34],
  [250, 91],
  [342, 152],
  [330, 24],
] as const;

export const MONOGRAM_TRACE_WIDTH = 2;
export const MONOGRAM_NODE_RADIUS = 3.6;
/** Ring inside the period in the circuit variation. */
export const MONOGRAM_DOT_RING_RADIUS = 6.5;

/** Exact brand-asset colours from the logo brief. The site UI uses its own tokens instead. */
export const BRAND_ASSET_COLORS = {
  charcoal: "#232931",
  circuit: "#FF7B1C",
  offWhite: "#F5F4F0",
} as const;
