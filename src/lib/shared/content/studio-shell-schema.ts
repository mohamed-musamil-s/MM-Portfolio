import { z } from "zod";
import { HOME_SECTIONS, type HomeSection } from "./home-sections";

/**
 * Content model for the studio shell: sidebar, topbar and module placeholders
 * (docs/components/STUDIO_SHELL_BUSINESS.md §4).
 */

const text = (max: number) => z.string().trim().min(1).max(max);

/** The studio modules, in navigation order. Routes and icons are mapped in code. */
export const STUDIO_MODULES = ["dashboard", "release", "content", "resume", "chat", "analytics"] as const;
export type StudioModule = (typeof STUDIO_MODULES)[number];

const moduleCopy = z.object({ label: text(32), title: text(48), description: text(200) });

export const studioShellContentSchema = z.object({
  brand: z.object({ name: text(24), tagline: text(32) }),
  owner: z.object({ name: text(60), role: text(32) }),
  breadcrumbRoot: text(24),
  groups: z
    .array(z.object({ label: text(24), items: z.array(z.enum(STUDIO_MODULES)).min(1) }))
    .min(1)
    .max(4),
  modules: z.object({
    dashboard: moduleCopy,
    release: moduleCopy,
    content: moduleCopy,
    resume: moduleCopy,
    chat: moduleCopy,
    analytics: moduleCopy,
  }),
  placeholder: z.object({ badge: text(24), body: text(200) }),
  /** Menu filter at the top of the sidebar. */
  search: z.object({ placeholder: text(32), empty: text(48), shortcut: text(12), clear: text(24) }),
  /** Public-site status card at the bottom of the sidebar (reads the maintenance flag). */
  siteStatus: z.object({ title: text(24), maintenance: text(32), live: text(32), viewSite: text(24) }),
  /** Content Forge (the content editor page). */
  editor: z.object({
    screensTitle: text(32),
    searchFields: text(32),
    /** Placeholders: {time} {who}. */
    lastSaved: text(64),
    /** Placeholder: {n}. */
    version: text(24),
    preview: text(24),
    unsaved: text(32),
    discard: text(24),
    save: text(24),
    saving: text(24),
    saved: text(48),
    conflict: text(160),
    reload: text(24),
    invalid: text(120),
    failed: text(120),
    noFields: text(64),
    addItem: text(24),
    removeItem: text(24),
    characters: text(24),
    edited: text(24),
    resetField: text(32),
    /** Placeholder: {n}. */
    fieldCount: text(32),
    fieldCountOne: text(32),
    /** Placeholder: {n}. */
    item: text(24),
    required: text(64),
    /** Placeholder: {max}. */
    tooLong: text(64),
    /** Placeholder: {min}. */
    tooShort: text(64),
    previewPanel: z.object({
      title: text(32),
      editTab: text(16),
      previewTab: text(16),
      fit: text(24),
      desktop: text(24),
      mobile: text(24),
      openPage: text(24),
      hint: text(140),
      invalid: text(120),
      idle: text(120),
      hitsOne: text(64),
      /** Placeholder: {n}. */
      hits: text(64),
      none: text(140),
      showOn: text(32),
      hideScreens: text(32),
      showScreens: text(32),
    }),
    siteMode: z.object({
      title: text(32),
      maintenance: text(120),
      live: text(120),
      toggle: text(32),
      updated: text(64),
    }),
    screens: z.record(z.string(), z.object({ name: text(40), description: text(140) })),
    /** Names of the sections of a split screen (the home page), shown as separate entries. Keyed by section. */
    sections: z.record(z.string(), z.object({ name: text(40), description: text(140) })),
  }),
  /** Inbox, the chat module (docs/screens/STUDIO_INBOX_BUSINESS.md). Placeholders: {n} {topic}. */
  inbox: z.object({
    search: text(40),
    filters: z.object({ all: text(16), unread: text(16), archived: text(16) }),
    unreadCount: text(32),
    empty: text(160),
    emptyFilter: text(120),
    selectPrompt: text(120),
    markRead: text(24),
    markUnread: text(24),
    archive: text(24),
    restore: text(24),
    replyByEmail: text(32),
    replyNote: text(160),
    replySubject: text(60),
    topic: text(24),
    received: text(24),
    page: text(24),
    noTopic: text(32),
    back: text(24),
    you: text(24),
    updated: text(64),
    failed: text(120),
    /** The topbar bell: unread messages at a glance. Placeholder: {n}. */
    bell: z.object({
      label: text(40),
      title: text(32),
      count: text(24),
      empty: text(80),
      viewAll: text(24),
    }),
  }),
  /** Launchpad (docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md). Placeholders: {n} {total} {time} {who} {section}. */
  launchpad: z.object({
    sectionsTitle: text(40),
    sectionsHint: text(200),
    count: text(48),
    lastChange: text(64),
    visible: text(16),
    hidden: text(16),
    toggle: text(40),
    shown: text(64),
    hiddenToast: text(64),
    failed: text(120),
    /** Version history. Placeholders: {n} {m} {time} {who} {list}. */
    versions: z.object({
      title: text(40),
      hint: text(200),
      version: text(24),
      current: text(16),
      savedBy: text(48),
      changed: text(48),
      same: text(64),
      restore: text(24),
      confirm: text(24),
      restored: text(80),
      conflict: text(120),
      incompatible: text(120),
      failed: text(120),
      empty: text(140),
    }),
    sections: z.object(
      Object.fromEntries(
        HOME_SECTIONS.map((section) => [section, z.object({ name: text(32), description: text(120) })]),
      ) as Record<HomeSection, z.ZodObject<{ name: z.ZodString; description: z.ZodString }>>,
    ),
  }),
  /** Pulse, Vercel Web Analytics (docs/screens/STUDIO_PULSE_BUSINESS.md). Placeholders: {change} {days} {visitors} {pageviews}. */
  pulse: z.object({
    environment: z.object({
      production: text(32),
      preview: text(32),
      productionHint: text(120),
      previewHint: text(160),
    }),
    ranges: z.object({ week: text(16), month: text(16), quarter: text(16) }),
    rangeLabel: text(24),
    stats: z.object({
      visitors: text(24),
      pageviews: text(24),
      perVisitor: text(32),
      change: text(64),
      noPrevious: text(64),
    }),
    chartTitle: text(48),
    chartSummary: text(140),
    tableCaption: text(64),
    date: text(16),
    breakdowns: z.object({
      requestPath: text(32),
      referrerHostname: text(32),
      country: text(32),
      deviceType: text(32),
    }),
    direct: text(32),
    empty: text(120),
    setup: z.object({ title: text(48), body: text(240), note: text(120) }),
    errors: z.object({ auth: text(120), forbidden: text(120), plan: text(120), failed: text(120) }),
  }),
  /** Mission Control, the dashboard (docs/screens/STUDIO_MISSION_CONTROL_BUSINESS.md). Placeholders: {name} {n} {total} {time} {who}. */
  missionControl: z.object({
    greeting: text(48),
    summary: text(160),
    stats: z.object({
      site: text(32),
      live: text(24),
      maintenance: text(24),
      siteHint: text(40),
      unread: text(32),
      unreadHint: text(40),
      sections: text(32),
      sectionsValue: text(32),
      sectionsHint: text(40),
      content: text(32),
      contentValue: text(32),
      contentHint: text(64),
      never: text(32),
    }),
    shortcutsTitle: text(32),
    shortcuts: z.object(
      Object.fromEntries(
        (["site", "content", "inbox", "launchpad", "resume", "pulse"] as const).map((key) => [
          key,
          z.object({ label: text(32), description: text(80) }),
        ]),
      ) as Record<
        "site" | "content" | "inbox" | "launchpad" | "resume" | "pulse",
        z.ZodObject<{ label: z.ZodString; description: z.ZodString }>
      >,
    ),
    recentTitle: text(32),
    recentEmpty: text(120),
    viewAll: text(24),
    soon: text(16),
  }),
  actions: z.object({
    collapse: text(32),
    expand: text(32),
    openMenu: text(32),
    navigation: text(32),
    signOut: text(24),
    signingOut: text(24),
    /** Accessible name of the topbar account menu button. */
    accountMenu: text(32),
    /** Shown in the collapse tooltip, e.g. "Ctrl B". */
    shortcut: text(16),
  }),
});

export type StudioShellContent = z.infer<typeof studioShellContentSchema>;
