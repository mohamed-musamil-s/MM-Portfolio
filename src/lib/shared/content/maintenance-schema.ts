import { z } from "zod";

/**
 * Content model for /maintenance (docs/screens/MAINTENANCE_BUSINESS.md §3).
 * Shared by the server (validates what is read from MongoDB and what the
 * admin API accepts) and, later, the admin form in the browser.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

/** Animated scenes the right-side maintenance illustration can show, in any order. */
export const ILLUSTRATION_SCENES = ["manage", "construct", "content", "redesign", "upgrade"] as const;
export type IllustrationScene = (typeof ILLUSTRATION_SCENES)[number];

const illustrationSchema = z.object({
  steps: z
    .array(z.object({ scene: z.enum(ILLUSTRATION_SCENES), label: text(32) }))
    .min(1)
    .max(5),
  /** Version tags shown in the "upgrade" scene. */
  versionFrom: text(8),
  versionTo: text(8),
});

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
    /** Shown on the button while a check is in flight, e.g. "CHECKING STATUS...". */
    checkingLabel: text(24),
    /** Shown briefly when a check finds maintenance still on, e.g. "STILL UPGRADING". */
    checkedLabel: text(24),
    hint: text(120),
  }),
  illustration: illustrationSchema,
  footer: z.object({ note: text(80) }),
});

export type MaintenanceContent = z.infer<typeof maintenanceContentSchema>;
