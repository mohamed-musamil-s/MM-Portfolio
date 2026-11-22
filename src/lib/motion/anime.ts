import { cubicBezier } from "animejs";
import type { CubicBezier } from "./tokens";

/** Convert a token bezier into an anime.js easing function. */
export const toAnimeEase = ([x1, y1, x2, y2]: CubicBezier) => cubicBezier(x1, y1, x2, y2);

export const secondsToMs = (seconds: number): number => Math.round(seconds * 1000);
