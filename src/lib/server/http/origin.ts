import type { NextRequest } from "next/server";

/**
 * Origin policy for /api (docs/auth-security.md "API security").
 *
 * - The site's own origin can call everything.
 * - Origins listed in CORS_ALLOWED_ORIGINS (comma-separated, optional) may
 *   READ public GET endpoints cross-origin. Nothing else is ever exposed.
 * - Cross-origin writes (POST/PUT/PATCH/DELETE) are always refused.
 */

export const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const listedOrigins = (): string[] =>
  (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

const hostOf = (origin: string): string | null => {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
};

/**
 * True when the request comes from another site. Uses `Origin` when the
 * browser sends it, else `Sec-Fetch-Site`. Requests with neither (curl,
 * server-to-server) are not browser cross-site requests.
 */
export const isCrossOrigin = (request: NextRequest): boolean => {
  const origin = request.headers.get("origin");
  if (origin) {
    return hostOf(origin) !== request.nextUrl.host;
  }
  return request.headers.get("sec-fetch-site") === "cross-site";
};

/** A cross-origin caller allowed to read public GET endpoints. */
export const listedOrigin = (request: NextRequest): string | null => {
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  return origin && listedOrigins().includes(origin) ? origin : null;
};

export const corsHeaders = (origin: string): Record<string, string> => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "600",
  Vary: "Origin",
});
