import { z } from "zod";

/**
 * Content model for the portfolio home (docs/screens/HOME_BUSINESS.md §3):
 * the navbar and the hero for now; sections are added as they are built.
 */

const text = (max: number) => z.string().trim().min(1).max(max);
const link = z.object({ label: text(28), href: text(200) });

export const homeContentSchema = z.object({
  meta: z.object({ title: text(70), description: text(160) }),
  nav: z.object({
    links: z.array(link).min(2).max(6),
    status: text(32),
    cta: link,
    menu: text(12),
    close: text(12),
  }),
  hero: z.object({
    eyebrow: text(48),
    /** The statement, one massive line each. */
    lines: z.array(text(16)).min(2).max(4),
    /** Brush lettering across the statement. */
    signature: text(32),
    intro: text(220),
    primary: link,
    secondary: link,
    meta: z.array(z.object({ label: text(20), value: text(32) })).max(4),
    chips: z.array(text(20)).max(6),
    marquee: z.array(text(24)).min(2).max(8),
    scroll: text(24),
  }),
});

export type HomeContent = z.infer<typeof homeContentSchema>;
