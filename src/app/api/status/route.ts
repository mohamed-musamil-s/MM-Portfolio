import { ok } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";
import { isMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";

/** Public live check used by /maintenance every minute: is the site still in maintenance? Never cached. */
export const GET = withApi(async () =>
  ok(
    { maintenance: await isMaintenanceEnabled({ fresh: true }), checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  ),
);
