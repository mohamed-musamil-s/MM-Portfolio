import type { Db } from "mongodb";
import { getLogger } from "../logger";
import { authAttemptsCollection, sessionsCollection } from "./collections";

const log = getLogger("db");

/**
 * Idempotent: createIndex is a no-op when an identical index already exists.
 * Names must match the indexes already present in the Atlas database, because
 * MongoDB rejects the same key + options under a different name
 * (IndexOptionsConflict).
 */
export const ensureIndexes = async (db: Db): Promise<void> => {
  await Promise.all([
    sessionsCollection(db).createIndex({ tokenHash: 1 }, { unique: true, name: "tokenHash_unique" }),
    // TTL: MongoDB removes sessions once expiresAt passes.
    sessionsCollection(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "session_ttl" }),
    authAttemptsCollection(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "attempt_ttl" }),
  ]);
  log.info("mongodb indexes ensured");
};
