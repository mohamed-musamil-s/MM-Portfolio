import { z } from "zod";

/**
 * Content model for the 404 screen (docs/screens/NOT_FOUND_BUSINESS.md §3).
 * Shared by the server reader, the admin API and, later, the admin form.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

export const notFoundContentSchema = z.object({
  meta: z.object({ title: text(70), description: text(160) }),
  /** The large "Error 404" graphic. */
  display: z.object({ label: text(16), code: text(8) }),
  heading: text(40),
  body: text(200),
  action: z.object({ label: text(32) }),
  redirect: z.object({
    seconds: z.number().int().min(3).max(60),
    label: text(32),
    pausedLabel: text(32),
    pauseLabel: text(16),
    resumeLabel: text(16),
    /** Placeholder: {seconds}. */
    srAnnouncement: text(120),
  }),
  footer: z.object({ note: text(80) }),
});

export type NotFoundContent = z.infer<typeof notFoundContentSchema>;
