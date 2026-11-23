import type { NextRequest } from "next/server";
import type { Logger } from "pino";
import { getCurrentSession, type StudioSession } from "../auth/session";
import { getLogger } from "../logger";
import { UNSAFE_METHODS } from "./origin";
import { REQUEST_ID_HEADER, getRequestId, isSameOrigin } from "./request";
import { HTTP_STATUS, fail, serverError } from "./responses";

const baseLog = getLogger("api");

/** Largest JSON body any endpoint accepts (screen content is a few KB). */
export const MAX_BODY_BYTES = 256 * 1024;

export type ApiContext = {
  requestId: string;
  log: Logger;
};

export type StudioApiContext = ApiContext & { session: StudioSession };

type ApiHandler<Route, Context> = (request: NextRequest, context: Context, route: Route) => Promise<Response>;

/**
 * Checks every write request before the handler runs:
 * same origin (403), JSON body (415) and body size (413).
 */
const rejectUnsafeWrite = (request: NextRequest, log: Logger): Response | null => {
  if (!UNSAFE_METHODS.has(request.method)) {
    return null;
  }
  if (!isSameOrigin(request)) {
    log.warn("rejected: cross-origin write");
    return fail(HTTP_STATUS.forbidden, "forbidden", "Cross-origin request rejected.");
  }
  const length = Number(request.headers.get("content-length") ?? "0");
  const hasBody = request.body !== null && length !== 0;
  if (!hasBody) {
    return null;
  }
  if (length > MAX_BODY_BYTES) {
    return fail(HTTP_STATUS.payloadTooLarge, "payload_too_large", "Request body is too large.");
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return fail(HTTP_STATUS.unsupportedMediaType, "unsupported_media_type", "Send JSON (application/json).");
  }
  return null;
};

/**
 * Wraps every route handler:
 * - assigns a request id and logs the request and the response (status + duration);
 * - refuses cross-origin, non-JSON and oversized writes before the handler runs;
 * - turns any thrown error into a logged 500 that leaks nothing;
 * - marks every API response `Cache-Control: no-store` unless the handler set one.
 * `Route` is Next's second handler argument (e.g. RouteContext<"/api/x/[id]">).
 */
export const withApi =
  <Route = unknown>(handler: ApiHandler<Route, ApiContext>) =>
  async (request: NextRequest, route: Route): Promise<Response> => {
    const requestId = getRequestId(request);
    const log = baseLog.child({ requestId });
    const startedAt = performance.now();
    const { method } = request;
    const path = request.nextUrl.pathname;

    log.info({ method, path }, "api request");

    let response: Response;
    try {
      response = rejectUnsafeWrite(request, log) ?? (await handler(request, { requestId, log }, route));
    } catch (err) {
      log.error({ err, method, path }, "api handler threw");
      response = serverError(requestId);
    }

    response.headers.set(REQUEST_ID_HEADER, requestId);
    if (!response.headers.has("Cache-Control")) {
      response.headers.set("Cache-Control", "no-store");
    }
    const durationMs = Math.round(performance.now() - startedAt);
    const level = response.status >= 500 ? "error" : response.status >= 400 ? "warn" : "info";
    log[level]({ method, path, status: response.status, durationMs }, "api response");

    return response;
  };

/**
 * `withApi` for studio (admin) endpoints: the request must carry a valid
 * admin session (checked against MongoDB), else 401. The handler receives it.
 */
export const withStudioApi = <Route = unknown>(handler: ApiHandler<Route, StudioApiContext>) =>
  withApi<Route>(async (request, context, route) => {
    const session = await getCurrentSession();
    if (!session) {
      context.log.warn("rejected: no studio session");
      return fail(HTTP_STATUS.unauthorized, "unauthorized", "Sign in to the studio first.");
    }
    return handler(request, { ...context, session }, route);
  });
