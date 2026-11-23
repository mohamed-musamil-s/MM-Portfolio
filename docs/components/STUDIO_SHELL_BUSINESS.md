# Component: Studio Shell (Sidebar + Topbar), Business Spec

Version 1.4, 2026-11-23 (clean topbar with account menu). Screenshots: [desktop](studio-shell/desktop-1440x900.jpg), [account menu](studio-shell/desktop-account-menu-1440x900.jpg), [mobile](studio-shell/mobile-390x844.jpg). The frame around every signed-in studio page: a collapsible **side navigation** and a sticky **topbar**, with the page in the main slot. Design system: [ADMIN_STYLE.md](../ADMIN_STYLE.md) (shadcn/ui, studio tokens). `/studio/login` stays standalone.

## 1. Reference

`docs/reference/Admin Panel Design.mp4` (12 s, 720×1280, a light "FlowAI" admin panel). Inspected frame by frame (0–12 s, 2 s steps). What it shows and what we take:

| In the reference | In the studio shell |
| --- | --- |
| White sidebar with a hairline right border, light grey content area | `bg-card` sidebar, `border-border` hairline, `bg-background` main |
| Header row: app tile + name on the left, a panel-toggle icon on the right, same height as the topbar | 56px header: monogram tile + "Studio", collapse toggle on the right |
| Small muted group labels ("Workspaces", "Agent Managements") with a tiny icon | Two groups with muted 11px labels |
| Rows: 16px line icon + 13–14px label, ~36px tall, generous left padding | `h-9` rows, 16px MagicIcon, `text-sm` |
| Active row: soft grey pill, darker text and icon | Grey pill that **slides** between rows (`layoutId`), active icon in the accent |
| Hover: faint tint | `bg-muted/60` tint and the icon's hover animation |
| Topbar: thin, white, hairline bottom; left side shows a section icon and the page name ("Dashboard") | 56px sticky topbar: breadcrumb `Studio / <page>` with the page's icon |
| Topbar right side | Cropped out of the video. We place the **owner chip** there (avatar initials, name, role), the usual position for the signed-in user |
| Content fades / un-blurs in after navigation | Page content fades up 8px on route change |
| Bottom of the sidebar: secondary list and a usage card | **Sign out** row pinned to the bottom |

## 2. Routes and navigation

| Group | Key | Label (default) | Route | Icon |
| --- | --- | --- | --- | --- |
| Workspace | `dashboard` | Mission Control | `/studio/dashboard` | `dashboard` |
| Workspace | `release` | Launchpad | `/studio/release` | `release` |
| Workspace | `content` | Content Forge | `/studio/content` | `content` |
| Tools | `resume` | Resume Lab | `/studio/resume` | `resume` |
| Tools | `chat` | Inbox | `/studio/chat` | `chat` |
| Tools | `analytics` | Pulse | `/studio/analytics` | `analytics` |

- Module pages are **"Coming soon" placeholders** inside the shell, except Content Forge ([spec](CONTENT_FORGE_BUSINESS.md)).
- The active item is the one whose route matches the current path (or a sub-path of it).
- `/studio` redirects to `/studio/dashboard` (unchanged). `/studio/login` renders without the shell.

## 3. Behaviour

| Area | Rule |
| --- | --- |
| **Desktop (≥ 1024px)** | Sidebar is a fixed column: 256px expanded, 68px collapsed (icons only). Width animates (0.28s, `ease-print`). |
| **Collapse** | Toggle button in the sidebar header, or `Ctrl/⌘ + B`. The state is saved in the `studio_sidebar` cookie, so a reload (and the server render) keeps it with no flash. |
| **Collapsed** | Group labels become hairlines; labels hide; each icon shows its label in a tooltip on the right. Hovering the header swaps the logo tile for the expand button. |
| **Mobile (< 1024px)** | No sidebar column. The topbar shows a menu button that opens the same navigation in a left drawer (shadcn Sheet). Choosing an item closes the drawer. `Esc` and the overlay close it too. |
| **Active indicator** | One grey pill that slides to the active row. The active icon takes the accent colour and its "active" pose. |
| **Hover / focus** | Row tint; the icon plays its hover animation (grid spreads, tag swings, bars grow, chat dots bounce, door arrow slides out). Visible focus ring on keyboard focus. |
| **Sign out** | Bottom row. Calls `POST /api/auth/logout`, shows "Signing out…", then replaces the route with `/studio/login`. |
| **Topbar** | Sticky, 56px, `bg-card/80` with backdrop blur and a hairline. Left: menu button (mobile) and the breadcrumb `Studio / <current page>` with the page icon. Right: the owner chip. |
| **Owner chip** | Avatar with the owner's initials (accent gradient), the owner's name (`text-sm font-medium`) and role (`text-xs` muted). Below `sm` only the avatar shows; the name stays as its accessible label. |
| **Theme** | Light only (`data-studio-theme="light"` on the studio surface), matching the reference and the login. |
| **Reduced motion** | Width, pill and content changes happen without animation; icons don't animate. |

## 3b. Look and motion (v1.2)

Research (2026 SaaS dashboard write-ups) pointed to: a fixed, collapsible left sidebar (icons-only when narrow, a drawer on mobile), minimal chrome with colour reserved for meaning, motion that confirms an action, and interactive elements that stay perfectly stable on hover. The v1.2 design is original, built on those principles.

