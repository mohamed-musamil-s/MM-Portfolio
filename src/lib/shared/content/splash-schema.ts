import { z } from "zod";

/**
 * Content model for the name splash that plays before the portfolio
 * (docs/screens/SPLASH_BUSINESS.md §3). Words are short on purpose: each one
 * holds the screen for a beat.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

/** A caption whose `key` part is set in the accent colour. */
const caption = z.object({ lead: text(40), key: text(24) });

export const splashContentSchema = z.object({
  /** Master switch: off means no splash anywhere. */
  enabled: z.boolean(),
  /** Opening caption next to the dot: "Let's talk craft." */
  intro: caption,
  /** The first giant word; the dot is its full stop. */
  hello: text(10),
  /** Bracketed caption over the name: "[ You found the portfolio of ]". */
  bracket: text(48),
  /** "I DESIGN. / I BUILD. / I ANIMATE.", one per beat, each on its own colour. */
  moments: z.object({ lead: text(6), first: text(10), second: text(10), third: text(10) }),
  /** Bracketed caption under the dot-matrix monogram. */
  detail: caption,
  name: z.object({ first: text(14), last: text(14) }),
  /** On the orange banner. */
  role: text(40),
  /** The button the cursor clicks to open the portfolio. */
  cta: text(24),
  skip: text(24),
  /** Accessible name of the intro. */
  srLabel: text(80),
});

export type SplashContent = z.infer<typeof splashContentSchema>;
