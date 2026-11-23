import type { z } from "zod";
import { maintenanceContentSchema, type MaintenanceContent } from "./maintenance-schema";
import { notFoundContentSchema, type NotFoundContent } from "./not-found-schema";
import { studioLoginContentSchema, type StudioLoginContent } from "./studio-login-schema";
import { studioShellContentSchema, type StudioShellContent } from "./studio-shell-schema";

/** Content type of every database-managed screen, by slug (`site_screens._id`). */
type ScreenContentMap = {
  maintenance: MaintenanceContent;
  "not-found": NotFoundContent;
  "studio-login": StudioLoginContent;
  "studio-shell": StudioShellContent;
};

export type ScreenSlug = keyof ScreenContentMap;

export type ScreenContent<S extends ScreenSlug> = ScreenContentMap[S];

/**
 * Registry of database-managed screens. Adding a configurable screen means
 * adding its schema here (and its type above); the reader, the admin API and
 * the seed pick it up. The mapped type keeps `SCREEN_SCHEMAS[slug]` precise
 * for a generic slug.
 */
export const SCREEN_SCHEMAS: { [S in ScreenSlug]: z.ZodType<ScreenContentMap[S]> } = {
  maintenance: maintenanceContentSchema,
  "not-found": notFoundContentSchema,
  "studio-login": studioLoginContentSchema,
  "studio-shell": studioShellContentSchema,
};

/**
 * Screens of the public portfolio site: the only ones Content Forge edits.
 * Studio screens (login, shell) stay in the database but are not listed there.
 */
export const PORTFOLIO_SCREENS = ["maintenance", "not-found"] as const satisfies readonly ScreenSlug[];

export const isScreenSlug = (value: string): value is ScreenSlug => Object.hasOwn(SCREEN_SCHEMAS, value);
