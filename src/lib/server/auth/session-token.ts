import { jwtVerify, SignJWT } from "jose";
import { env } from "../env";

/**
 * Signed session cookie (HS256 JWT) that wraps an opaque session id.
 *
 * The signature lets the proxy reject forged or expired cookies without a
 * database round trip. It is NOT the source of truth: the session must also
 * exist in MongoDB (see session.ts), which is what makes logout/revocation work.
 *
 * This module deliberately avoids `server-only` and Node-only DB imports so it
 * can be used from `src/proxy.ts`.
 */

export const SESSION_COOKIE = "mm_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

const ISSUER = "mm-portfolio";
const AUDIENCE = "mm-portfolio:studio";

const signingKey = (): Uint8Array => new TextEncoder().encode(env.sessionSecret());

export type SessionTokenPayload = {
  sid: string;
  exp: number;
};

export const signSessionToken = async (sid: string, expiresAt: Date): Promise<string> =>
  new SignJWT({ sid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(signingKey());

/** Returns null for any invalid, tampered or expired token. Throws only on misconfiguration. */
export const verifySessionToken = async (token: string): Promise<SessionTokenPayload | null> => {
  const key = signingKey();
  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (typeof payload.sid !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    return { sid: payload.sid, exp: payload.exp };
  } catch {
    return null;
  }
};

export const sessionCookieOptions = (expiresAt: Date) =>
  ({
    httpOnly: true,
    // Browsers drop Secure cookies on plain http (except some localhost cases),
    // so only relax this in `next dev`. Production builds always set Secure.
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  }) as const;
