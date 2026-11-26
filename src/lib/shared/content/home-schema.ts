import { z } from "zod";
import {
  aboutSchema,
  contactSchema,
  educationSchema,
  experienceSchema,
  footerSchema,
  recognitionSchema,
  skillsSchema,
  workSchema,
} from "./home-sections-schema";

/**
 * Content model for the portfolio home (docs/screens/HOME_BUSINESS.md §3):
 * the navbar, the hero and every section under it (home-sections-schema.ts).
 */

const text = (max: number) => z.string().trim().min(1).max(max);
const link = z.object({ label: text(28), href: text(200) });

export const homeContentSchema = z.object({
  meta: z.object({ title: text(70), description: text(160) }),
  nav: z.object({
    /** Shown beside the monogram (two lines when it has a space). */
    name: text(40),
    links: z.array(link).min(2).max(6),
    status: text(40),
    cta: link,
    menu: text(12),
    close: text(12),
  }),
  hero: z.object({
    /** Small chip above the name. */
    status: text(40),
    /** The name, one massive line each; the second line is set in outline. */
    lines: z.array(text(16)).min(1).max(3),
    role: text(40),
    roleMeta: text(40),
    intro: text(260),
    primary: link,
    secondary: link,
    /** Numbers on the rail along the bottom; non-digits are marked in the accent. */
    stats: z.array(z.object({ value: text(10), label: text(28) })).max(4),
    portrait: z.object({ src: text(200), alt: text(160), caption: text(48) }),
    marquee: z.array(text(24)).min(2).max(8),
  }),
  about: aboutSchema,
  experience: experienceSchema,
  education: educationSchema,
  skills: skillsSchema,
  work: workSchema,
  recognition: recognitionSchema,
  contact: contactSchema,
  footer: footerSchema,
});

export type HomeContent = z.infer<typeof homeContentSchema>;
