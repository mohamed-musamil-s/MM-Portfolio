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

- **Greeting:** "Hello, {name}" (from studio-shell `owner.name`) and a one-line summary.
- **Stat cards (four):**
  - **Site:** Live or Maintenance, linking to Launchpad.
  - **Unread messages:** the count, linking to the Inbox.
  - **Sections showing:** "{n} of {total}", linking to Launchpad.
  - **Content:** the last saved time and who saved it, linking to Content Forge.
- **Shortcuts grid:**
  - **Built modules:** open the site (new tab), edit content, Inbox and Launchpad.
  - **Coming next:** Resume Lab and Pulse, with a "Soon" badge.
- **Recent messages:** the last five conversations (name, topic, preview, time, unread dot), each linking into the Inbox, plus a "View all" link.

## 4. Content (`site_screens/studio-shell`, `missionControl`)

The greeting, summary, stat labels and hints, shortcut labels and descriptions, the recent messages title and empty state, "View all" and "Soon".

## 5. Motion and accessibility

- Studio motion rules apply: cards rise in once with a short stagger, and nothing loops.
- Each stat card and shortcut is a single link with a clear accessible name.
