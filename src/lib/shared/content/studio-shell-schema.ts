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
  brand: z.object({ name: text(24) }),
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
  actions: z.object({
    collapse: text(32),
    expand: text(32),
    openMenu: text(32),
    navigation: text(32),
    signOut: text(24),
    signingOut: text(24),
    /** Shown in the collapse tooltip, e.g. "Ctrl B". */
    shortcut: text(16),
  }),
});

export type StudioShellContent = z.infer<typeof studioShellContentSchema>;
