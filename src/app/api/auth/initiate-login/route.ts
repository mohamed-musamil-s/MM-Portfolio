import { issueLoginChallenge } from "@/lib/server/auth/login-challenge";
import { getLockStatus } from "@/lib/server/auth/rate-limit";
import { getClientIp } from "@/lib/server/http/request";
import { HTTP_STATUS, fail, ok } from "@/lib/server/http/responses";
import { withApi } from "@/lib/server/http/with-api";
import { initiateLoginSchema } from "@/lib/shared/auth/login-input";

/**
 * Step 1 of the studio login: accepts a well-formed email and issues the login
 * challenge cookie. It answers the same way for every email, so it can't be
 * used to discover the admin address; the check happens at step 2.
 *
 *   200 challenge issued · 400 invalid email · 403 cross-origin · 429 locked out
 */
export const POST = withApi(async (request, { log }) => {
  const input = initiateLoginSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return fail(HTTP_STATUS.badRequest, "invalid_input", "A valid email address is required.");
  }

  const ip = getClientIp(request);
  const lock = await getLockStatus(ip);
  if (lock.locked) {
    log.warn({ ip }, "initiate-login blocked: locked out");
    return fail(HTTP_STATUS.tooManyRequests, "locked", "Too many failed attempts. Try again later.", {
      headers: { "Retry-After": String(lock.retryAfterSeconds) },
    });
  }

  await issueLoginChallenge(input.data.email);
  log.info({ ip }, "login challenge issued");
  return ok({ step: "access-code" as const });
});
