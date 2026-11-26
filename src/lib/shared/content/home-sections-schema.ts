import { z } from "zod";

/**
 * Content model for the home page sections under the hero
 * (docs/screens/HOME_BUSINESS.md §6). Every key is always present so Content
 * Forge can build a field for it; "optional" text is an empty string and
 * "optional" flags are false.
 */

const text = (max: number) => z.string().trim().min(1).max(max);
/** Text that may be left empty. */
const maybe = (max: number) => z.string().trim().max(max);
const link = z.object({ label: text(40), href: text(300) });

/** Every section opens with the same header: number, eyebrow, title, count. */
const header = z.object({ index: text(4), eyebrow: text(60), title: text(40), count: maybe(40) });

/** A technology: name, icon path (empty for none), whether it is core, whether its icon is drawn in ink. */
const tech = z.object({ name: text(32), icon: maybe(200), core: z.boolean(), ink: z.boolean() });

export const aboutSchema = z.object({
  header,
  /** Fills in word by word as the visitor scrolls. */
  statement: text(160),
  paragraphs: z.array(text(600)).min(1).max(3),
  primary: link,
  secondary: link,
  facts: z.array(z.object({ label: text(24), big: text(16), value: text(60), highlight: z.boolean() })).max(4),
  timelineLabel: text(40),
  timeline: z.array(z.object({ period: text(20), title: text(48), org: text(48), current: z.boolean() })).max(8),
});

export const experienceSchema = z.object({
  header,
  roles: z
    .array(
      z.object({
        company: text(48),
        url: maybe(300),
        logo: maybe(200),
        title: text(48),
        period: text(32),
        location: text(48),
        duration: text(24),
        current: z.boolean(),
        /** `**bold**` marks the key phrase. */
        highlights: z.array(text(220)).min(1).max(6),
        stack: z.array(tech).max(16),
      }),
    )
    .min(1)
    .max(8),
});

export const skillsSchema = z.object({
  header,
  legend: z.object({ core: text(60), other: text(60), summary: text(80) }),
  groups: z
    .array(
      z.object({
        index: text(4),
        title: text(40),
        /** Spans two columns of the bento grid. */
        wide: z.boolean(),
        /** The one dark module. */
        dark: z.boolean(),
        note: maybe(160),
        skills: z.array(tech).min(1).max(24),
      }),
    )
    .min(1)
    .max(8),
});

export const workSchema = z.object({
  header,
  note: maybe(80),
  projects: z
    .array(
      z.object({
        index: text(4),
        title: text(48),
        category: text(48),
        period: text(24),
        summary: text(260),
        tags: z.array(text(24)).max(6),
        image: z.object({ src: text(200), alt: text(160) }),
      }),
    )
    .min(1)
    .max(8),
});

export const recognitionSchema = z.object({
  header,
  awardsLabel: text(40),
  educationLabel: text(40),
  quotesLabel: text(60),
  awards: z
    .array(z.object({ badge: text(4), title: text(60), org: text(48), year: maybe(12), text: maybe(200) }))
    .max(8),
  education: z.array(z.object({ badge: text(4), title: text(60), org: text(60), year: text(24) })).max(4),
  quotes: z.array(z.object({ quote: text(240), source: text(60) })).max(4),
});

export const contactSchema = z.object({
  header,
  headline: text(80),
  text: text(240),
  /** Shown big as the main way in (a mailto link). */
  email: maybe(120),
  details: z.array(z.object({ label: text(24), value: text(60), href: maybe(300) })).max(6),
});

export const footerSchema = z.object({
  eyebrow: text(48),
  manifesto: z.array(z.object({ word: text(16), index: text(24), text: text(80), outline: z.boolean() })).max(4),
  quote: text(80),
  quoteSource: text(80),
  closing: text(32),
  cta: link,
  links: z.array(link).max(6),
  socials: z.array(link).max(4),
  copyright: text(60),
  backToTop: text(24),
});
