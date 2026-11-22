/**
 * Seeds database-managed screen content (`site_screens`) and site settings
 * (`site_settings`, e.g. the maintenance flag).
 *
 *   npm run seed:screens            insert missing screens only
 *   npm run seed:screens -- --force replace existing screens with these defaults
 *
 * This is the ONLY place default copy lives. The app never falls back to it:
 * at runtime all content is read from MongoDB and validated by the zod schema
 * in src/lib/shared/content/. Edit content through the admin API afterwards.
 */
import { MongoClient } from "mongodb";

const SEED_AUTHOR = "seed";

const SCREENS = {
  maintenance: {
    meta: {
      title: "System upgrade in progress",
      description: "This portfolio is undergoing a scheduled system upgrade. The next release is on its way.",
    },
    brand: { label: "PORTFOLIO / STUDIO", wordmark: "Portfolio" },
    status: { kicker: "SYSTEM UPGRADE", label: "STATUS / LIVE UPGRADE" },
    headline: { lines: ["UPGRADING", "THE SYSTEM."] },
    body: "We're shipping a new version of the site. It'll be back shortly, a little sharper than before.",
    timeline: {
      label: "ETA",
      windowStart: new Date("2026-11-22T00:00:00.000Z"),
      targetAt: new Date("2026-12-31T00:00:00.000Z"),
      srRemaining: "{days} days, {hours} hours and {minutes} minutes until the upgrade window closes",
      units: { days: "DD", hours: "HH", minutes: "MM", seconds: "SS" },
      overdue: { title: "FINALIZING DEPLOY", detail: "WINDOW EXTENDED" },
    },
    liveCheck: { lastCheckedLabel: "LAST CHECKED", nextCheckLabel: "NEXT CHECK" },
    footer: { note: "© 2026 ALL RIGHTS RESERVED." },
  },
};

/** Site-wide switches. Seeded only when missing; never overwritten by --force. */
const SETTINGS = [{ _id: "maintenance", enabled: true }];

const main = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set (run with --env-file=.env.local)");
  }
  const force = process.argv.includes("--force");
  const client = new MongoClient(uri, { appName: "mm-portfolio-seed", serverSelectionTimeoutMS: 10_000 });

  try {
    await client.connect();
    const screens = client.db(process.env.MONGODB_DB || "mm-portfolio").collection("site_screens");

    const settings = client.db(process.env.MONGODB_DB || "mm-portfolio").collection("site_settings");
    for (const { _id, ...value } of SETTINGS) {
      const result = await settings.updateOne(
        { _id },
        { $setOnInsert: { ...value, updatedAt: new Date(), updatedBy: SEED_AUTHOR } },
        { upsert: true },
      );
      console.log(`${result.upsertedCount ? "insert " : "skip   "} setting ${_id}`);
    }

    for (const [slug, content] of Object.entries(SCREENS)) {
      const existing = await screens.findOne({ _id: slug }, { projection: { version: 1 } });
      if (existing && !force) {
        console.log(`skip    ${slug} (exists, version ${existing.version}; use --force to replace)`);
        continue;
      }
      const version = existing ? existing.version + 1 : 1;
      await screens.replaceOne(
        { _id: slug },
        { content, version, updatedAt: new Date(), updatedBy: SEED_AUTHOR },
        { upsert: true },
      );
      console.log(`${existing ? "replace" : "insert "} ${slug} (version ${version})`);
    }
  } finally {
    await client.close();
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
