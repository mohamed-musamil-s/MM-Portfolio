import { z } from "zod";
import { saveScreenContent } from "@/lib/server/content/screens";
import { readVersionForRestore } from "@/lib/server/content/versions";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withStudioApi } from "@/lib/server/http/with-api";
import { SCREEN_SCHEMAS, isScreenSlug } from "@/lib/shared/content/screens";

/**
 * Restores an old version of a screen (Launchpad). The old content is saved
 * as a new version, so the history keeps everything.
 *   POST /api/studio/screens/:slug/versions/:version <- { expectedVersion } -> { version }
 * Admin session, same-origin JSON. 409 when the screen changed meanwhile;
 * 422 when the old version no longer fits today's content model.
 */

type Route = RouteContext<"/api/studio/screens/[slug]/versions/[version]">;

const body = z.object({ expectedVersion: z.number().int().positive() });

export const POST = withStudioApi<Route>(async (request, { log, session }, route) => {
  const { slug, version: raw } = await route.params;
  const version = Number.parseInt(raw, 10);
  if (!isScreenSlug(slug) || !Number.isInteger(version) || version < 1) {
    return fail(HTTP_STATUS.notFound, "unknown_version", "No such version.");
  }
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail(HTTP_STATUS.badRequest, "invalid_input", "Expected { expectedVersion }.");
  }

  const stored = await readVersionForRestore(slug, version);
  if (!stored.ok) {
    return stored.reason === "missing"
      ? fail(HTTP_STATUS.notFound, "unknown_version", "No such version.")
      : fail(HTTP_STATUS.unprocessable, "incompatible_version", "That version no longer fits the current content model.");
  }
  const content = SCREEN_SCHEMAS[slug].parse(stored.content);
  const result = await saveScreenContent(slug, content, parsed.data.expectedVersion, session.email);
  if (!result.ok) {
    return result.reason === "conflict"
      ? fail(HTTP_STATUS.conflict, "version_conflict", "Content changed since you loaded it. Reload and retry.")
      : fail(HTTP_STATUS.notFound, "content_missing", "Screen content does not exist yet.");
  }
  log.info({ slug, restored: version, as: result.version }, "screen version restored");
  return ok({ version: result.version });
});
