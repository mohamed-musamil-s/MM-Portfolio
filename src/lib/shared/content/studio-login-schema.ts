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
  /** Labels of the two step pills. */
  steps: z.object({ email: text(24), code: text(24) }),
  /** Left brand panel (desktop) / top band (phones). */
  showcase: z.object({
    status: text(40),
    /** Labels inside the glass widget illustration (generic UI copy, not real data). */
    illustration: z.object({
      overview: z.object({
        title: text(24),
        period: text(16),
        metricLabel: text(24),
        metricValue: text(12),
        delta: text(12),
        days: z.array(text(4)).length(7),
      }),
      uptime: z.object({ label: text(16), value: text(8) }),
      activity: z.object({
        title: text(24),
        items: z.array(z.object({ label: text(32), time: text(8) })).min(1).max(3),
      }),
      toggle: z.object({ label: text(24), state: text(8) }),
      security: z.object({ label: text(24), detail: text(32) }),
    }),
  }),
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
