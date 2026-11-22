/** Full circle as a path, so it can be drawn and morphed like any other stroke. */
export const circlePath = (cx: number, cy: number, r: number): string =>
  `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}`;

/** Picks the variant for a state, falling back to idle. */
export const pick = <T>(variants: { idle: T } & Partial<Record<string, T>>, state: string): T =>
  variants[state] ?? variants.idle;

/** Hand-drawn marks echoing the poster's brush X and checkmark. */
export const CHECK_PATH = "M5.5 12.8L9.8 16.6L18.6 7.2";
export const X_STROKE_A = "M6.2 6.6L17.8 17.4";
export const X_STROKE_B = "M6.6 17.8L17.4 6.2";

/** Icon-scale error shake (viewBox units). */
export const ICON_SHAKE = [0, -2, 2, -1.4, 1.4, -0.6, 0];
