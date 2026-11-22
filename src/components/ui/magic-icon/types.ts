export const ICON_NAMES = ["arrow-up-right", "lock", "copy", "menu", "sync", "status"] as const;

export type IconName = (typeof ICON_NAMES)[number];

/**
 * Shared vocabulary for every icon. Icons map each state to geometry and
 * motion; states an icon does not care about fall back to `idle`.
 * - hover:   pointer or keyboard focus is on the parent control
 * - active:  pressed, or toggled on (menu open)
 * - loading: async work in flight
 * - success / error: outcome of the last action
 */
export type IconState = "idle" | "hover" | "active" | "loading" | "success" | "error";
