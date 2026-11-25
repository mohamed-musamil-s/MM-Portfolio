import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/auth/session-token";
import { getLogger } from "@/lib/server/logger";
import { isMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";
import { UNSAFE_METHODS, corsHeaders, isCrossOrigin, listedOrigin } from "@/lib/server/http/origin";
import { REQUEST_ID_HEADER } from "@/lib/server/http/request";
import { ROUTES, isStudioPath } from "@/lib/shared/routes";

/**
 * Runs before every non-static request (Node.js runtime).
 *
 * 1. Tags the request with an `x-request-id` used by all server logs.
 * 2. Maintenance flag (set from the admin panel, cached ~10s):
 *      OFF: `/maintenance` -> 302 `/`
 *      ON:  `/` is not redirected here: the home page plays the name splash
 *           first and then moves on to `/maintenance` itself.
 * 3. `/studio/**` (except login) requires a validly signed session cookie,
 *    otherwise 302 -> `/studio/login`. This is the optimistic check; pages
 *    re-verify the session against MongoDB via `requireSession()`.
 * 4. `/api/**` CORS gate (lib/server/http/origin.ts): cross-origin preflights
 *    and writes are refused here; listed origins may read public GETs.
 *    Route handlers still check origin, session and input themselves.
 */

const log = getLogger("proxy");

const redirect302 = (request: NextRequest, location: string, requestId: string): NextResponse => {
  const response = NextResponse.redirect(new URL(location, request.url), 302);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
};

const passThrough = (request: NextRequest, requestId: string): NextResponse => {
  const headers = new Headers(request.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
};

const json403 = (requestId: string): NextResponse =>
  NextResponse.json(
    { ok: false, error: { code: "forbidden", message: "Cross-origin request rejected." } },
    { status: 403, headers: { [REQUEST_ID_HEADER]: requestId, "Cache-Control": "no-store" } },
  );

const gateApi = (request: NextRequest, requestId: string): NextResponse => {
  if (!isCrossOrigin(request)) {
    return passThrough(request, requestId);
  }
  const origin = listedOrigin(request);
  if (request.method === "OPTIONS") {
    if (!origin) {
      log.warn({ requestId, path: request.nextUrl.pathname }, "cors preflight rejected");
      return json403(requestId);
    }
    return new NextResponse(null, { status: 204, headers: { ...corsHeaders(origin), [REQUEST_ID_HEADER]: requestId } });
  }
  if (UNSAFE_METHODS.has(request.method)) {
    log.warn({ requestId, path: request.nextUrl.pathname, method: request.method }, "cross-origin write rejected");
    return json403(requestId);
  }
  if (!origin) {
    // No CORS headers: the browser blocks the cross-origin read.
    return passThrough(request, requestId);
  }
  const response = passThrough(request, requestId);
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    response.headers.set(key, value);
  }
  return response;
};

const guardStudio = async (request: NextRequest, requestId: string): Promise<NextResponse> => {
  const { pathname } = request.nextUrl;

  if (pathname === ROUTES.studio.login) {
    return passThrough(request, requestId);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL(ROUTES.studio.login, request.url);
    if (pathname !== ROUTES.studio.root) {
      loginUrl.searchParams.set("next", pathname);
    }
    log.info({ requestId, path: pathname, hadCookie: Boolean(token) }, "studio access denied, redirecting to login");
    const response = redirect302(request, loginUrl.toString(), requestId);
    if (token) {
      response.cookies.delete(SESSION_COOKIE);
    }
    return response;
  }

  if (pathname === ROUTES.studio.root) {
    return redirect302(request, ROUTES.studio.dashboard, requestId);
  }

  return passThrough(request, requestId);
};

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // Always minted here so clients cannot inject their own ids into the logs.
  const requestId = crypto.randomUUID();
  const { pathname } = request.nextUrl;

  try {
    if (pathname === ROUTES.maintenance && !(await isMaintenanceEnabled())) {
      return redirect302(request, ROUTES.home, requestId);
    }
    if (pathname.startsWith("/api/")) {
      return gateApi(request, requestId);
    }
    if (isStudioPath(pathname)) {
      return await guardStudio(request, requestId);
    }
    return passThrough(request, requestId);
  } catch (err) {
    log.error({ err, requestId, path: pathname }, "proxy failed");
    return new NextResponse("Internal Server Error", {
      status: 500,
      headers: { [REQUEST_ID_HEADER]: requestId, "content-type": "text/plain; charset=utf-8" },
    });
  }
}

export const config = {
  // Skip Next internals and files with an extension (static assets).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
