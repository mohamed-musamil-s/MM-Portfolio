import type { Metadata } from "next";
import { requireSession } from "@/lib/server/auth/guard";
import { ROUTES } from "@/lib/shared/routes";
import { ComingSoon } from "@/components/studio/coming-soon";

export const metadata: Metadata = { title: "Chat" };

export default async function StudioChatPage() {
  await requireSession(ROUTES.studio.chat);
  return <ComingSoon title="Chat" />;
}
