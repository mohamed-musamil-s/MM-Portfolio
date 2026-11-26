# Module: Content Forge (Content Management), Business Spec

Version 1.5, 2026-11-23 (mobile: screen chips, Edit / Preview switch). Route `/studio/content`, inside the studio shell. Design system: [ADMIN_STYLE.md](../ADMIN_STYLE.md).

Content Forge edits the text of the **public portfolio site**. Every string, date and setting on those pages lives in MongoDB (`site_screens`), and this page is where the owner changes it without touching code.

## 1. Scope

| Listed                                                                                                                                                              | Not listed                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Portfolio screens (`PORTFOLIO_SCREENS` in `src/lib/shared/content/screens.ts`): `shared` (Shared content), `maintenance` (Maintenance page), `not-found` (404 page) | Studio screens (`studio-login`, `studio-shell`). Their copy stays in the database and the admin API, but they are not edited here |

**One value, one field.** Text that appears on more than one page is stored once in `shared` (schema `shared-schema.ts`) and each page reads it next to its own content. Today that is `footer.note`. When a new page repeats text another page already has, move it into `shared` instead of copying it.

New portfolio sections are added to `PORTFOLIO_SCREENS` once their schema exists; the editor builds their form automatically.

## 2. Layout: three columns

| Column                  | Content                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Left: screens**       | Site mode card (Live / Maintenance switch), then the screen list: icon, name, one-line description, amber dot for unsaved edits. A toggle hides the column down to an icon strip (names in tooltips, dots stay), like the side navigation.                                                                                                                                                                                                        |
| **Centre: fields**      | Screen header (name, `Version n`, `Saved {time} by {who}`, field search), section chips, one card per section, the save bar (`Discard`, `Save`, `Ctrl/⌘ S`). Screens with more than five sections (the home page) show them one at a time: the chips become tabs (each section, plus `All sections`), opening on the first; a tab with unsaved edits carries a dot; a field search always shows every match.                                      |
| **Right: live preview** | The real public page in a scaled frame, showing the current drafts (unsaved edits included) as you type. The stage fills the column top to bottom. Views: **Fit to panel** (default: the page renders 900px wide and as tall as the panel, so it fills the stage), **Desktop** (1440×900) and **Mobile** (390×844), centred and scaled to fit; plus `Open page ↗`. For **Shared content**, `Shown on` chips switch between the pages that use it. |

From 1280px wide the page is a **100vh workspace**: the three columns fill the viewport under the topbar and each scrolls on its own (the save bar stays at the bottom of the fields column). Below 1280 the fields and the preview share one column, with a sticky **Edit / Preview** switch on top (the Edit tab shows an amber dot when there are unsaved edits). Below 1024 (phones) the screens become a compact, sideways-scrolling row of chips (icon + name), the hide toggle is not shown (hiding is desktop-only), and **Fit to panel** renders the phone layout of the page.

### 2b. Preview and impact

- The frame loads `/preview/<slug>` (signed-in only, framable by the same origin only). It renders the real screen component in **preview mode**: the 404 countdown never redirects and the maintenance page never polls `/api/status`.
- The editor sends drafts to the frame with `postMessage` (shape in `src/lib/shared/content/preview-protocol.ts`; both sides check origin and shape). The frame validates the draft with the screen's schema. If it doesn't pass (for example an empty required field), the last valid version stays and the panel says `Fix the highlighted fields to update the preview.`
- **Impact:** clicking into a field outlines every place its text appears on the page (blue outline) and the panel says `Status › Kicker: Shown in 1 place on this page`. Text that never appears on the page (browser tab title, search description, screen-reader text) says so instead. Dates are matched as the page prints them.

## 3. Fields

The form is generated from the stored content, so it always matches the schema.

**Field tile:** every field sits in a soft grey tile with a small type icon and its label on top. While typing, the tile turns white with an accent border and a soft ring, and the icon and label take the accent colour. An invalid field turns red with an alert icon and a message under it. An edited field gets an amber left edge, an `Edited` tag and an undo button that restores the saved value. Hover only changes colour.

**Section card:** a letter tile, the section name, a field count (`1 field` / `{n} fields`) and an `Edited` tag when anything inside changed.

| Value                                        | Editor                                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Short text                                   | Input with a character count                                                                  |
| Long or multi-line text (over 70 characters) | Textarea                                                                                      |
| ISO date                                     | Date-time picker, in UTC                                                                      |
| Number                                       | Number input                                                                                  |
| On / off                                     | Switch                                                                                        |
| List of text                                 | Numbered rows in one tile, × to remove, `+ Add item`                                          |
| List of groups                               | A card per item (`Item n`), × to remove, `+ Add item` (copies the last item's shape, emptied) |
| Group                                        | Titled panel with its fields in two columns                                                   |

## 4. Saving

- `PUT /api/studio/screens/<slug>` with `{content, version}`.
- **Success:** new version shown, toast `Saved`, the server data refreshes. The public page shows the change on the next request.
- **Invalid (400):** each bad field is outlined and gets a plain message (`This field can't be empty.`, `Too long: keep it under {max} characters.`, `Too short: use at least {min} characters.`); a toast says to fix the highlighted fields.
- **Version conflict (409):** someone saved in the meantime. A banner offers `Reload`, which loads the newer version (local edits are dropped).
- **Other failure:** toast `Couldn't save`.
- `Discard` restores the last saved content.

## 5. Content (database)

All copy is in `site_screens/studio-shell` under `editor` (schema `studio-shell-schema.ts`): titles, button labels, status lines, validation messages, site-mode text and `screens.<slug>.{name, description}`.

## 6. Code

| Piece              | Location                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Page (server)      | `src/app/studio/(protected)/content/page.tsx`                                                           |
| Editor             | `src/components/studio/content/ContentEditor.tsx`                                                       |
| Field renderer     | `ContentField.tsx` (recursive)                                                                          |
| Site mode          | `SiteModeCard.tsx`                                                                                      |
| Live preview panel | `PreviewPanel.tsx`                                                                                      |
| Preview page       | `src/app/(public)/preview/[slug]/page.tsx`, `src/components/public/LivePreview.tsx`, `preview-mode.tsx` |
| Helpers            | `content-paths.ts` (labels, paths, immutable set, dates, search)                                        |

## 7. Acceptance criteria

1. Only portfolio screens are listed.
2. Editing a field and saving updates the public page; the version goes up.
3. An empty required field blocks the save and shows a message on that field.
4. A stale version shows the conflict banner; Reload brings in the newer content.
5. Unsaved screens show a dot; Discard restores them.
6. No horizontal scroll at 1440×900 or 375×812.
