import type { ConversationSummary } from "./contact-schema";

/** What the studio's topbar bell shows: the unread count and the newest unread conversations. */
export type InboxSnapshot = { unread: number; recent: ConversationSummary[] };

const SHOWN = 5;

/** Unread, not archived, newest first: what the bell counts. */
export const toSnapshot = (items: ConversationSummary[]): InboxSnapshot => {
  const unread = items.filter((item) => item.unread && item.status === "open");
  return { unread: unread.length, recent: unread.slice(0, SHOWN) };
};

/** Fired in the studio whenever a conversation changes (read, unread, archived), so the topbar bell can refresh. */
export const INBOX_CHANGED = "studio:inbox-changed";

export const announceInboxChange = () => window.dispatchEvent(new Event(INBOX_CHANGED));
