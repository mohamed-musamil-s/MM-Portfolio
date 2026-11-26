# Screen: Studio Mission Control (`/studio/dashboard`), Business Spec

The studio's dashboard: the state of the site at a glance, with shortcuts into the modules.

## 1. Business purpose

Open the studio and see at once:

- whether the site is live;
- how many messages are unread;
- how many sections are showing;
- when the content last changed.

Then jump straight to the right place.

## 2. Access and data

Admin session required. The data is read on the server: the maintenance flag, section visibility, the conversations (unread count and the five most recent) and the `home` content record (version, `updatedAt`, `updatedBy`).

## 3. Layout

Redesigned 2026-11-27 around what needs doing, not a menu of modules (the sidebar already is one).

- **Command banner:**
  - today's date, "Hello, {name}" (studio-shell `owner.name`);
  - a status line: "All clear", "1 thing needs a look" or "{n} things need a look" (the failing health checks);
  - quick actions: **Edit content** (Content Forge) and **Open the site** (new tab);
  - three status chips: Site (Live / Maintenance) and Sections showing link to Launchpad, Unread messages links to the Inbox.
- **Traffic, last 7 days** (two thirds wide): visitors and page views with the change against the previous 7 days, and the Pulse chart (smaller). Shows the data environment (Preview / Production data) and links to Pulse. Without analytics configured: "Connect Vercel Analytics…" and an Open Pulse button; on an API error, a short message.
- **Health check** (one third): a ring filling with the share of checks passed (`4/5`), the status line, and five checks, each linking to where it's fixed:
  - Site is live → Launchpad;
  - Every section is showing → Launchpad;
  - Analytics connected (Pulse returns data) → Pulse;
  - No unread messages → Inbox;
  - Content updated in the last 30 days (any portfolio page saved) → Content Forge.
- **Recent activity** (two thirds): content saves (from version history: who saved which page, at which version) and new messages, on one timeline, newest first, seven items. A save links to Launchpad (version history), a message opens it in the Inbox.
- **Recent messages** (one third): the four newest open conversations (initials, name, preview, time, unread dot), each opening in the Inbox, plus "View all".

## 4. Content (`site_screens/studio-shell`, `missionControl`)

The greeting, the attention lines (`attention`, `attentionOne`, `allClear`), stat chip labels, the quick-action labels (`shortcuts.content`, `shortcuts.site`), `traffic`, `checklist`, `activity`, the recent messages title and empty state, and "View all". Traffic labels come from `pulse`.

## 5. Motion and accessibility

- Studio motion rules apply: cards rise in once with a short stagger, and nothing loops.
- Each stat card and shortcut is a single link with a clear accessible name.
