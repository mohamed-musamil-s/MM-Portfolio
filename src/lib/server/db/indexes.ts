import type { Db } from "mongodb";
import { getLogger } from "../logger";
import { authAttemptsCollection, sessionsCollection } from "./collections";

const log = getLogger("db");

/** Idempotent: createIndex is a no-op when the index already exists. */
export const ensureIndexes = async (db: Db): Promise<void> => {
  await Promise.all([
    sessionsCollection(db).createIndex({ tokenHash: 1 }, { unique: true, name: "tokenHash_unique" }),
    // TTL: MongoDB removes sessions once expiresAt passes.
    sessionsCollection(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expiresAt_ttl" }),
    authAttemptsCollection(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expiresAt_ttl" }),
  ]);
  log.info("mongodb indexes ensured");
};
