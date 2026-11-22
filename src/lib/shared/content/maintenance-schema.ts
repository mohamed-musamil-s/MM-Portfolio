import { z } from "zod";
import { ICON_NAMES } from "@/components/ui/magic-icon/types";

/**
 * Content model for /maintenance (docs/screens/MAINTENANCE_BUSINESS.md §3).
 * Shared by the server (validates what is read from MongoDB and what the
 * admin API accepts) and, later, the admin form in the browser.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

const IMAGE_PATH = /^\/images\/[\w\-/]+\.(png|jpe?g|webp|avif|svg)$/;

const imageSchema = z.object({
  src: z.string().regex(IMAGE_PATH, "Must be a /images/... path to a png, jpg, webp, avif or svg file"),
  /** Empty string marks the image as decorative. */
  alt: z.string().trim().max(200),
});

const wordList = z.array(text(24)).min(1).max(5);

const timelineSchema = z
  .object({
    label: text(40),
    windowStart: z.coerce.date(),
    targetAt: z.coerce.date(),
    countdownLabel: text(24),
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
  brand: z.object({ label: text(40), wordmark: text(24), established: text(24) }),
  status: z.object({ kicker: text(120), label: text(60) }),
  headline: z.object({ lines: z.array(text(40)).min(1).max(3) }),
  body: text(600),
  pillars: z
    .array(z.object({ index: text(4), title: text(40), description: text(160), icon: z.enum(ICON_NAMES) }))
    .min(1)
    .max(4),
  timeline: timelineSchema,
  mottos: z.object({ primary: wordList, secondary: wordList }),
  stamp: z.object({ lines: z.array(text(24)).min(1).max(3) }),
  images: z.object({ portrait: imageSchema, gridPlate: imageSchema, stamp: imageSchema }),
  footer: z.object({ note: text(80) }),
});

export type MaintenanceContent = z.infer<typeof maintenanceContentSchema>;
