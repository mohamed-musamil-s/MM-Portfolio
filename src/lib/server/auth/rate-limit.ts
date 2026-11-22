import "server-only";
import { getDb } from "../db/mongodb";
import { authAttemptsCollection } from "../db/collections";
import { getLogger } from "../logger";

/**
 * Brute-force protection for the 4-digit access code, stored in MongoDB so it
 * survives restarts and works across instances.
 *
 * - Per IP: 5 failures within 15 minutes locks that IP for 15 minutes.
 * - Global: 20 failures within 15 minutes locks login for everyone for 15
 *   minutes. This caps distributed guessing (10,000 possible codes) at the cost
 *   of a possible temporary lockout for the admin.
 */

const log = getLogger("auth");

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IP = 5;
const MAX_FAILURES_GLOBAL = 20;
const GLOBAL_KEY = "global";

const ipKey = (ip: string): string => `ip:${ip}`;

const limits = (ip: string) => [
  { key: ipKey(ip), max: MAX_FAILURES_PER_IP },
  { key: GLOBAL_KEY, max: MAX_FAILURES_GLOBAL },
];

export type LockStatus = { locked: false } | { locked: true; retryAfterSeconds: number };

export const getLockStatus = async (ip: string): Promise<LockStatus> => {
  const db = await getDb();
  const now = new Date();
  const lock = await authAttemptsCollection(db).findOne(
    { _id: { $in: [ipKey(ip), GLOBAL_KEY] }, lockedUntil: { $gt: now } },
    { sort: { lockedUntil: -1 } },
  );

  if (!lock?.lockedUntil) {
    return { locked: false };
  }
  return { locked: true, retryAfterSeconds: Math.ceil((lock.lockedUntil.getTime() - now.getTime()) / 1000) };
};

export const recordFailedLogin = async (ip: string): Promise<void> => {
  const db = await getDb();
  const attempts = authAttemptsCollection(db);
  const now = new Date();
  const keys = limits(ip);

  // TTL cleanup runs about once a minute, so drop expired windows explicitly.
  await attempts.deleteMany({ _id: { $in: keys.map((k) => k.key) }, expiresAt: { $lte: now } });

  for (const { key, max } of keys) {
    const doc = await attempts.findOneAndUpdate(
      { _id: key },
      { $inc: { count: 1 }, $setOnInsert: { firstAt: now, expiresAt: new Date(now.getTime() + WINDOW_MS) } },
      { upsert: true, returnDocument: "after" },
    );

    if (doc && doc.count >= max && !doc.lockedUntil) {
      const lockedUntil = new Date(now.getTime() + LOCK_MS);
      await attempts.updateOne({ _id: key }, { $set: { lockedUntil, expiresAt: lockedUntil } });
      log.warn({ key: key === GLOBAL_KEY ? "global" : "ip", ip, failures: doc.count, lockedUntil }, "login locked");
    }
  }
};

export const clearFailedLogins = async (ip: string): Promise<void> => {
  const db = await getDb();
  await authAttemptsCollection(db).deleteMany({ _id: { $in: [ipKey(ip), GLOBAL_KEY] } });
};
