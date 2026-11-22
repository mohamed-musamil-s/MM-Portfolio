import { destroyCurrentSession } from "@/lib/server/auth/session";
import { isSameOrigin } from "@/lib/server/http/request";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";
import { ROUTES } from "@/lib/shared/routes";

export const POST = withApi(async (request, { log }) => {
  if (!isSameOrigin(request)) {
    log.warn("logout rejected: cross-origin request");
    return fail(HTTP_STATUS.forbidden, "forbidden", "Cross-origin request rejected.");
  }

  await destroyCurrentSession();
  return ok({ redirectTo: ROUTES.studio.login });
});
