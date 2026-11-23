import { z } from "zod";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withStudioApi } from "@/lib/server/http/with-api";
import { getMaintenanceSetting, setMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";

/**
 * Admin switch for maintenance mode (Content Forge's Site mode card).
 *   GET  -> { enabled, updatedAt, updatedBy }
 *   PUT  <- { enabled: boolean }
 * Both need an admin session (401); PUT is same-origin JSON only (withApi).
 */

const putBody = z.object({ enabled: z.boolean() });

export const GET = withStudioApi(async () => ok(await getMaintenanceSetting()));

export const PUT = withStudioApi(async (request, { session }) => {
  const body = putBody.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return fail(HTTP_STATUS.badRequest, "invalid_input", "Expected { enabled: boolean }.");
  }
  await setMaintenanceEnabled(body.data.enabled, session.email);
  return ok({ enabled: body.data.enabled });
});
