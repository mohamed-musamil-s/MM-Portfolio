import { listConversations } from "@/lib/server/contact/conversations";
import { ok } from "@/lib/server/http/responses";
import { withStudioApi } from "@/lib/server/http/with-api";

/**
 * GET /api/studio/messages -> { conversations: ConversationSummary[] }
 * Contact-form conversations, newest first (docs/features/CONTACT_MESSAGES.md).
 * Admin session required. Backend for the studio's chat module.
 */
export const GET = withStudioApi(async () => {
  const conversations = await listConversations();
  return ok({ conversations, unread: conversations.filter((item) => item.unread).length });
});
