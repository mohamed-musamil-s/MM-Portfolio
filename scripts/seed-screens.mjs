/**
 * Seeds database-managed screen content (`site_screens`) and site settings
 * (`site_settings`, e.g. the maintenance flag).
 *
 *   npm run seed:screens            insert missing screens only
 *   npm run seed:screens -- --force replace existing screens with these defaults
 *   npm run seed:screens -- --force --only=studio-login   replace just one screen
 *
 * This is the ONLY place default copy lives. The app never falls back to it:
 * at runtime all content is read from MongoDB and validated by the zod schema
 * in src/lib/shared/content/. Edit content through the admin API afterwards.
 */
import { MongoClient } from "mongodb";

const SEED_AUTHOR = "seed";

const SCREENS = {
  // Text used on more than one portfolio page, stored once.
  shared: {
    footer: { note: "© 2026 ALL RIGHTS RESERVED." },
  },
  maintenance: {
    meta: {
      title: "System upgrade in progress",
      description: "This portfolio is undergoing a scheduled system upgrade. The next release is on its way.",
    },
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
    liveCheck: {
      lastCheckedLabel: "LAST CHECKED",
      nextCheckLabel: "NEXT CHECK",
      checkAgainLabel: "CHECK AGAIN",
      checkingLabel: "CHECKING STATUS...",
      checkedLabel: "STILL UPGRADING",
      hint: "This page checks by itself every minute, so there's no need to keep refreshing.",
    },
    illustration: {
      steps: [
        { scene: "manage", label: "MANAGE THE SITE" },
        { scene: "construct", label: "CONSTRUCT THE SCREEN" },
        { scene: "content", label: "THINK THE CONTENT" },
        { scene: "redesign", label: "REDESIGN THE UI" },
        { scene: "upgrade", label: "UPGRADE THE VERSION" },
      ],
      versionFrom: "V1.0",
      versionTo: "V2.0",
    },
  },
  "not-found": {
    meta: {
      title: "Page not found",
      description: "The page you're looking for doesn't exist or has moved.",
    },
    display: { label: "ERROR", code: "404" },
    heading: "PAGE NOT FOUND.",
    body: "The page you're looking for doesn't exist or has moved. We'll take you back to the main page in a moment.",
    action: { label: "RETURN TO MAIN PAGE" },
    redirect: {
      seconds: 10,
      label: "REDIRECTING IN",
      pausedLabel: "REDIRECT PAUSED",
      pauseLabel: "PAUSE",
      resumeLabel: "RESUME",
      srAnnouncement: "Taking you to the main page in {seconds} seconds.",
    },
  },
  "studio-login": {
    meta: { title: "Studio sign in" },
    brand: { name: "Studio" },
    steps: { email: "Email", code: "Access code" },
    showcase: {
      status: "All systems online",
      illustration: {
        overview: {
          title: "Overview",
          period: "This week",
          metricLabel: "Visitors",
          metricValue: "12.4k",
          delta: "+8.2%",
          days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        uptime: { label: "Uptime", value: "99.9%" },
        activity: {
          title: "Recent activity",
          items: [
            { label: "Deploy succeeded", time: "2m" },
            { label: "Page updated", time: "1h" },
            { label: "Backup completed", time: "3h" },
          ],
        },
        toggle: { label: "Auto-sync", state: "On" },
        security: { label: "Secure session", detail: "End-to-end encrypted" },
      },
    },
    emailStep: {
      title: "Welcome back",
      description: "Sign in with your authorized email address to continue.",
      label: "Email address",
      placeholder: "name@example.com",
      submit: "Continue",
      pending: "Checking…",
    },
    codeStep: {
      title: "Enter your access code",
      description: "Type your access code to finish signing in.",
      label: "Access code",
      submit: "Authenticate",
      pending: "Verifying…",
      back: "Change email",
      success: "Signed in. Opening the studio…",
      show: "Show access code",
      hide: "Hide access code",
    },
    errors: {
      title: "Couldn't sign in",
      emailRequired: "Enter your email address.",
      emailInvalid: "Enter a valid email address, like name@example.com.",
      codeRequired: "Enter your access code.",
      codeTooShort: "The access code is at least 4 characters.",
      invalidCredentials: "The email or access code is incorrect.",
      locked: "Too many failed attempts. Try again in {minutes} min.",
      challengeExpired: "This sign-in step expired. Enter your email again.",
      network: "Couldn't reach the server. Check your connection and try again.",
      generic: "Something went wrong. Please try again.",
    },
    footer: { note: "Restricted area. Sign-in attempts are logged and rate limited." },
  },
  "studio-shell": {
    brand: { name: "Studio", tagline: "Admin console" },
    // Generic on purpose: the live database holds the real owner's name, the repository never does.
    owner: { name: "Studio Owner", role: "Owner" },
    breadcrumbRoot: "Studio",
    groups: [
      { label: "Workspace", items: ["dashboard", "release", "content"] },
      { label: "Tools", items: ["resume", "chat", "analytics"] },
    ],
    modules: {
      dashboard: {
        label: "Mission Control",
        title: "Mission Control",
        description: "Your studio at a glance: site status, releases and recent activity.",
      },
      release: { label: "Launchpad", title: "Launchpad", description: "Plan, publish and roll back site versions." },
      content: {
        label: "Content Forge",
        title: "Content Forge",
        description: "Edit every page's text, dates and labels in one place.",
      },
      resume: {
        label: "Resume Lab",
        title: "Resume Lab",
        description: "Build and export a resume from your portfolio content.",
      },
      chat: { label: "Inbox", title: "Inbox", description: "Read and answer messages from visitors." },
      analytics: { label: "Pulse", title: "Pulse", description: "Traffic, sources and engagement over time." },
    },
    placeholder: {
      badge: "Coming soon",
      body: "This module is on the way. The shell and navigation are ready for it.",
    },
    search: { placeholder: "Search menu", empty: "No matching pages", shortcut: "Ctrl K", clear: "Clear search" },
    siteStatus: { title: "Public site", maintenance: "Maintenance mode", live: "Live", viewSite: "View site" },
    editor: {
      screensTitle: "Screens",
      searchFields: "Search fields",
      lastSaved: "Saved {time} by {who}",
      version: "Version {n}",
      preview: "Preview",
      unsaved: "Unsaved changes",
      discard: "Discard",
      save: "Save changes",
      saving: "Saving…",
      saved: "Changes saved and live.",
      conflict: "This screen was changed somewhere else while you were editing. Reload to get the latest version.",
      reload: "Reload",
      invalid: "Some fields need attention. Check the highlighted fields.",
      failed: "Couldn't save. Check your connection and try again.",
      noFields: "No fields match your search.",
      addItem: "Add item",
      removeItem: "Remove",
      characters: "characters",
      edited: "Edited",
      resetField: "Undo changes",
      fieldCount: "{n} fields",
      fieldCountOne: "1 field",
      item: "Item {n}",
      required: "This field can't be empty.",
      tooLong: "Too long: keep it under {max} characters.",
      tooShort: "Too short: use at least {min} characters.",
      previewPanel: {
        title: "Live preview",
        fit: "Fit to panel",
        desktop: "Desktop",
        mobile: "Mobile",
        openPage: "Open page",
        hint: "Unsaved changes show here right away. Visitors see them after you save.",
        invalid: "Fix the highlighted fields to update the preview.",
        idle: "Click a field to see where it appears on the page.",
        hitsOne: "Shown in 1 place on this page",
        hits: "Shown in {n} places on this page",
        none: "Not visible on the page: used for the browser tab, search results or screen readers.",
        showOn: "Shown on",
        hideScreens: "Hide screens",
        showScreens: "Show screens",
      },
      siteMode: {
        title: "Site mode",
        maintenance: "Maintenance mode is on. Visitors see the maintenance page.",
        live: "The site is live for visitors.",
        toggle: "Maintenance mode",
        updated: "Site mode updated.",
      },
      screens: {
        shared: {
          name: "Shared content",
          description: "Text used on several pages, like the footer. Edit once, it changes everywhere.",
        },
        maintenance: { name: "Maintenance page", description: "What visitors see while the site is being upgraded." },
        "not-found": { name: "404 page", description: "Shown for any address that doesn't exist." },
      },
    },
    actions: {
      collapse: "Collapse sidebar",
      expand: "Expand sidebar",
      openMenu: "Open menu",
      navigation: "Navigation",
      signOut: "Sign out",
      signingOut: "Signing out…",
      accountMenu: "Account menu",
      shortcut: "Ctrl B",
    },
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
  const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);
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
      if (only && slug !== only) {
        continue;
      }
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
