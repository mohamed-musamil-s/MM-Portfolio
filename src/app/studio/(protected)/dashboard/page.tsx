import type { Metadata } from "next";
import { MissionControl } from "@/components/studio/dashboard/MissionControl";
import { requireSession } from "@/lib/server/auth/guard";
import { listConversations } from "@/lib/server/contact/conversations";
import { getScreenContent, getScreenRecord } from "@/lib/server/content/screens";
import { isMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";
import { getSectionVisibility } from "@/lib/server/settings/section-visibility";
import { HOME_SECTIONS } from "@/lib/shared/content/home-sections";
import { ROUTES } from "@/lib/shared/routes";

/** How many of the latest conversations the dashboard lists. */
const RECENT = 5;

export async function generateMetadata(): Promise<Metadata> {
  const { modules } = await getScreenContent("studio-shell");
  return { title: modules.dashboard.title };
}

/** Mission Control, the studio dashboard (docs/screens/STUDIO_MISSION_CONTROL_BUSINESS.md). */
export default async function StudioDashboardPage() {
  await requireSession(ROUTES.studio.dashboard);
  const [shell, maintenance, sections, conversations, home] = await Promise.all([
    getScreenContent("studio-shell"),
    isMaintenanceEnabled({ fresh: true }),
    getSectionVisibility(),
    listConversations(),
    getScreenRecord("home"),
  ]);
  const open = conversations.filter((item) => item.status === "open");

  return (
    <MissionControl
      shell={shell}
      maintenance={maintenance}
      unread={open.filter((item) => item.unread).length}
      sectionsShowing={HOME_SECTIONS.filter((section) => sections.visible[section]).length}
      sectionsTotal={HOME_SECTIONS.length}
      content={{
        version: home.version,
        updatedAt: home.updatedAt.toISOString(),
        updatedBy: home.updatedBy,
      }}
      recent={open.slice(0, RECENT)}
    />
  );
}
