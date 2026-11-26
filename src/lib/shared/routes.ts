/** Route constants shared by server and client code. No secrets here. */

export const ROUTES = {
  home: "/",
  maintenance: "/maintenance",
  notFound: "/404",
  /** Studio-only live preview of a portfolio screen: `${preview}/<slug>`. */
  preview: "/preview",
  studio: {
    root: "/studio",
    login: "/studio/login",
    dashboard: "/studio/dashboard",
    release: "/studio/release",
    content: "/studio/content",
    resume: "/studio/resume",
    chat: "/studio/chat",
    analytics: "/studio/analytics",
  },
  api: {
    initiateLogin: "/api/auth/initiate-login",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    health: "/api/health",
    status: "/api/status",
    studioMessages: "/api/studio/messages",
  },
} as const;

export const isStudioPath = (pathname: string): boolean =>
  pathname === ROUTES.studio.root || pathname.startsWith(`${ROUTES.studio.root}/`);

/**
 * Post-login redirect target. Only same-origin /studio paths are accepted, so
 * `?next=` cannot be abused as an open redirect.
 */
export const safeStudioRedirect = (next: string | null | undefined): string => {
  if (!next || !next.startsWith(`${ROUTES.studio.root}/`) || next.startsWith("//") || next.includes("\\")) {
    return ROUTES.studio.dashboard;
  }
  if (next === ROUTES.studio.login) {
    return ROUTES.studio.dashboard;
  }
  return next;
};
