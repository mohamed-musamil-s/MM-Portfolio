import { LOGIN_ERROR_CODES, type LoginErrorCode } from "@/lib/shared/auth/login-input";

export type LoginApiResult = { ok: true } | { ok: false; code: LoginErrorCode | "network"; retryAfterSeconds?: number };

type ApiEnvelope = { ok: true } | { ok: false; error: { code: string } };

const isLoginErrorCode = (value: string): value is LoginErrorCode =>
  (LOGIN_ERROR_CODES as readonly string[]).includes(value);

/** POSTs JSON to a login endpoint and normalises every outcome to a small result union. */
export const postLogin = async (url: string, body: Record<string, string>): Promise<LoginApiResult> => {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, code: "network" };
  }

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope | null;
  if (envelope?.ok) {
    return { ok: true };
  }
  const code =
    envelope && !envelope.ok && isLoginErrorCode(envelope.error.code) ? envelope.error.code : "internal_error";
  const retryAfter = Number(response.headers.get("retry-after"));
  return { ok: false, code, retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined };
};
