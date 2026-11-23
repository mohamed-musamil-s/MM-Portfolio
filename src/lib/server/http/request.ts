import type { NextRequest } from "next/server";
import { isCrossOrigin } from "./origin";

export const REQUEST_ID_HEADER = "x-request-id";

export const getRequestId = (request: Request): string => request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();

/**
 * Best-effort client IP. `x-forwarded-for` is only trustworthy behind a proxy
 * that sets it (Vercel, a load balancer, etc.); document this when deploying.
 */
export const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
};

/**
 * CSRF defence for state-changing requests: a browser request must come from
 * the host serving the API (Origin, or Sec-Fetch-Site when Origin is absent).
 * The session cookie is also SameSite=Strict, so this is a second layer.
 */
export const isSameOrigin = (request: NextRequest): boolean => !isCrossOrigin(request);
