import { HTTP_STATUS, fail, found } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";
import { ROUTES } from "@/lib/shared/routes";

/**
 * Catch-all for paths that match no page or API route. Real routes always win
 * over this dynamic segment, so only unknown URLs land here.
 * Pages: 302 to /404. API: JSON 404 (redirecting an API client is unhelpful).
 */
const handleUnknownRoute = withApi(async (request) => {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return fail(HTTP_STATUS.notFound, "not_found", "No such API route.");
  }
  return found(ROUTES.notFound, request.url);
});

export const GET = handleUnknownRoute;
export const HEAD = handleUnknownRoute;
export const POST = handleUnknownRoute;
export const PUT = handleUnknownRoute;
export const PATCH = handleUnknownRoute;
export const DELETE = handleUnknownRoute;
