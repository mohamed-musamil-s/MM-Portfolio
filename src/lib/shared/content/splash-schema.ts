import { z } from "zod";

/**
 * Content model for the name splash on `/` (docs/screens/SPLASH_BUSINESS.md §3).
 * Words are short on purpose: each one holds the screen for a beat or two.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

/** A caption whose `key` part is set in the accent colour. */
const caption = z.object({ lead: text(40), key: text(28) });

export const splashContentSchema = z.object({
  /** Master switch: off means no splash. */
  enabled: z.boolean(),
  /** Opening caption next to the dot: "Let's talk craft." */
  intro: caption,
  /** The first giant word; the dot is its full stop. */
  hello: text(10),
  /** Bracketed caption over the name. */
  bracket: text(48),
  /** Caption over the progress counter. */
  loading: text(40),
  /** "I DESIGN. / I BUILD. / I ANIMATE.", one per beat, each on its own colour. */
  moments: z.object({ lead: text(6), first: text(10), second: text(10), third: text(10) }),
  /** Caption of the design scene (the browser window being built). */
  design: caption,
  /** Code scene: caption, the lines typed in the terminal, the live site's status. */
  code: z.object({ caption, lines: z.array(text(40)).min(1).max(3), status: text(16) }),
  /** Caption under the dot-matrix monogram. */
  detail: caption,
  /** Stack scene: title, the skills around the hub, and the note under it. */
  stack: z.object({ title: caption, skills: z.array(text(16)).min(2).max(6), note: text(48) }),
  /** Stacked statements on ink, one per beat. */
  statements: z.array(text(20)).min(2).max(4),
  /** Small tags drifting behind the statements. */
  tags: z.array(text(20)).max(8),
  name: z.object({ first: text(14), last: text(14) }),
  /** Line under the name on the end card. */
  tagline: caption,
  /** The button the cursor clicks to open the page. */
  cta: text(24),
  /** Small note beside the button. */
  label: text(40),
  skip: text(24),
  /** Accessible name of the intro. */
  srLabel: text(80),
});

export type SplashContent = z.infer<typeof splashContentSchema>;
