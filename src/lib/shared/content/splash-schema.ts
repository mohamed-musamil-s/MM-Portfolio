import { z } from "zod";

/**
 * Content model for the name splash that plays before the portfolio
 * (docs/screens/SPLASH_BUSINESS.md §3). Words are short on purpose: each one
 * fills the screen on its own beat.
 */

const text = (max: number) => z.string().trim().min(1).max(max);
const word = text(12);

export const splashContentSchema = z.object({
  /** Master switch: off means no splash anywhere. */
  enabled: z.boolean(),
  /** The three hook words, one per beat. The key word gets the orange underline. */
  hook: z.object({ first: word, second: word, keyWord: word }),
  /** What the owner does: shown in a selection frame, typed behind a caret, drawn along an ease curve. */
  moments: z.object({ select: word, type: word, move: word }),
  name: z.object({ first: text(14), last: text(14) }),
  role: text(40),
  label: text(24),
  skip: text(24),
  /** Accessible name of the intro. */
  srLabel: text(80),
});

export type SplashContent = z.infer<typeof splashContentSchema>;
