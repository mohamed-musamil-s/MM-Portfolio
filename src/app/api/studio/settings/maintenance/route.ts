import { z } from "zod";
import { getCurrentSession } from "@/lib/server/auth/session";
import { isSameOrigin } from "@/lib/server/http/request";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";
import { getMaintenanceSetting, setMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";

/**
 * Admin switch for maintenance mode (backend of the future admin panel; no UI yet).
 *   GET  -> { enabled, updatedAt, updatedBy }
 *   PUT  <- { enabled: boolean }   (session + same-origin)
 */

const unauthorized = () => fail(HTTP_STATUS.unauthorized, "unauthorized", "Sign in to the studio first.");
const putBody = z.object({ enabled: z.boolean() });

export const GET = withApi(async () => {
  if (!(await getCurrentSession())) {
    return unauthorized();
  }
  return ok(await getMaintenanceSetting());
});

export const PUT = withApi(async (request) => {
  if (!isSameOrigin(request)) {
    return fail(HTTP_STATUS.forbidden, "forbidden", "Cross-origin request rejected.");
  }
  const session = await getCurrentSession();
  if (!session) {
    return unauthorized();
  }
  const body = putBody.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return fail(HTTP_STATUS.badRequest, "invalid_input", "Expected { enabled: boolean }.");
  }
  await setMaintenanceEnabled(body.data.enabled, session.email);
  return ok({ enabled: body.data.enabled });
});
