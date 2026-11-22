import type { Instrumentation } from "next";

/**
 * Server lifecycle hooks.
 * - register(): logs startup and opens the MongoDB connection early so
 *   connection failures show up at boot rather than on the first request.
 * - onRequestError(): central sink for every uncaught server exception
 *   (Server Components, route handlers, server actions, proxy).
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { getLogger } = await import("@/lib/server/logger");
  const log = getLogger("server");
  log.info({ env: process.env.NODE_ENV }, "server starting");

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  const { getDb } = await import("@/lib/server/db/mongodb");
  // Failures are already logged inside getDb(); requests will retry.
  getDb().catch(() => undefined);
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { getLogger } = await import("@/lib/server/logger");
  getLogger("server").error(
    {
      err,
      method: request.method,
      path: request.path,
      requestId: request.headers["x-request-id"],
      routePath: context.routePath,
      routeType: context.routeType,
      routerKind: context.routerKind,
    },
    "unhandled server error",
  );
};
