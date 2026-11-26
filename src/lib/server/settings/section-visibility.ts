import "server-only";
import { getDb } from "../db/mongodb";
import { sectionVisibilityCollection } from "../db/collections";
import { getLogger } from "../logger";
import {
  ALL_VISIBLE,
  HOME_SECTIONS,
  type HomeSection,
  type SectionVisibility,
} from "@/lib/shared/content/home-sections";

/**
 * Which portfolio sections show (`site_settings`, `_id: "sections"`), set
 * from Launchpad (docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md). Read fresh by
 * the home page on every request; a missing document or key means visible.
 */

const log = getLogger("db");

export type SectionVisibilitySetting = {
  visible: SectionVisibility;
  updatedAt: Date | null;
  updatedBy: string | null;
};

const complete = (stored: Partial<Record<string, boolean>> | undefined): SectionVisibility =>
  Object.fromEntries(HOME_SECTIONS.map((section) => [section, stored?.[section] ?? true])) as SectionVisibility;

export const getSectionVisibility = async (): Promise<SectionVisibilitySetting> => {
  try {
    const doc = await sectionVisibilityCollection(await getDb()).findOne({ _id: "sections" });
    return doc
      ? { visible: complete(doc.visible), updatedAt: doc.updatedAt, updatedBy: doc.updatedBy }
      : { visible: ALL_VISIBLE, updatedAt: null, updatedBy: null };
  } catch (err) {
    // Showing everything is the safe fallback: hiding content by accident is worse.
    log.error({ err }, "section visibility read failed; showing every section");
    return { visible: ALL_VISIBLE, updatedAt: null, updatedBy: null };
  }
};

/** Writes the given sections (any subset); the others keep their value. */
export const setSectionVisibility = async (
  changes: Partial<Record<HomeSection, boolean>>,
  updatedBy: string,
): Promise<SectionVisibility> => {
  const set = Object.fromEntries(Object.entries(changes).map(([section, value]) => [`visible.${section}`, value]));
  const doc = await sectionVisibilityCollection(await getDb()).findOneAndUpdate(
    { _id: "sections" },
    { $set: { ...set, updatedAt: new Date(), updatedBy } },
    { upsert: true, returnDocument: "after" },
  );
  log.info({ changes, updatedBy }, "section visibility changed");
  return complete(doc?.visible);
};
