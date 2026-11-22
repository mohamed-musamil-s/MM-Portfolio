import type { Metadata } from "next";
import { requireSession } from "@/lib/server/auth/guard";
import { ROUTES } from "@/lib/shared/routes";
import { ComingSoon } from "@/components/studio/coming-soon";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StudioDashboardPage() {
  await requireSession(ROUTES.studio.dashboard);
  return <ComingSoon title="Dashboard" />;
}
