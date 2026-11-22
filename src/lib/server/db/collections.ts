import type { Collection, Db, ObjectId } from "mongodb";

export const COLLECTIONS = {
  sessions: "sessions",
  authAttempts: "auth_attempts",
} as const;

export type SessionDocument = {
  _id?: ObjectId;
  /** SHA-256 of the opaque session token. The raw token only lives in the cookie. */
  tokenHash: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  ip: string;
  userAgent: string;
};

export type AuthAttemptDocument = {
  /** `ip:<address>` or `global`. */
  _id: string;
  count: number;
  firstAt: Date;
  lockedUntil?: Date;
  expiresAt: Date;
};

export const sessionsCollection = (db: Db): Collection<SessionDocument> =>
  db.collection<SessionDocument>(COLLECTIONS.sessions);

export const authAttemptsCollection = (db: Db): Collection<AuthAttemptDocument> =>
  db.collection<AuthAttemptDocument>(COLLECTIONS.authAttempts);
