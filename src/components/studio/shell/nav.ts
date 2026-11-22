import type { IconName } from "@/components/ui/MagicIcon";
import type { StudioModule } from "@/lib/shared/content/studio-shell-schema";
import { ROUTES } from "@/lib/shared/routes";

/** Where each studio module lives and which MagicIcon represents it. Labels come from the database. */
export const MODULE_ROUTES: Record<StudioModule, string> = {
  dashboard: ROUTES.studio.dashboard,
  release: ROUTES.studio.release,
  content: ROUTES.studio.content,
  resume: ROUTES.studio.resume,
  chat: ROUTES.studio.chat,
  analytics: ROUTES.studio.analytics,
};

export const MODULE_ICONS: Record<StudioModule, IconName> = {
  dashboard: "dashboard",
  release: "release",
  content: "content",
  resume: "resume",
  chat: "chat",
  analytics: "analytics",
};

/** The module whose route is the path or one of its parents, if any. */
export const moduleForPath = (pathname: string): StudioModule | null => {
  const match = (Object.entries(MODULE_ROUTES) as [StudioModule, string][]).find(
    ([, route]) => pathname === route || pathname.startsWith(`${route}/`),
  );
  return match ? match[0] : null;
};
