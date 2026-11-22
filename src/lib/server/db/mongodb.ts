import { MongoClient, type Db } from "mongodb";
import { env } from "../env";
import { getLogger } from "../logger";
import { ensureIndexes } from "./indexes";

const log = getLogger("db");

const CONNECT_TIMEOUT_MS = 10_000;

type MongoCache = {
  clientPromise?: Promise<MongoClient>;
  indexesPromise?: Promise<void>;
};

// Survive Next.js dev hot reloads without opening a new pool each time.
const globalForMongo = globalThis as unknown as { __mmMongo?: MongoCache };
const cache: MongoCache = (globalForMongo.__mmMongo ??= {});

const attachConnectionLogging = (client: MongoClient): void => {
  client.on("serverHeartbeatFailed", (event) =>
    log.warn({ host: event.connectionId, err: event.failure }, "mongodb heartbeat failed"),
  );
  client.on("serverDescriptionChanged", (event) => {
    if (event.previousDescription.type !== event.newDescription.type) {
      log.info(
        { host: event.address, from: event.previousDescription.type, to: event.newDescription.type },
        "mongodb server state changed",
      );
    }
  });
  client.on("connectionPoolCleared", (event) => log.warn({ host: event.address }, "mongodb connection pool cleared"));
  client.on("topologyClosed", () => log.info("mongodb topology closed"));
};

const readMongoUri = (): string => {
  try {
    return env.mongodbUri();
  } catch (err) {
    log.error({ err }, "mongodb not configured");
    throw err;
  }
};

const connect = async (): Promise<MongoClient> => {
  const client = new MongoClient(readMongoUri(), {
    appName: "mm-portfolio",
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
  });
  attachConnectionLogging(client);

  log.info({ db: env.mongodbDb() }, "mongodb connecting");
  return client
    .connect()
    .then((connected) => {
      log.info({ db: env.mongodbDb() }, "mongodb connected");
      return connected;
    })
    .catch(async (err: unknown) => {
      log.error({ err }, "mongodb connection failed");
      await client.close().catch(() => undefined);
      throw err;
    });
};

export const getMongoClient = (): Promise<MongoClient> => {
  cache.clientPromise ??= connect().catch((err: unknown) => {
    // Drop the cached promise so the next request retries.
    cache.clientPromise = undefined;
    throw err;
  });
  return cache.clientPromise;
};

export const getDb = async (): Promise<Db> => {
  const client = await getMongoClient();
  const db = client.db(env.mongodbDb());

  cache.indexesPromise ??= ensureIndexes(db).catch((err: unknown) => {
    log.error({ err }, "mongodb index setup failed");
    cache.indexesPromise = undefined;
    throw err;
  });
  await cache.indexesPromise;

  return db;
};

export const pingDatabase = async (): Promise<number> => {
  const startedAt = performance.now();
  const db = await getDb();
  await db.command({ ping: 1 });
  return Math.round(performance.now() - startedAt);
};
