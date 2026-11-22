import { NextResponse } from "next/server";

/**
 * Standard API envelope. Every JSON response from /api uses one of these two
 * shapes so the client can branch on `ok` without inspecting status codes.
 */
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string; requestId?: string } };
export type ApiBody<T> = ApiSuccess<T> | ApiFailure;

export const HTTP_STATUS = {
  ok: 200,
  found: 302,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  tooManyRequests: 429,
  internalServerError: 500,
} as const;

/** 200 OK */
export const ok = <T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> =>
  NextResponse.json({ ok: true, data }, { ...init, status: HTTP_STATUS.ok });

/** 302 Found. `NextResponse.redirect` defaults to 307, so the status is explicit. */
export const found = (location: string | URL, base?: string | URL): NextResponse =>
  NextResponse.redirect(new URL(location, base), HTTP_STATUS.found);

/** 4xx client error with a stable machine-readable code. */
export const fail = (
  status: Exclude<(typeof HTTP_STATUS)[keyof typeof HTTP_STATUS], 200 | 302 | 500>,
  code: string,
  message: string,
  init?: ResponseInit,
): NextResponse<ApiFailure> => NextResponse.json({ ok: false, error: { code, message } }, { ...init, status });

/** 500 Internal Server Error. Never leaks internals; the requestId ties it to the server log. */
export const serverError = (requestId?: string): NextResponse<ApiFailure> =>
  NextResponse.json(
    { ok: false, error: { code: "internal_error", message: "Internal Server Error", requestId } },
    { status: HTTP_STATUS.internalServerError },
  );
