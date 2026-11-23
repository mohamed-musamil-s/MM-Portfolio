import { z } from "zod";

/**
 * Text used on more than one portfolio page, stored once
 * (`site_screens._id: "shared"`). Pages read it next to their own content,
 * so a change here shows everywhere at once.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

export const sharedContentSchema = z.object({
  /** Footer line on the maintenance and 404 pages. */
  footer: z.object({ note: text(80) }),
});

export type SharedContent = z.infer<typeof sharedContentSchema>;
