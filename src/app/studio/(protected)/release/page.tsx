import type { Metadata } from "next";
import { requireSession } from "@/lib/server/auth/guard";
import { ROUTES } from "@/lib/shared/routes";
import { ComingSoon } from "@/components/studio/coming-soon";

export const metadata: Metadata = { title: "Release" };

export default async function StudioReleasePage() {
  await requireSession(ROUTES.studio.release);
  return <ComingSoon title="Release" />;
}
