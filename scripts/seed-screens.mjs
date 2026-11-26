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
  // Name splash before the portfolio (docs/screens/SPLASH_BUSINESS.md). Generic name: set the real one in Content Forge.
  splash: {
    enabled: true,
    intro: { lead: "Let's talk", key: "craft." },
    hello: "Hello",
    bracket: "You found the portfolio of",
    loading: "Loading the good stuff",
    moments: { lead: "I", first: "Design", second: "Build", third: "Animate" },
    design: { lead: "Interfaces,", key: "pixel-perfect." },
    code: {
      caption: { lead: "Code that", key: "ships." },
      lines: ["npm run build", "git push origin main", "deploy --prod"],
      status: "Deployed",
    },
    detail: { lead: "Every detail,", key: "on purpose." },
    stack: {
      title: { lead: "Built with the tools", key: "I trust." },
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "Motion"],
      note: "Design · Code · Motion",
    },
    statements: ["Big ideas.", "Clean code.", "Smooth motion.", "Real results."],
    tags: ["wireframes", "prototypes", "design systems", "animations", "APIs", "dashboards"],
    name: { first: "Your", last: "Name" },
    tagline: { lead: "Designer & developer crafting", key: "interfaces that feel alive." },
    cta: "Enter portfolio",
    label: "Est. 2026",
    skip: "Skip intro",
    srLabel: "Intro animation",
  },
  // Portfolio home: navbar and hero (docs/screens/HOME_BUSINESS.md). Generic: set real details in Content Forge.
  home: {
    meta: { title: "Portfolio", description: "Full stack web development, crafted with care." },
    nav: {
      name: "Your Name",
      links: [
        { label: "About", href: "#about" },
        { label: "Experience", href: "#experience" },
        { label: "Education", href: "#education" },
        { label: "Skills", href: "#skills" },
        { label: "Work", href: "#work" },
        { label: "Contact", href: "#contact" },
      ],
      status: "Open to new adventures",
      cta: { label: "Let's talk", href: "#contact" },
      menu: "Menu",
      close: "Close",
    },
    hero: {
      status: "Open to new adventures",
      lines: ["Your", "Name"],
      role: "Full-stack developer",
      roleMeta: "Web · Cloud",
      intro:
        "I turn ideas into fast, friendly web apps: a solid back end, a careful front end and the cloud they live on.",
      primary: { label: "See my journey", href: "#experience" },
      secondary: { label: "Get in touch", href: "#contact" },
      stats: [],
      portrait: {
        src: "/portraits/hero-portrait.svg",
        alt: "Ink illustration portrait",
        caption: "Mindset / Ambition / Freedom",
      },
      marquee: ["Design", "Development", "Motion", "Cloud", "Systems"],
    },
    about: {
      header: { index: "01", eyebrow: "Focus / Discipline / Execution", title: "About me", count: "" },
      statement: "I build software like an engineer and polish it like a designer.",
      paragraphs: ["A short story about who you are, what you build and how you like to work."],
      primary: { label: "Get my resume", href: "#contact" },
      secondary: { label: "Say hello", href: "#contact" },
      facts: [{ label: "Experience", big: "0+", value: "years of shipping", highlight: true }],
      timelineLabel: "The road so far",
      timeline: [{ period: "2026", title: "Your first milestone", org: "Somewhere great", current: true }],
    },
    experience: {
      header: { index: "02", eyebrow: "Mindset / Ambition / Freedom", title: "Experience", count: "" },
      roles: [
        {
          company: "Company",
          url: "",
          logo: "",
          title: "Your role",
          period: "2026 — Present",
          location: "City",
          duration: "",
          current: true,
          highlights: ["What you built, with the **key result** in bold."],
          stack: [{ name: "TypeScript", icon: "", core: true, ink: false }],
        },
      ],
    },
    education: {
      header: { index: "03", eyebrow: "Learn / Build / Repeat", title: "Education", count: "" },
      items: [{ badge: "BSc", title: "Your degree", org: "Your college", year: "2018 — 2021" }],
    },
    skills: {
      header: { index: "04", eyebrow: "Focus / Discipline", title: "Skills", count: "" },
      legend: { core: "Core stack", other: "Also used", summary: "Your stack in one line" },
      groups: [
        {
          index: "01",
          title: "Frameworks",
          wide: true,
          dark: false,
          note: "",
          skills: [{ name: "TypeScript", icon: "", core: true, ink: false }],
        },
      ],
    },
    work: {
      header: { index: "05", eyebrow: "Selected work", title: "Work", count: "" },
      note: "",
      projects: [
        {
          index: "01",
          title: "A project",
          category: "Category",
          period: "2026",
          summary: "What it does and why it matters.",
          tags: ["TypeScript"],
          image: { src: "/portfolio/projects/microservices-platform/preview.svg", alt: "Project illustration" },
        },
      ],
    },
    recognition: {
      header: { index: "06", eyebrow: "Create / Inspire / Elevate", title: "Recognition", count: "" },
      awardsLabel: "Honors & awards",
      quotesLabel: "Kind words",
      awards: [],
      quotes: [],
    },
    contact: {
      header: { index: "07", eyebrow: "Create / Inspire / Elevate", title: "Let's talk", count: "" },
      headline: "Let's build something that lasts.",
      text: "Have a role or a project in mind? Say hello.",
      email: "",
      details: [{ label: "Location", value: "Somewhere on Earth", href: "" }],
      form: {
        label: "Brief",
        replyNote: "Replies within 48h",
        name: { label: "Your name", placeholder: "Jane Doe" },
        email: { label: "Email", placeholder: "jane@company.com" },
        message: { label: "Message", placeholder: "Tell me about the role or project…" },
        topicsLabel: "I'm reaching out about",
        prompts: {
          greeting: "Hi there! A few quick questions and your message is on its way.",
          name: "First up, what should I call you?",
          email: "Nice to meet you, {name}. Which email should I reply to?",
          topic: "What are you reaching out about?",
          message: "Tell me a little about it.",
          review: "All set. Send it over?",
          restart: "Start over",
        },
        topics: ["Full-time role", "Freelance project", "Consulting"],
        submit: "Send message",
        sending: "Sending…",
        errors: {
          name: "Please add your name",
          email: "Please add a valid email",
          message: "Please add a short message (10+ characters)",
          failed: "Couldn't send. Please email me directly instead.",
          rate: "Too many messages for now. Please try again later.",
        },
        thanks: {
          title: "Thank you, {name}!",
          text: "Your message landed safely. I'll get back to you soon.",
          again: "Send another message",
        },
      },
    },
    footer: {
      eyebrow: "The end is a beginning",
      wordmark: "Your Name",
      clock: { label: "Local time", timeZone: "UTC" },
      linksLabel: "Navigate",
      socialsLabel: "Elsewhere",
      manifesto: [
        { word: "Create.", index: "01 — Mindset", text: "Start with intent, not with tools.", outline: false },
        { word: "Inspire.", index: "02 — Ambition", text: "Build what others want to build on.", outline: true },
        {
          word: "Elevate.",
          index: "03 — Freedom",
          text: "Leave every system better than you found it.",
          outline: false,
        },
      ],
      quote: "Dream in ink. Build in code.",
      quoteSource: "Portfolio",
      closing: "Keep building.",
      cta: { label: "Start a conversation", href: "#contact" },
      links: [
        { label: "About", href: "#about" },
        { label: "Contact", href: "#contact" },
      ],
      socials: [],
      copyright: "© 2026 All rights reserved.",
      backToTop: "Back to top ↑",
    },
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
      release: {
        label: "Launchpad",
        title: "Launchpad",
        description: "Choose which portfolio sections are live, and switch the site in and out of maintenance.",
      },
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
        editTab: "Edit",
        previewTab: "Preview",
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
        home: { name: "Home", description: "The portfolio page: navbar, hero and every section, plus the footer." },
        splash: { name: "Name splash", description: "The intro that plays once before the portfolio opens." },
        maintenance: { name: "Maintenance page", description: "What visitors see while the site is being upgraded." },
        "not-found": { name: "404 page", description: "Shown for any address that doesn't exist." },
      },
      sections: {
        meta: {
          name: "Page details",
          description: "The browser tab title and the search engine description.",
        },
        nav: {
          name: "Navbar",
          description: "Name beside the logo, menu links, status and the call to action.",
        },
        hero: {
          name: "Hero",
          description: "Name, role, intro, buttons, stats, portrait and the marquee.",
        },
        about: {
          name: "About",
          description: "Statement, story, facts and the road so far.",
        },
        experience: {
          name: "Experience",
          description: "Roles, highlights and stacks.",
        },
        education: {
          name: "Education",
          description: "Degrees and qualifications.",
        },
        skills: {
          name: "Skills",
          description: "Skill groups, tools and the legend.",
        },
        work: {
          name: "Selected work",
          description: "Project case cards.",
        },
        recognition: {
          name: "Recognition",
          description: "Awards and kind words.",
        },
        contact: {
          name: "Contact",
          description: "Details, and the chat form's questions and replies.",
        },
        footer: {
          name: "Footer",
          description: "Quote, call to action, links, clock and the name.",
        },
      },
    },
    inbox: {
      search: "Search messages",
      filters: {
        all: "All",
        unread: "Unread",
        archived: "Archived",
      },
      unreadCount: "{n} unread",
      empty: "No messages yet. They will appear here as soon as someone writes through the contact form.",
      emptyFilter: "Nothing here for this filter.",
      selectPrompt: "Choose a conversation to read it.",
      markRead: "Mark as read",
      markUnread: "Mark as unread",
      archive: "Archive",
      restore: "Restore",
      replyByEmail: "Reply by email",
      replyNote: "Replies from the studio are coming soon. For now, Reply by email opens your mail app.",
      replySubject: "Re: {topic}",
      topic: "Topic",
      received: "Received",
      page: "Sent from",
      noTopic: "No topic",
      back: "All messages",
      you: "You",
      updated: "Conversation updated.",
      failed: "Couldn't update the conversation. Try again.",
      bell: {
        label: "Messages, {n} unread",
        title: "Messages",
        count: "{n} new",
        empty: "You're all caught up.",
        viewAll: "Open Inbox",
      },
    },
    launchpad: {
      sectionsTitle: "Portfolio sections",
      sectionsHint:
        "Hide a section to take it off the portfolio, with its navbar and footer links. Its content stays safe in Content Forge.",
      count: "{n} of {total} showing",
      lastChange: "Last changed {time} by {who}",
      visible: "Visible",
      hidden: "Hidden",
      toggle: "Show {section}",
      shown: "{section} is now visible.",
      hiddenToast: "{section} is now hidden.",
      failed: "Couldn't save that change. Try again.",
      versions: {
        title: "Version history",
        hint: "Every save in Content Forge is kept as a version. Restore one to roll a page back; the restore is saved as a new version, so nothing is lost.",
        version: "Version {n}",
        current: "Current",
        savedBy: "{time} by {who}",
        changed: "Differs in: {list}",
        same: "Same as the current version",
        restore: "Restore",
        confirm: "Confirm restore",
        restored: "Restored version {n} as version {m}.",
        conflict: "This page changed meanwhile. Reload and try again.",
        incompatible: "That version no longer fits the current content model.",
        failed: "Couldn't restore that version. Try again.",
        empty: "No versions kept yet. History starts with the next save in Content Forge.",
      },
      sections: {
        about: {
          name: "About",
          description: "Statement, facts and the road so far.",
        },
        experience: {
          name: "Experience",
          description: "Roles, highlights and stacks.",
        },
        education: {
          name: "Education",
          description: "Degrees and qualifications.",
        },
        skills: {
          name: "Skills",
          description: "Skill groups and tools.",
        },
        work: {
          name: "Selected work",
          description: "Project case cards.",
        },
        recognition: {
          name: "Recognition",
          description: "Awards and kind words.",
        },
        contact: {
          name: "Contact",
          description: "Details and the chat contact form.",
        },
      },
    },
    pulse: {
      environment: {
        production: "Production data",
        preview: "Preview data",
        productionHint: "Visits to the live site.",
        previewHint: "Visits to preview and dev deployments. The live site's numbers show on production only.",
      },
      ranges: {
        week: "7 days",
        month: "30 days",
        quarter: "90 days",
      },
      rangeLabel: "Date range",
      stats: {
        visitors: "Visitors",
        pageviews: "Page views",
        perVisitor: "Views per visitor",
        change: "{change} vs the previous {days} days",
        noPrevious: "No earlier data to compare",
      },
      chartTitle: "Visitors and page views",
      chartSummary: "{visitors} visitors and {pageviews} page views over the last {days} days.",
      tableCaption: "Daily visitors and page views",
      date: "Date",
      breakdowns: {
        requestPath: "Top pages",
        referrerHostname: "Referrers",
        country: "Countries",
        deviceType: "Devices",
      },
      direct: "Direct or unknown",
      empty: "No visits recorded for this range yet.",
      setup: {
        title: "Connect Vercel Analytics",
        body: "Pulse reads your traffic from Vercel Web Analytics. Turn on Web Analytics for the project in Vercel, then add these environment variables and restart the server:",
        note: "The token stays on the server and never reaches the browser.",
      },
      errors: {
        auth: "Vercel rejected the access token. Check VERCEL_ANALYTICS_TOKEN.",
        forbidden: "The token can't read this project's analytics. Check the project and team.",
        plan: "Web Analytics data isn't available on the current Vercel plan.",
        failed: "Couldn't load analytics from Vercel. Try again in a moment.",
      },
    },
    missionControl: {
      greeting: "Hello, {name}",
      summary: "Here is how your portfolio is doing right now.",
      stats: {
        site: "Site",
        live: "Live",
        maintenance: "Maintenance",
        siteHint: "Open Launchpad",
        unread: "Unread messages",
        unreadHint: "Open the inbox",
        sections: "Sections showing",
        sectionsValue: "{n} of {total}",
        sectionsHint: "Manage in Launchpad",
        content: "Content",
        contentValue: "Version {n}",
        contentHint: "Saved {time} by {who}",
        never: "Not saved yet",
      },
      shortcutsTitle: "Shortcuts",
      shortcuts: {
        site: {
          label: "Open the site",
          description: "See the portfolio as visitors do.",
        },
        content: {
          label: "Edit content",
          description: "Every page's text in Content Forge.",
        },
        inbox: {
          label: "Inbox",
          description: "Read messages from visitors.",
        },
        launchpad: {
          label: "Launchpad",
          description: "Show or hide sections, maintenance.",
        },
        resume: {
          label: "Resume Lab",
          description: "Build a resume from your content.",
        },
        pulse: {
          label: "Pulse",
          description: "Traffic and engagement.",
        },
      },
      recentTitle: "Recent messages",
      recentEmpty: "No messages yet.",
      viewAll: "View all",
      soon: "Soon",
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
