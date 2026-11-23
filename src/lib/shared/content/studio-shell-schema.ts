import { z } from "zod";

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
