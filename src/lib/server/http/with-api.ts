import type { NextRequest } from "next/server";
import type { Logger } from "pino";
import { getLogger } from "../logger";
import { REQUEST_ID_HEADER, getRequestId } from "./request";
import { serverError } from "./responses";

const baseLog = getLogger("api");

export type ApiContext = {
  requestId: string;
  log: Logger;
};

type ApiHandler = (request: NextRequest, context: ApiContext) => Promise<Response>;

/**
 * Wraps every route handler: assigns a request id, logs the request and the
 * response (status + duration), and turns any thrown error into a logged 500.
 */
export const withApi =
  (handler: ApiHandler) =>
  async (request: NextRequest): Promise<Response> => {
    const requestId = getRequestId(request);
    const log = baseLog.child({ requestId });
    const startedAt = performance.now();
    const { method } = request;
    const path = request.nextUrl.pathname;

    log.info({ method, path }, "api request");

    let response: Response;
    try {
      response = await handler(request, { requestId, log });
    } catch (err) {
      log.error({ err, method, path }, "api handler threw");
      response = serverError(requestId);
    }

    response.headers.set(REQUEST_ID_HEADER, requestId);
    const durationMs = Math.round(performance.now() - startedAt);
    const level = response.status >= 500 ? "error" : response.status >= 400 ? "warn" : "info";
    log[level]({ method, path, status: response.status, durationMs }, "api response");

    return response;
  };
