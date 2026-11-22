import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/auth/session-token";
import { getLogger } from "@/lib/server/logger";
import { REQUEST_ID_HEADER } from "@/lib/server/http/request";
import { ROUTES, isStudioPath } from "@/lib/shared/routes";

/**
 * Runs before every non-static request (Node.js runtime).
 *
 * 1. Tags the request with an `x-request-id` used by all server logs.
 * 2. `/` -> 302 `/maintenance` while the public portfolio is in development.
 * 3. `/studio/**` (except login) requires a validly signed session cookie,
 *    otherwise 302 -> `/studio/login`. This is the optimistic check; pages
 *    re-verify the session against MongoDB via `requireSession()`.
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
    if (pathname === ROUTES.home) {
      return redirect302(request, ROUTES.maintenance, requestId);
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
