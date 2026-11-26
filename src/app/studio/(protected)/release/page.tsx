import type { Metadata } from "next";
import { Launchpad } from "@/components/studio/launchpad/Launchpad";
import { requireSession } from "@/lib/server/auth/guard";
import { getScreenContent } from "@/lib/server/content/screens";
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
  const [shell, sections, maintenance] = await Promise.all([
    getScreenContent("studio-shell"),
    getSectionVisibility(),
    isMaintenanceEnabled({ fresh: true }),
  ]);
  return (
    <Launchpad
      shell={shell}
      initial={sections.visible}
      updatedAt={sections.updatedAt?.toISOString() ?? null}
      updatedBy={sections.updatedBy}
      maintenance={maintenance}
    />
  );
}
