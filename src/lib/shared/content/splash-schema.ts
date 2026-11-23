import { z } from "zod";

/**
 * Content model for the name splash that plays before the portfolio
 * (docs/screens/SPLASH_BUSINESS.md §3). Words are short on purpose: each one
 * holds the screen for a beat or two.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

export const splashContentSchema = z.object({
  /** Master switch: off means no splash anywhere. */
  enabled: z.boolean(),
  /** "MM. = <word>": struck through and dissolved, then answered with the question mark. */
  claim: z.object({ word: text(16), subtitle: text(60), question: text(4) }),
  /** What the owner does: one word on each of the three lit cards. */
  moments: z.object({ first: text(12), second: text(12), third: text(12) }),
  name: z.object({ first: text(14), last: text(14) }),
  role: text(40),
  /** Italic serif line on the end card. */
  tagline: text(24),
  /** Small line at the bottom of the end card. */
  label: text(32),
  skip: text(24),
  /** Accessible name of the intro. */
  srLabel: text(80),
});

export type SplashContent = z.infer<typeof splashContentSchema>;
