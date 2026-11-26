import "server-only";
import { getDb } from "../db/mongodb";
import { screenVersionsCollection } from "../db/collections";
import { getLogger } from "../logger";
import { SCREEN_SCHEMAS, type ScreenSlug } from "@/lib/shared/content/screens";

/*
 * Version history of the database-managed screens (Launchpad,
 * docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md). Every save keeps a copy of the
 * content at its version; restoring saves an old copy as a new version, so
 * nothing is ever lost. The newest KEEP versions per screen are kept.
 */

const log = getLogger("db");

/** Versions kept per screen. */
const KEEP = 50;

export type VersionEntry = { version: number; content: unknown; savedAt: Date; savedBy: string };

/** Stores versions that are not stored yet (an existing version is never overwritten), then prunes old ones. */
export const recordVersions = async (slug: ScreenSlug, entries: VersionEntry[]): Promise<void> => {
  try {
    const versions = screenVersionsCollection(await getDb());
    await versions.bulkWrite(
      entries.map((entry) => ({
        updateOne: {
          filter: { slug, version: entry.version },
          update: { $setOnInsert: { slug, ...entry } },
          upsert: true,
        },
      })),
    );
    const cutoff = await versions
      .find({ slug }, { sort: { version: -1 }, skip: KEEP, limit: 1, projection: { version: 1 } })
      .next();
    if (cutoff) {
      await versions.deleteMany({ slug, version: { $lte: cutoff.version } });
    }
  } catch (err) {
    // History is a convenience: a failed copy must never fail the save itself.
    log.error({ err, slug }, "screen version history write failed");
  }
};

export type VersionSummary = {
  version: number;
  savedAt: string;
  savedBy: string;
  /** Top-level sections that differ from the current content. */
  changed: string[];
};

/** JSON with object keys sorted, so two contents that differ only in key order compare equal. */
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, inner: unknown) =>
    inner && typeof inner === "object" && !Array.isArray(inner)
      ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => a.localeCompare(b)))
      : inner,
  );

const changedKeys = (from: unknown, to: unknown): string[] => {
  const a = (from ?? {}) as Record<string, unknown>;
  const b = (to ?? {}) as Record<string, unknown>;
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((key) => canonical(a[key]) !== canonical(b[key]));
};

/** A version's content as today's content model reads it (unknown old keys dropped), when it still fits. */
const normalise = (slug: ScreenSlug, content: unknown): unknown => {
  const parsed = SCREEN_SCHEMAS[slug].safeParse(content);
  return parsed.success ? parsed.data : content;
};

/** The screen's stored versions, newest first, each with the sections where it differs from `current`. */
export const listVersions = async (slug: ScreenSlug, current: unknown): Promise<VersionSummary[]> => {
  const docs = await screenVersionsCollection(await getDb())
    .find({ slug }, { sort: { version: -1 }, limit: KEEP })
    .toArray();
  return docs.map((doc) => ({
    version: doc.version,
    savedAt: doc.savedAt.toISOString(),
    savedBy: doc.savedBy,
    changed: changedKeys(normalise(slug, doc.content), current),
  }));
};

export type RestoreCheck = { ok: true; content: unknown } | { ok: false; reason: "missing" | "incompatible" };

/** The content of a stored version, if it still fits today's content model. */
export const readVersionForRestore = async (slug: ScreenSlug, version: number): Promise<RestoreCheck> => {
  const doc = await screenVersionsCollection(await getDb()).findOne({ slug, version });
  if (!doc) {
    return { ok: false, reason: "missing" };
  }
  const parsed = SCREEN_SCHEMAS[slug].safeParse(doc.content);
  return parsed.success ? { ok: true, content: parsed.data } : { ok: false, reason: "incompatible" };
};
