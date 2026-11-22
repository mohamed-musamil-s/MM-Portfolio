import { z } from "zod";

/**
 * Content model for /maintenance (docs/screens/MAINTENANCE_BUSINESS.md §3).
 * Shared by the server (validates what is read from MongoDB and what the
 * admin API accepts) and, later, the admin form in the browser.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

const timelineSchema = z
  .object({
    /** Short label over the countdown, e.g. "ETA". */
    label: text(24),
    windowStart: z.coerce.date(),
    targetAt: z.coerce.date(),
    /** Screen-reader announcement, updated once a minute. Placeholders: {days} {hours} {minutes}. */
    srRemaining: text(120),
    units: z.object({ days: text(4), hours: text(4), minutes: text(4), seconds: text(4) }),
    overdue: z.object({ title: text(40), detail: text(80) }),
  })
  .refine((timeline) => timeline.targetAt > timeline.windowStart, {
    message: "targetAt must be after windowStart",
    path: ["targetAt"],
  });

export const maintenanceContentSchema = z.object({
  meta: z.object({ title: text(70), description: text(160) }),
  brand: z.object({ label: text(40), wordmark: text(24) }),
  /** Kept short on purpose: one small line above the headline. */
  status: z.object({ kicker: text(40), label: text(40) }),
  headline: z.object({ lines: z.array(text(40)).min(1).max(3) }),
  body: text(200),
  timeline: timelineSchema,
  /** Live check: footer labels, the "Check again" button label and the hint beside it. */
  liveCheck: z.object({
    lastCheckedLabel: text(24),
    nextCheckLabel: text(24),
    checkAgainLabel: text(24),
    hint: text(120),
  }),
  footer: z.object({ note: text(80) }),
});

export type MaintenanceContent = z.infer<typeof maintenanceContentSchema>;
