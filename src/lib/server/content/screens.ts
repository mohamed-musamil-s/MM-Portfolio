import "server-only";
import { cache } from "react";
import { getDb } from "../db/mongodb";
import { siteScreensCollection } from "../db/collections";
import { getLogger } from "../logger";
import { recordVersions } from "./versions";
import { SCREEN_SCHEMAS, type ScreenContent, type ScreenSlug } from "@/lib/shared/content/screens";

const log = getLogger("db");

export class ScreenContentError extends Error {
  constructor(
    message: string,
    readonly slug: ScreenSlug,
  ) {
    super(message);
    this.name = "ScreenContentError";
  }
}

export type ScreenRecord<S extends ScreenSlug> = {
  content: ScreenContent<S>;
  version: number;
  updatedAt: Date;
  updatedBy: string;
};

/** Reads and validates a screen document. Throws ScreenContentError when missing or invalid. */
const readScreen = async <S extends ScreenSlug>(slug: S): Promise<ScreenRecord<S>> => {
  const db = await getDb();
  const doc = await siteScreensCollection(db).findOne({ _id: slug });
  if (!doc) {
    log.error({ slug }, "screen content missing: run npm run seed:screens");
    throw new ScreenContentError(`Screen content "${slug}" is missing`, slug);
  }

  const parsed = SCREEN_SCHEMAS[slug].safeParse(doc.content);
  if (!parsed.success) {
    log.error({ slug, issues: parsed.error.issues }, "screen content failed validation");
    throw new ScreenContentError(`Screen content "${slug}" is invalid`, slug);
  }

  return { content: parsed.data, version: doc.version, updatedAt: doc.updatedAt, updatedBy: doc.updatedBy };
};

/** Memoised per request, so generateMetadata and the page share one read. */
export const getScreenRecord = cache(readScreen);

export const getScreenContent = async <S extends ScreenSlug>(slug: S): Promise<ScreenContent<S>> =>
  (await getScreenRecord(slug)).content;

export type SaveResult = { ok: true; version: number } | { ok: false; reason: "conflict" | "missing" };

/**
 * Saves already-validated content with optimistic concurrency: the write only
 * applies if the stored version still equals `expectedVersion`.
 */
export const saveScreenContent = async <S extends ScreenSlug>(
  slug: S,
  content: ScreenContent<S>,
  expectedVersion: number,
  updatedBy: string,
): Promise<SaveResult> => {
  const db = await getDb();
  const screens = siteScreensCollection(db);
  const savedAt = new Date();
  const previous = await screens.findOneAndUpdate(
    { _id: slug, version: expectedVersion },
    { $set: { content, updatedAt: savedAt, updatedBy }, $inc: { version: 1 } },
    { returnDocument: "before" },
  );

  if (previous) {
    const version = previous.version + 1;
    // Version history: keep the version this save replaced (if history started after it) and the new one.
    await recordVersions(slug, [
      {
        version: previous.version,
        content: previous.content,
        savedAt: previous.updatedAt,
        savedBy: previous.updatedBy,
      },
      { version, content, savedAt, savedBy: updatedBy },
    ]);
    log.info({ slug, version }, "screen content saved");
    return { ok: true, version };
  }

  const exists = await screens.countDocuments({ _id: slug }, { limit: 1 });
  return { ok: false, reason: exists ? "conflict" : "missing" };
};
