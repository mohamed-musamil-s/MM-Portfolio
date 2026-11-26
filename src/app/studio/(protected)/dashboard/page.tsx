import type { Metadata } from "next";
import { MissionControl, type Activity } from "@/components/studio/dashboard/MissionControl";
import { getPulse } from "@/lib/server/analytics/vercel-analytics";
import { requireSession } from "@/lib/server/auth/guard";
import { listConversations } from "@/lib/server/contact/conversations";
import { getScreenContent, getScreenRecord } from "@/lib/server/content/screens";
import { listRecentSaves } from "@/lib/server/content/versions";
import { isMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";
import { getSectionVisibility } from "@/lib/server/settings/section-visibility";
import { HOME_SECTIONS } from "@/lib/shared/content/home-sections";
import { PORTFOLIO_SCREENS } from "@/lib/shared/content/screens";
import { ROUTES } from "@/lib/shared/routes";

/** How many of the latest conversations and activity items the dashboard lists. */
const RECENT = 4;
const ACTIVITY = 7;
/** Content counts as fresh when a portfolio page was saved within this window. */
const FRESH_MS = 30 * 86_400_000;
const savedRecently = (time: number) => Date.now() - time < FRESH_MS;

export async function generateMetadata(): Promise<Metadata> {
  const { modules } = await getScreenContent("studio-shell");
  return { title: modules.dashboard.title };
}

/** Mission Control, the studio dashboard (docs/screens/STUDIO_MISSION_CONTROL_BUSINESS.md). */
export default async function StudioDashboardPage() {
  await requireSession(ROUTES.studio.dashboard);
  const [shell, maintenance, sections, conversations, records, traffic, saves] = await Promise.all([
    getScreenContent("studio-shell"),
    isMaintenanceEnabled({ fresh: true }),
    getSectionVisibility(),
    listConversations(),
    Promise.all(PORTFOLIO_SCREENS.map((slug) => getScreenRecord(slug))),
    getPulse(7),
    listRecentSaves(PORTFOLIO_SCREENS, ACTIVITY),
  ]);
  const open = conversations.filter((item) => item.status === "open");
  const unread = open.filter((item) => item.unread).length;
  const sectionsShowing = HOME_SECTIONS.filter((section) => sections.visible[section]).length;
  const lastSaved = Math.max(0, ...records.map((record) => record.updatedAt.getTime()));
  const nameOf = (slug: string) => shell.editor.screens[slug]?.name ?? slug;

  // Content saves and new messages on one timeline, newest first.
  const activity: Activity[] = [
    ...saves.map((save) => ({
      kind: "save" as const,
      at: save.savedAt,
      who: save.savedBy,
      screen: nameOf(save.slug),
      version: save.version,
    })),
    ...conversations.map((item) => ({ kind: "message" as const, at: item.createdAt, name: item.name, id: item.id })),
  ]
    .toSorted((a, b) => b.at.localeCompare(a.at))
    .slice(0, ACTIVITY);

  return (
    <MissionControl
      shell={shell}
      maintenance={maintenance}
      unread={unread}
      sectionsShowing={sectionsShowing}
      sectionsTotal={HOME_SECTIONS.length}
      traffic={traffic}
      checks={{
        live: !maintenance,
        sections: sectionsShowing === HOME_SECTIONS.length,
        analytics: traffic.status === "ok",
        inbox: unread === 0,
        fresh: savedRecently(lastSaved),
      }}
      activity={activity}
      recent={open.slice(0, RECENT)}
    />
  );
}
