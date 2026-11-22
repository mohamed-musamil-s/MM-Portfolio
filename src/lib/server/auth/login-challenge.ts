import "server-only";
import { createHash } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { env } from "../env";

/**
 * Step 1 of the two-step studio login (docs/auth-security.md §2).
 *
 * After the email step, the server sets a short-lived signed cookie that binds
 * the email (as a SHA-256 hash, never in clear). Step 2 (/api/auth/login) only
 * accepts an access code together with a matching, unexpired challenge, so the
 * code endpoint can't be called without going through step 1 first.
 *
 * The challenge is issued for ANY well-formed email. Whether the email is the
 * admin's is decided only at step 2, together with the code, so the first step
 * never reveals which address is authorised (no account enumeration).
 */

export const LOGIN_CHALLENGE_COOKIE = "mm_login_challenge";
const CHALLENGE_TTL_SECONDS = 10 * 60;
const ISSUER = "mm-portfolio";
const AUDIENCE = "mm-portfolio:login-challenge";
/** Only the login endpoints ever need to see it. */
const COOKIE_PATH = "/api/auth";

const signingKey = (): Uint8Array => new TextEncoder().encode(env.sessionSecret());

const emailHash = (email: string): string => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

export const issueLoginChallenge = async (email: string): Promise<void> => {
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000);
  const token = await new SignJWT({ em: emailHash(email) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(signingKey());

  (await cookies()).set(LOGIN_CHALLENGE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    path: COOKIE_PATH,
    expires: expiresAt,
  });
};

/** True when the request carries a valid, unexpired challenge for exactly this email. */
export const hasValidLoginChallenge = async (email: string): Promise<boolean> => {
  const token = (await cookies()).get(LOGIN_CHALLENGE_COOKIE)?.value;
  if (!token) {
    return false;
  }
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    return payload.em === emailHash(email);
  } catch {
    return false;
  }
};

export const clearLoginChallenge = async (): Promise<void> => {
  (await cookies()).set(LOGIN_CHALLENGE_COOKIE, "", { path: COOKIE_PATH, maxAge: 0 });
};
