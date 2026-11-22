/**
 * Seeds database-managed screen content into `site_screens`.
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
      description: "MM-Portfolio is undergoing a scheduled system upgrade. The next release is on its way.",
    },
    brand: { label: "MM / PORTFOLIO", wordmark: "Musamil", established: "EST. 2000" },
    status: {
      kicker: "SYSTEM UPGRADE IN PROGRESS // CORE INFRASTRUCTURE & EDITORIAL ENGINE",
      label: "STATUS / LIVE UPGRADE",
    },
    headline: { lines: ["UPGRADING", "THE SYSTEM."] },
    body: "MM-Portfolio is undergoing a scheduled system upgrade: hardening database and session security, refining the motion and UI systems, and preparing the next release.",
    pillars: [
      {
        index: "01",
        title: "CORE ENGINE",
        description: "Database and session architecture calibration.",
        icon: "sync",
      },
      {
        index: "02",
        title: "MOTION & UI",
        description: "Editorial kinetic typography, WebGL grain and SVG choreography.",
        icon: "calibrate",
      },
      {
        index: "03",
        title: "RELEASE PIPELINE",
        description: "Staging verification and studio readiness.",
        icon: "arrow-up-right",
      },
    ],
    timeline: {
      label: "EXPECTED UPGRADE WINDOW",
      windowStart: new Date("2026-11-22T00:00:00.000Z"),
      targetAt: new Date("2026-12-31T00:00:00.000Z"),
      countdownLabel: "T-MINUS",
      srRemaining: "{days} days, {hours} hours and {minutes} minutes until the upgrade window closes",
      units: { days: "DD", hours: "HH", minutes: "MM", seconds: "SS" },
      overdue: { title: "FINALIZING DEPLOY", detail: "WINDOW EXTENDED" },
    },
    mottos: {
      primary: ["MINDSET", "AMBITION", "FREEDOM"],
      secondary: ["FOCUS", "DISCIPLINE", "CONSISTENCY", "EXECUTION"],
    },
    stamp: { lines: ["SYS // UPGRADE", "EST. 2000"] },
    images: {
      portrait: {
        src: "/images/maintenance/maintenance-portrait-ink.png",
        alt: "Ink portrait of Mohamed Musamil wearing sunglasses",
      },
      gridPlate: { src: "/images/maintenance/maintenance-grid-plate.png", alt: "" },
      stamp: { src: "/images/maintenance/maintenance-stamp-mark.png", alt: "" },
    },
    footer: { note: "© 2026 MOHAMED MUSAMIL. ALL RIGHTS RESERVED." },
  },
};

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
