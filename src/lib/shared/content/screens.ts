import type { z } from "zod";
import { maintenanceContentSchema } from "./maintenance-schema";

/**
 * Registry of database-managed screens. Adding a configurable screen means
 * adding its schema here; the reader, the admin API and the seed pick it up.
 */
export const SCREEN_SCHEMAS = {
  maintenance: maintenanceContentSchema,
} as const;

export type ScreenSlug = keyof typeof SCREEN_SCHEMAS;

export type ScreenContent<S extends ScreenSlug> = z.infer<(typeof SCREEN_SCHEMAS)[S]>;

export const isScreenSlug = (value: string): value is ScreenSlug => Object.hasOwn(SCREEN_SCHEMAS, value);
