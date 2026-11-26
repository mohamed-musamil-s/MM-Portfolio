import { getScreenRecord, ScreenContentError } from "@/lib/server/content/screens";
import { listVersions } from "@/lib/server/content/versions";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withStudioApi } from "@/lib/server/http/with-api";
import { isScreenSlug } from "@/lib/shared/content/screens";

/**
 * Version history of a screen (Launchpad, docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md).
 *   GET /api/studio/screens/:slug/versions -> { current, versions: [{ version, savedAt, savedBy, changed }] }
 * Admin session required.
 */

type Route = RouteContext<"/api/studio/screens/[slug]/versions">;

export const GET = withStudioApi<Route>(async (_request, _api, route) => {
  const { slug } = await route.params;
  if (!isScreenSlug(slug)) {
    return fail(HTTP_STATUS.notFound, "unknown_screen", "No such screen.");
  }
  try {
    const record = await getScreenRecord(slug);
    return ok({ current: record.version, versions: await listVersions(slug, record.content) });
  } catch (error) {
    if (error instanceof ScreenContentError) {
      return fail(HTTP_STATUS.notFound, "content_missing_or_invalid", error.message);
    }
    throw error;
  }
});
