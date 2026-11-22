import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "../db/mongodb";
import { sessionsCollection } from "../db/collections";
import { getLogger } from "../logger";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
  signSessionToken,
  verifySessionToken,
} from "./session-token";

const log = getLogger("auth");

export type StudioSession = {
  email: string;
  expiresAt: Date;
};

const hashSessionId = (sid: string): string => createHash("sha256").update(sid).digest("hex");

type CreateSessionInput = {
  email: string;
  ip: string;
  userAgent: string;
};

/** Persists a new session in MongoDB and sets the session cookie. */
export const createSession = async ({ email, ip, userAgent }: CreateSessionInput): Promise<void> => {
  const sid = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

  const db = await getDb();
  await sessionsCollection(db).insertOne({
    tokenHash: hashSessionId(sid),
    email,
    createdAt: now,
    expiresAt,
    ip,
    userAgent: userAgent.slice(0, 512),
  });

  const token = await signSessionToken(sid, expiresAt);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

  log.info({ ip, expiresAt }, "session created");
};

/**
 * Authoritative session check: valid signature AND a live row in MongoDB.
 * Memoized per request so several callers share one lookup.
 */
export const getCurrentSession = cache(async (): Promise<StudioSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    log.info("session cookie rejected (invalid or expired signature)");
    return null;
  }

  const db = await getDb();
  const session = await sessionsCollection(db).findOne(
    { tokenHash: hashSessionId(payload.sid), expiresAt: { $gt: new Date() } },
    { projection: { email: 1, expiresAt: 1 } },
  );

  if (!session) {
    log.info("session not found in database (revoked or expired)");
    return null;
  }

  return { email: session.email, expiresAt: session.expiresAt };
});

/** Deletes the session row (revocation) and clears the cookie. */
export const destroyCurrentSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  cookieStore.delete(SESSION_COOKIE);

  if (!token) {
    return;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return;
  }

  const db = await getDb();
  const { deletedCount } = await sessionsCollection(db).deleteOne({ tokenHash: hashSessionId(payload.sid) });
  log.info({ revoked: deletedCount === 1 }, "session destroyed");
};
