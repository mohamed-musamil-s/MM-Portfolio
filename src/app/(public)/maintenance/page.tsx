import type { Metadata } from "next";
import { MaintenanceScreen } from "@/components/maintenance/MaintenanceScreen";
import { getScreenContent } from "@/lib/server/content/screens";
import { formatDateUtc } from "@/lib/shared/format";

// Content is edited in the database; render on every request so changes show immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getScreenContent("maintenance");
  return { title: meta.title, description: meta.description };
}

export default async function MaintenancePage() {
  const content = await getScreenContent("maintenance");

  return (
    <MaintenanceScreen
      content={content}
      windowStartText={formatDateUtc(content.timeline.windowStart)}
      targetText={formatDateUtc(content.timeline.targetAt)}
    />
  );
}
