import { verifyAdminCredentials } from "@/lib/server/auth/credentials";
import { clearFailedLogins, getLockStatus, recordFailedLogin } from "@/lib/server/auth/rate-limit";
import { createSession } from "@/lib/server/auth/session";
import { getClientIp, isSameOrigin } from "@/lib/server/http/request";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";
import { ROUTES } from "@/lib/shared/routes";

const MAX_EMAIL_LENGTH = 254;
const MAX_CODE_LENGTH = 64;

type LoginInput = { email: string; accessCode: string };

const parseLoginInput = (body: unknown): LoginInput | null => {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const { email, accessCode } = body as Record<string, unknown>;
  if (typeof email !== "string" || typeof accessCode !== "string") {
    return null;
  }
  if (!email.trim() || !accessCode.trim() || email.length > MAX_EMAIL_LENGTH || accessCode.length > MAX_CODE_LENGTH) {
    return null;
  }
  return { email, accessCode };
};

export const POST = withApi(async (request, { log }) => {
  if (!isSameOrigin(request)) {
    log.warn("login rejected: cross-origin request");
    return fail(HTTP_STATUS.forbidden, "forbidden", "Cross-origin request rejected.");
  }

  const input = parseLoginInput(await request.json().catch(() => null));
  if (!input) {
    return fail(HTTP_STATUS.badRequest, "invalid_input", "Email and access code are required.");
  }

  const ip = getClientIp(request);
  const lock = await getLockStatus(ip);
  if (lock.locked) {
    log.warn({ ip }, "login blocked: locked out");
    return fail(HTTP_STATUS.tooManyRequests, "locked", "Too many failed attempts. Try again later.", {
      headers: { "Retry-After": String(lock.retryAfterSeconds) },
    });
  }

  if (!verifyAdminCredentials(input.email, input.accessCode)) {
    await recordFailedLogin(ip);
    log.warn({ ip }, "login failed: invalid credentials");
    return fail(HTTP_STATUS.unauthorized, "invalid_credentials", "Invalid email or access code.");
  }

  await clearFailedLogins(ip);
  await createSession({
    email: input.email.trim().toLowerCase(),
    ip,
    userAgent: request.headers.get("user-agent") ?? "unknown",
  });
  log.info({ ip }, "login succeeded");

  return ok({ redirectTo: ROUTES.studio.dashboard });
});
