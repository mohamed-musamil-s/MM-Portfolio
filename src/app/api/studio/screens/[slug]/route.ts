import { z } from "zod";
import { getCurrentSession } from "@/lib/server/auth/session";
import { getScreenRecord, saveScreenContent, ScreenContentError } from "@/lib/server/content/screens";
import { isSameOrigin } from "@/lib/server/http/request";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";
import { SCREEN_SCHEMAS, isScreenSlug } from "@/lib/shared/content/screens";

/**
 * Admin content API for database-managed screens (backend of the future admin panel).
 *   GET /api/studio/screens/:slug  -> { content, version, updatedAt, updatedBy }
 *   PUT /api/studio/screens/:slug  <- { content, version }  (optimistic concurrency)
 * Both require an admin session. PUT also requires a same-origin request.
 */

type Route = RouteContext<"/api/studio/screens/[slug]">;

const unauthorized = () => fail(HTTP_STATUS.unauthorized, "unauthorized", "Sign in to the studio first.");
const unknownScreen = () => fail(HTTP_STATUS.notFound, "unknown_screen", "No such screen.");

const putBody = z.object({ content: z.unknown(), version: z.number().int().positive() });

export const GET = withApi<Route>(async (_request, _api, route) => {
  if (!(await getCurrentSession())) {
    return unauthorized();
  }
  const { slug } = await route.params;
  if (!isScreenSlug(slug)) {
    return unknownScreen();
  }
  try {
    return ok(await getScreenRecord(slug));
  } catch (error) {
    if (error instanceof ScreenContentError) {
      return fail(HTTP_STATUS.notFound, "content_missing_or_invalid", error.message);
    }
    throw error;
  }
});

export const PUT = withApi<Route>(async (request, { log }, route) => {
  if (!isSameOrigin(request)) {
    return fail(HTTP_STATUS.forbidden, "forbidden", "Cross-origin request rejected.");
  }
  const session = await getCurrentSession();
  if (!session) {
    return unauthorized();
  }
  const { slug } = await route.params;
  if (!isScreenSlug(slug)) {
    return unknownScreen();
  }

  const body = putBody.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return fail(HTTP_STATUS.badRequest, "invalid_input", "Expected { content, version }.");
  }
  const content = SCREEN_SCHEMAS[slug].safeParse(body.data.content);
  if (!content.success) {
    return Response.json(
      {
        ok: false,
        error: { code: "invalid_content", message: "Content failed validation.", issues: content.error.issues },
      },
      { status: HTTP_STATUS.badRequest },
    );
  }

  const result = await saveScreenContent(slug, content.data, body.data.version, session.email);
  if (!result.ok) {
    log.warn({ slug, reason: result.reason }, "screen content save rejected");
    return result.reason === "conflict"
      ? fail(HTTP_STATUS.conflict, "version_conflict", "Content changed since you loaded it. Reload and retry.")
      : fail(HTTP_STATUS.notFound, "content_missing", "Screen content does not exist yet. Run the seed.");
  }
  return ok({ version: result.version });
});
