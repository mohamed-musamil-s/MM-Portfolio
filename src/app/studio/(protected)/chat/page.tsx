import type { Metadata } from "next";
import { Inbox } from "@/components/studio/inbox/Inbox";
import { requireSession } from "@/lib/server/auth/guard";
import { listConversations } from "@/lib/server/contact/conversations";
import { getScreenContent } from "@/lib/server/content/screens";
import { ROUTES } from "@/lib/shared/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { modules } = await getScreenContent("studio-shell");
  return { title: modules.chat.title };
}

/** Inbox, the chat module: every contact-form conversation (docs/screens/STUDIO_INBOX_BUSINESS.md). */
export default async function StudioChatPage({ searchParams }: PageProps<"/studio/chat">) {
  await requireSession(ROUTES.studio.chat);
  const [shell, conversations, { open }] = await Promise.all([
    getScreenContent("studio-shell"),
    listConversations(),
    searchParams,
  ]);
  return (
    <Inbox
      copy={shell.inbox}
      title={shell.modules.chat.title}
      description={shell.modules.chat.description}
      initial={conversations}
      openId={typeof open === "string" ? open : undefined}
    />
  );
}