**Motion rule:** things animate only on **first load** and **in response to a click**. Hover is colour only (plus each icon's small hover pose). Nothing loops.

| Element | Look | First load | On click | On hover |
| --- | --- | --- | --- | --- |
| Canvas | Static porcelain `#F5F6F8` with a cool lavender wash top right, an ice wash bottom left, a faint dot grid in the corner | — | — | — |
| Sidebar | **Flush, full height, square edges**, white, right-edge hairline + soft shade; **248px / 68px** | Slides in from the left; rows cascade in (55ms stagger) | Collapse/expand: width springs | — |
| Brand | The MM. monogram on its own (no tile behind it), `Studio` + tagline `Admin console` | — | — | — |
| Row | 40px tall; **32px icon well with an 18px icon**; label 14px | — | Ripple from the pointer, 98% press, the edge accent bar slides to the row, the icon well pops (spring) | Band tint, well turns white with a hairline shadow, icon darkens and plays its hover pose |
| Active row | Tinted band, solid gradient well with a white icon, 4px gradient bar on the sidebar's left edge | — | — | — |
| Topbar | **Flush, full width**, 64px, white at 90% with blur, bottom hairline + shade | Slides down | The page name rolls over | — |
| Breadcrumb | One line: `group / page` (the group is hidden on phones) | — | — | — |
| Right side | Today's date with a calendar icon (viewer's locale, browser-only, from `md`), a divider, and the **account menu** | — | — | Account button tints |
| **Account menu** | Button: avatar (ink → blue, online dot), name, role, chevron. Menu (shadcn DropdownMenu): who is signed in, `View site ↗` (new tab), `Sign out` (red) | — | Opens with shadcn's zoom/fade; chevron flips | — |
| Page | — | — | Content fades and slides up after each navigation | — |
| **Menu search** | Field under the brand: search icon, placeholder, `Ctrl K` hint (× to clear when typing) | — | `Ctrl/⌘ + K` focuses it (expands a collapsed sidebar); typing filters the menu by label; Enter opens the first match; Esc clears; "No matching pages" when nothing matches | Field lightens |
| **Site status card** | Above Sign out: globe tile, "Public site", the real maintenance flag (amber dot `Maintenance mode` / green dot `Live`), and a `View site ↗` button (new tab). Collapsed: globe icon with a status dot and a tooltip | — | — | Button border/text turn accent |
| Placeholder | White card with a gradient top rule, icon tile in a dashed ring, badge, three preview rows | Staggered entrance (title, text, card, tile spins in, badge, rows) | — | — |
| Drawer, tooltips | shadcn Sheet / Tooltip | — | Enter/exit from `tw-animate-css` | — |

## 4. Content (database)

All shell text lives in `site_screens`, `_id: "studio-shell"` (schema `src/lib/shared/content/studio-shell-schema.ts`).

| Field | Default (seed) |
| --- | --- |
| `brand.name` / `brand.tagline` | `Studio` / `Admin console` |
| `owner.name` / `owner.role` | `Studio Owner` / `Owner` (the live database holds the real owner's name; the repository never does) |
| `breadcrumbRoot` | `Studio` |
| `groups[]` | `Workspace`: dashboard, release, content · `Tools`: resume, chat, analytics |
| `modules.<key>` | `label`, `title`, `description` for each module |
| `placeholder` | `badge` (`Coming soon`), `body` |
| `search` | `placeholder` (`Search menu`), `empty` (`No matching pages`), `shortcut` (`Ctrl K`), `clear` (`Clear search`) |
| `siteStatus` | `title` (`Public site`), `maintenance` (`Maintenance mode`), `live` (`Live`), `viewSite` (`View site`) |
| `actions` | `collapse`, `expand`, `openMenu`, `navigation` (drawer title), `signOut`, `signingOut`, `accountMenu`, `shortcut` |

## 5. Code layout

| Piece | Location |
| --- | --- |
| Shell layout (server) | `src/app/studio/(protected)/layout.tsx`: reads the content and the cookie, renders `<StudioShell>` |
| Shell + state | `src/components/studio/shell/StudioShell.tsx`, `sidebar-state.tsx` (context, cookie, shortcut) |
| Sidebar | `StudioSidebar.tsx` (desktop column + mobile Sheet), `SidebarNav.tsx` (groups, rows, active pill), `SignOutRow.tsx` |
| Topbar | `StudioTopbar.tsx`, `OwnerChip.tsx` |
| Navigation config | `nav.ts` (module keys → routes and icons), `use-active-module.ts` |
| Placeholder page body | `ModulePlaceholder.tsx` |
| Icons | New MagicIcons: `dashboard`, `release`, `content`, `resume`, `chat`, `analytics`, `logout`, `panel` |
| shadcn | `sheet`, `tooltip`, `button` (`src/components/studio/ui`) |

The old surface wrapper `StudioShell` (tokens, font, motion theme) is renamed `StudioSurface`.

## 6. Acceptance criteria

1. Every module route renders inside the shell; `/studio/login` doesn't.
2. The active row matches the URL; the pill slides when navigating.
3. Collapse/expand works by button and `Ctrl/⌘ + B`, survives a reload, and shows tooltips when collapsed.
4. Below 1024px the menu button opens a drawer with the same navigation; choosing a page closes it.
5. The topbar shows the breadcrumb and the owner's name from the database.
6. Sign out ends the session and lands on `/studio/login`; a protected page then redirects to login.
7. No horizontal scroll at 1440×900, 1024×768 or 375×812.
