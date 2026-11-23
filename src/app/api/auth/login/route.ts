import { verifyAdminCredentials } from "@/lib/server/auth/credentials";
import { clearLoginChallenge, hasValidLoginChallenge } from "@/lib/server/auth/login-challenge";
import { clearFailedLogins, getLockStatus, recordFailedLogin } from "@/lib/server/auth/rate-limit";
import { createSession } from "@/lib/server/auth/session";
import { getClientIp } from "@/lib/server/http/request";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";
import { loginSchema } from "@/lib/shared/auth/login-input";
import { ROUTES } from "@/lib/shared/routes";

export const POST = withApi(async (request, { log }) => {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail(HTTP_STATUS.badRequest, "invalid_input", "Email and access code are required.");
  }
  const input = parsed.data;

  // Step 2 is only reachable through step 1 (/api/auth/initiate-login) for this same email.
  if (!(await hasValidLoginChallenge(input.email))) {
    log.warn("login rejected: missing or expired login challenge");
    return fail(HTTP_STATUS.badRequest, "challenge_expired", "Your sign-in session expired. Enter your email again.");
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
  await clearLoginChallenge();
  await createSession({
    email: input.email.trim().toLowerCase(),
    ip,
    userAgent: request.headers.get("user-agent") ?? "unknown",
  });
  log.info({ ip }, "login succeeded");

  return ok({ redirectTo: ROUTES.studio.dashboard });
});
