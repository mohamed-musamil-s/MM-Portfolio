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
/** Launchpad: site mode, section visibility and version history (docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md). */
export default async function StudioReleasePage() {
  await requireSession(ROUTES.studio.release);
  const [shell, sections, maintenance, records] = await Promise.all([
    getScreenContent("studio-shell"),
    getSectionVisibility(),
    isMaintenanceEnabled({ fresh: true }),
    Promise.all(PORTFOLIO_SCREENS.map(async (slug) => ({ slug, record: await getScreenRecord(slug) }))),
  ]);
  const home = records.find((item) => item.slug === "home")?.record ?? (await getScreenRecord("home"));
  const homeVersions = await listVersions("home", home.content);
  const nameOf = (slug: string) => shell.editor.screens[slug]?.name ?? slug;
  // The most recent save across the portfolio's pages.
  const latest = records.toSorted((a, b) => b.record.updatedAt.getTime() - a.record.updatedAt.getTime())[0];
  return (
    <Launchpad
      shell={shell}
      initial={sections.visible}
      updatedAt={sections.updatedAt?.toISOString() ?? null}
      updatedBy={sections.updatedBy}
      maintenance={maintenance}
      lastSave={
        latest
          ? {
              screen: nameOf(latest.slug),
              version: latest.record.version,
              at: latest.record.updatedAt.toISOString(),
              by: latest.record.updatedBy,
            }
          : null
      }
      history={{
        screens: records.map(({ slug, record }) => ({ slug, name: nameOf(slug), version: record.version })),
        initialSlug: "home",
        initial: { current: home.version, versions: homeVersions },
      }}
    />
  );
}
