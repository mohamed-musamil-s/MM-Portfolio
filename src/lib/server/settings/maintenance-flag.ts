import { getDb } from "../db/mongodb";
import { siteSettingsCollection } from "../db/collections";
import { getLogger } from "../logger";

/**
 * The site-wide maintenance switch (`site_settings`, `_id: "maintenance"`).
 * Only the admin API writes it. Read by the proxy (routing), /api/status
 * (the maintenance page's live check) and the admin API.
 *
 * No `server-only` import: src/proxy.ts uses this module.
 */

const log = getLogger("db");

/** Until an admin switches it off, the site stays in maintenance (the portfolio is not built yet). */
export const MAINTENANCE_DEFAULT = true;
/** Proxy reads are cached briefly so routing does not hit MongoDB on every request. */
const CACHE_MS = 10_000;

type CachedFlag = { enabled: boolean; at: number };
const globalForFlag = globalThis as unknown as { __mmMaintenanceFlag?: CachedFlag };

const readFlag = async (): Promise<boolean> => {
  const db = await getDb();
  const doc = await siteSettingsCollection(db).findOne({ _id: "maintenance" }, { projection: { enabled: 1 } });
  return doc?.enabled ?? MAINTENANCE_DEFAULT;
};

/**
 * Current flag. `fresh` skips the cache (used by /api/status). If MongoDB is
 * unreachable, fails safe to the last known value, else to maintenance ON.
 */
export const isMaintenanceEnabled = async ({ fresh = false }: { fresh?: boolean } = {}): Promise<boolean> => {
  const cached = globalForFlag.__mmMaintenanceFlag;
  if (!fresh && cached && Date.now() - cached.at < CACHE_MS) {
    return cached.enabled;
  }
  try {
    const enabled = await readFlag();
    globalForFlag.__mmMaintenanceFlag = { enabled, at: Date.now() };
    return enabled;
  } catch (err) {
    log.error({ err }, "maintenance flag read failed; failing safe");
    return cached?.enabled ?? MAINTENANCE_DEFAULT;
  }
};

export type MaintenanceSetting = { enabled: boolean; updatedAt: Date | null; updatedBy: string | null };

export const getMaintenanceSetting = async (): Promise<MaintenanceSetting> => {
  const db = await getDb();
  const doc = await siteSettingsCollection(db).findOne({ _id: "maintenance" });
  return doc
    ? { enabled: doc.enabled, updatedAt: doc.updatedAt, updatedBy: doc.updatedBy }
    : { enabled: MAINTENANCE_DEFAULT, updatedAt: null, updatedBy: null };
};

export const setMaintenanceEnabled = async (enabled: boolean, updatedBy: string): Promise<void> => {
  const db = await getDb();
  await siteSettingsCollection(db).updateOne(
    { _id: "maintenance" },
    { $set: { enabled, updatedAt: new Date(), updatedBy } },
    { upsert: true },
  );
  globalForFlag.__mmMaintenanceFlag = { enabled, at: Date.now() };
  log.info({ enabled, updatedBy }, "maintenance flag changed");
};
