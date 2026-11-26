# Screen: Studio Inbox (`/studio/chat`), Business Spec

The studio's chat module ("Inbox" in the navigation). It shows every message sent through the portfolio's contact form ([feature](../features/CONTACT_MESSAGES.md)).

## 1. Business purpose

- One place to read every contact-form conversation, newest first.
- Track what has been read, and archive what is done.
- Answer by email for now. Replies from inside the studio come later: the data model already keeps owner messages in the thread.

## 2. Access

Admin session required (server guard, `requireSession`). The data comes from `GET /api/studio/messages` and `GET`/`PATCH /api/studio/messages/:id` (session, same-origin).

## 3. Layout

- **Page header:** module title and description (studio-shell `modules.chat`), plus the unread count.
- **Two panes (lg and up):** the conversation list on the left, the open conversation on the right. **Phones:** the list, then the conversation full width with a back button.
- **List:** a search field (name, email, topic, message); filter tabs All / Unread / Archived with counts. Each row shows an initials avatar, the name, the topic, a one-line preview and a relative time. Unread rows are bold and carry a dot.
- **Conversation:** the visitor's name and email, topic, received time, and the page it was sent from. The thread shows visitor messages on the left and owner messages on the right. Actions:
  - **Mark unread / read.**
  - **Archive / Restore.**
  - **Reply by email:** a `mailto:` link to the visitor with "Re: {topic}". A note says replies from the studio are coming.
- Opening an unread conversation marks it read.

## 4. Content (`site_screens/studio-shell`, `inbox`)

The search placeholder, filter labels, empty states, action labels, the reply note and the toasts.

## 5. Motion and accessibility

- Studio motion rules apply (ADMIN_STYLE §6b): the panes fade and slide in once, and a row selection changes state without looping.
- The list is a listbox-like set of buttons with `aria-current` on the open one. Every action is a labelled button, and icon-only buttons have tooltips.

## 6. Failure behaviour

- If loading or updating a conversation fails, a toast appears and the state rolls back.
- An empty inbox and an empty filter each have their own message.

## 7. Topbar bell

A bell in the studio topbar, on every studio page, left of the account menu.

- **Badge:** the number of unread conversations that are not archived (`9+` above nine). No badge when there are none. The button's accessible name says the count ("Messages, 2 unread").
- **Menu:** a header with "Messages" and "{n} new", then the five newest unread conversations (initials, name, time, topic, a two-line preview). Clicking one opens it in the Inbox (`/studio/chat?open=<id>`), which marks it read. Below: "Open Inbox". With nothing unread: "You're all caught up."
- **Freshness:** the first count comes from the server with the page. After that the bell re-reads `GET /api/studio/messages` after each page change, when the window regains focus, when the Inbox marks, archives or restores a conversation, and once a minute while the tab is visible.
- **Motion:** when the count goes up, the bell swings once (not with reduced motion); the badge pops in. Nothing loops.
- **Copy:** `inbox.bell` (`label`, `title`, `count`, `empty`, `viewAll`).
