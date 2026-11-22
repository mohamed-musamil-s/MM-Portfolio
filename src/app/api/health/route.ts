import { pingDatabase } from "@/lib/server/db/mongodb";
import { ok, serverError } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";

/** Liveness + MongoDB reachability. 200 when the database answers a ping, 500 otherwise. */
export const GET = withApi(async (_request, { requestId, log }) => {
  try {
    const latencyMs = await pingDatabase();
    return ok({ status: "ok", database: "up", latencyMs });
  } catch (err) {
    log.error({ err }, "health check: database unreachable");
    return serverError(requestId);
  }
});
