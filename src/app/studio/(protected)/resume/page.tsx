import type { Metadata } from "next";
import { requireSession } from "@/lib/server/auth/guard";
import { ROUTES } from "@/lib/shared/routes";
import { ComingSoon } from "@/components/studio/coming-soon";

export const metadata: Metadata = { title: "Resume" };

export default async function StudioResumePage() {
  await requireSession(ROUTES.studio.resume);
  return <ComingSoon title="Resume" />;
}
