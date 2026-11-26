import type { Metadata } from "next";
import { Launchpad } from "@/components/studio/launchpad/Launchpad";
import { requireSession } from "@/lib/server/auth/guard";
import { getScreenContent, getScreenRecord } from "@/lib/server/content/screens";
import { listVersions } from "@/lib/server/content/versions";
import { PORTFOLIO_SCREENS } from "@/lib/shared/content/screens";
import { isMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";
import { getSectionVisibility } from "@/lib/server/settings/section-visibility";
import { ROUTES } from "@/lib/shared/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { modules } = await getScreenContent("studio-shell");
  return { title: modules.release.title };
}

/** Launchpad: section visibility and site mode (docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md). */
export default async function StudioReleasePage() {
  await requireSession(ROUTES.studio.release);
  const [shell, sections, maintenance, home] = await Promise.all([
    getScreenContent("studio-shell"),
    getSectionVisibility(),
    isMaintenanceEnabled({ fresh: true }),
    getScreenRecord("home"),
  ]);
  const homeVersions = await listVersions("home", home.content);
  return (
    <Launchpad
      shell={shell}
      initial={sections.visible}
      updatedAt={sections.updatedAt?.toISOString() ?? null}
      updatedBy={sections.updatedBy}
      maintenance={maintenance}
      history={{
        screens: PORTFOLIO_SCREENS.map((slug) => ({ slug, name: shell.editor.screens[slug]?.name ?? slug })),
        initialSlug: "home",
        initial: { current: home.version, versions: homeVersions },
      }}
    />
  );
}
