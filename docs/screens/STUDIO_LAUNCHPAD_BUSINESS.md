# Screen: Studio Launchpad (`/studio/release`), Business Spec

The site's launch controls: which portfolio sections are live, and whether the whole site is in maintenance.

## 1. Business purpose

- Hide a portfolio section without deleting its content. Example: switch Skills off, and the section, its navbar link and its footer link disappear from the public page.
- Switch the public site between live and maintenance (the same switch Content Forge shows).

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
