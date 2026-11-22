import type { Metadata } from "next";
import { requireSession } from "@/lib/server/auth/guard";
import { ROUTES } from "@/lib/shared/routes";
import { ComingSoon } from "@/components/studio/coming-soon";

export const metadata: Metadata = { title: "Analytics" };

export default async function StudioAnalyticsPage() {
  await requireSession(ROUTES.studio.analytics);
  return <ComingSoon title="Analytics" />;
}
