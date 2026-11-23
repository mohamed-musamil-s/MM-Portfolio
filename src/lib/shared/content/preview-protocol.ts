import { z } from "zod";

/**
 * Messages between Content Forge (parent window) and the live preview frame
 * (/preview/<slug>). Both sides are same-origin; each side still checks the
 * origin and validates the shape before acting.
 */

/** Portfolio screens that render as a page (the shared record has no page of its own). */
export const PREVIEWABLE_SCREENS = ["maintenance", "not-found"] as const;
export type PreviewableScreen = (typeof PREVIEWABLE_SCREENS)[number];

export const isPreviewableScreen = (value: string): value is PreviewableScreen =>
  (PREVIEWABLE_SCREENS as readonly string[]).includes(value);

/** Editor → frame. */
export const toPreviewSchema = z.discriminatedUnion("type", [
  /** Current drafts (unsaved edits included) for the screen and the shared record. */
  z.object({ source: z.literal("content-forge"), type: z.literal("draft"), content: z.unknown(), shared: z.unknown() }),
  /** Texts of the field being edited, to outline where they appear. Empty clears. */
  z.object({ source: z.literal("content-forge"), type: z.literal("focus"), texts: z.array(z.string()) }),
]);
export type ToPreviewMessage = z.infer<typeof toPreviewSchema>;

/** Frame → editor. */
export const fromPreviewSchema = z.discriminatedUnion("type", [
  z.object({ source: z.literal("content-forge-preview"), type: z.literal("ready") }),
  /** `valid`: the draft passed validation and is shown. `matches`: outlined places for the focused field. */
  z.object({
    source: z.literal("content-forge-preview"),
    type: z.literal("status"),
    valid: z.boolean(),
    matches: z.number().int().min(0),
  }),
]);
export type FromPreviewMessage = z.infer<typeof fromPreviewSchema>;
