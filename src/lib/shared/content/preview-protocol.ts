import { z } from "zod";

/**
 * Messages between Content Forge (parent window) and the live preview frame
 * (/preview/<slug>). Both sides are same-origin; each side still checks the
 * origin and validates the shape before acting.
 */

/** Portfolio screens that render as a page (the shared record has no page of its own). */
export const PREVIEWABLE_SCREENS = ["home", "splash", "maintenance", "not-found"] as const;
export type PreviewableScreen = (typeof PREVIEWABLE_SCREENS)[number];

/** Pages that read the shared record: its preview shows these. */
export const SHARED_CONSUMERS = ["maintenance", "not-found"] as const satisfies readonly PreviewableScreen[];

export const isPreviewableScreen = (value: string): value is PreviewableScreen =>
  (PREVIEWABLE_SCREENS as readonly string[]).includes(value);

/** Editor → frame. */
export const toPreviewSchema = z.discriminatedUnion("type", [
  /** Current drafts (unsaved edits included) for the screen and the shared record. */
  z.object({ source: z.literal("content-forge"), type: z.literal("draft"), content: z.unknown(), shared: z.unknown() }),
  /** Texts of the field being edited, to outline where they appear. Empty clears. */
  z.object({
    source: z.literal("content-forge"),
    type: z.literal("focus"),
    texts: z.array(z.string()),
    /** The section the field belongs to (`data-cf-section` on the page); null searches the whole page. */
    scope: z.string().nullable().optional(),
    /**
     * The other values of each list item the field sits in, nearest item first: they tell
     * repeated values apart and stand in when the field itself isn't shown (a collapsed role).
     */
    context: z.array(z.array(z.string())).optional(),
  }),
  /** The home section being edited, to bring it into view (null: the top). */
  z.object({ source: z.literal("content-forge"), type: z.literal("section"), section: z.string().nullable() }),
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
