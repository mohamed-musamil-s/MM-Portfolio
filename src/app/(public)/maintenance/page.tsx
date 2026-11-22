import type { Metadata } from "next";
import { MaintenanceScreen } from "@/components/maintenance/MaintenanceScreen";
import { publicAssetExists } from "@/lib/server/assets";
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
  const { images, timeline } = content;

  return (
    <MaintenanceScreen
      content={content}
      windowText={`${formatDateUtc(timeline.windowStart)} → ${formatDateUtc(timeline.targetAt)}`}
      assets={{
        portrait: publicAssetExists(images.portrait.src),
        gridPlate: publicAssetExists(images.gridPlate.src),
        stamp: publicAssetExists(images.stamp.src),
      }}
    />
  );
}
