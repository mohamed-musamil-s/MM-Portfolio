import { z } from "zod";

/**
 * Content model for /studio/login (docs/screens/STUDIO_LOGIN_BUSINESS.md §3).
 * Every visible string of the two-step form, including validation and error
 * messages, comes from here.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

export const studioLoginContentSchema = z.object({
  meta: z.object({ title: text(70) }),
  brand: z.object({ name: text(24) }),
  /** Placeholders: {current} {total}. */
  stepIndicator: text(32),
  emailStep: z.object({
    title: text(40),
    description: text(160),
    label: text(32),
    placeholder: text(64),
    submit: text(24),
    pending: text(24),
  }),
  codeStep: z.object({
    title: text(40),
    /** Placeholder: {email}. */
    description: text(160),
    label: text(32),
    submit: text(24),
    pending: text(24),
    back: text(24),
    success: text(48),
    /** Accessible names of the show / hide code toggle. */
    show: text(24),
    hide: text(24),
  }),
  errors: z.object({
    title: text(40),
    emailRequired: text(80),
    emailInvalid: text(80),
    codeRequired: text(80),
    codeTooShort: text(80),
    invalidCredentials: text(120),
    /** Placeholder: {minutes}. */
    locked: text(120),
    challengeExpired: text(120),
    network: text(120),
    generic: text(120),
  }),
  footer: z.object({ note: text(120) }),
});

export type StudioLoginContent = z.infer<typeof studioLoginContentSchema>;
