import type { Metadata } from "next";
import { ContentEditor, type EditableScreen } from "@/components/studio/content/ContentEditor";
import { requireSession } from "@/lib/server/auth/guard";
import { getScreenContent, getScreenRecord } from "@/lib/server/content/screens";
import { isMaintenanceEnabled } from "@/lib/server/settings/maintenance-flag";
import { PORTFOLIO_SCREENS } from "@/lib/shared/content/screens";
import { ROUTES } from "@/lib/shared/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { modules } = await getScreenContent("studio-shell");
  return { title: modules.content.title };
}

/** Plain JSON for the client editor (dates become ISO strings). */
const toJson = <T,>(value: T): EditableScreen["content"] => JSON.parse(JSON.stringify(value));

/** Content Forge: edit the portfolio site's database-managed screens (docs/components/CONTENT_FORGE_BUSINESS.md). */
export default async function StudioContentPage() {
  await requireSession(ROUTES.studio.content);
  const [shell, maintenance, records] = await Promise.all([
    getScreenContent("studio-shell"),
    isMaintenanceEnabled({ fresh: true }),
    Promise.all(PORTFOLIO_SCREENS.map(async (slug) => ({ slug, record: await getScreenRecord(slug) }))),
  ]);

  const screens: EditableScreen[] = records.map(({ slug, record }) => ({
    slug,
    content: toJson(record.content),
    version: record.version,
    updatedAt: record.updatedAt.toISOString(),
    updatedBy: record.updatedBy,
  }));

  return <ContentEditor shell={shell} screens={screens} maintenance={maintenance} />;
}
