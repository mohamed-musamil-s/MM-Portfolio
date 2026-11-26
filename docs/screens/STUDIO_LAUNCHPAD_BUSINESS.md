# Screen: Studio Launchpad (`/studio/release`), Business Spec

The site's launch controls: which portfolio sections are live, whether the whole site is in maintenance, and the version history of every page's content (roll back).

## 1. Business purpose

- Hide a portfolio section without deleting its content. Example: switch Skills off, and the section, its navbar link and its footer link disappear from the public page.
- Switch the public site between live and maintenance (the same switch Content Forge shows).
- Version control: see every saved version of a page's content (who, when, which sections differ from now) and restore one.

## 2. Access and data

- Admin session required.
- **Section visibility:** `site_settings`, `_id: "sections"`, `{ visible: { about, experience, education, skills, work, recognition, contact: boolean }, updatedAt, updatedBy }`. A missing document or key means visible.
- **API:** `GET /api/studio/settings/sections` returns `{ visible, updatedAt, updatedBy }`. `PUT` takes `{ visible: { <section>: boolean } }` (any subset), with a session and same-origin JSON.
- **Public page:** `/` reads the setting on every request. It skips hidden sections and drops `#<section>` links from `nav.links` and `footer.links`. The hero and footer are always shown.

## 3. Layout

- **Page header:** module title and description (studio-shell `modules.release`).
- **Site mode card:** the live / maintenance switch.
- **Sections card:** one row per section with its number, name, a short description and a switch, labelled Visible or Hidden. It also shows the count of visible sections and the last change (when and by whom).

## 4. Content (`site_screens/studio-shell`, `launchpad`)

Card titles and hints, the name and description of each section, the visible and hidden labels, and the toasts.

## 5. Behaviour

- **Saving:** a switch saves immediately (optimistic), with a success toast. On failure the switch rolls back and an error toast appears.
- **Accessibility:** every switch has an accessible name ("Show {section}"), and the state is shown as both words and colour.

## 6. Version history

- **What is kept:** every save of a database-managed screen keeps a copy of the content at its version, in `site_screen_versions` (`{ slug, version, content, savedAt, savedBy }`, unique on `slug` + `version`). The save also keeps the version it replaced, so the first save after history started can still be undone. The newest 50 versions per screen are kept. A failed copy never fails the save.
- **API:**
  - `GET /api/studio/screens/:slug/versions` returns `{ current, versions: [{ version, savedAt, savedBy, changed }] }`. `changed` lists the top-level sections that differ from the current content, compared through today's content model, so key order and dropped old keys don't count.
  - `POST /api/studio/screens/:slug/versions/:version` takes `{ expectedVersion }`. It saves the old content as a new version (409 if the page changed meanwhile, 422 if the old version no longer fits the content model).
- **Layout:**
  - A card under the sections, with tabs for the portfolio screens (Shared content, Name splash, Home, Maintenance page, 404 page).
  - One row per version: the version badge (the current one in blue), "{time} by {who}", the sections it differs in, and Restore.
  - Restore asks for a second click ("Confirm restore") within 4 seconds, then toasts "Restored version {n} as version {m}".
- **Content:** `launchpad.versions` in studio-shell.
