# Component: Studio Shell (Sidebar + Topbar), Business Spec

Version 1.1, 2026-11-23 (modern glass redesign, everything animates). Screenshots: [desktop](studio-shell/desktop-1440x900.jpg), [mobile drawer](studio-shell/mobile-drawer-390x844.jpg). The frame around every signed-in studio page: a collapsible **side navigation** and a sticky **topbar**, with the page in the main slot. Design system: [ADMIN_STYLE.md](../ADMIN_STYLE.md) (shadcn/ui, studio tokens). `/studio/login` stays standalone.

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
| Workspace | `dashboard` | Dashboard | `/studio/dashboard` | `dashboard` |
| Workspace | `release` | Release Version | `/studio/release` | `release` |
| Workspace | `content` | Content Management | `/studio/content` | `content` |
| Tools | `resume` | Resume Generator | `/studio/resume` | `resume` |
| Tools | `chat` | Chats | `/studio/chat` | `chat` |
| Tools | `analytics` | Analytics | `/studio/analytics` | `analytics` |

- Every module page stays a **"Coming soon" placeholder** inside the shell. No module internals are built.
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

## 3b. Look and motion (v1.1)

| Element | Look | Animation |
| --- | --- | --- |
| Canvas | Light only: cool lavender base (`#F3F5FC`) with periwinkle, sky and lavender light fields and a faint dot grid | Light fields drift on 26–34s loops |
| Sidebar | Floating frosted-glass panel (`m-3`, `rounded-2xl`, `bg-card/70`, blur, soft indigo shadow); 260px / 72px | Width springs on collapse; gradient logo tile springs in and tilts on hover; brand name slides in; rows cascade in (50ms stagger); group labels swap with hairlines |
| Active row | Blue → indigo gradient pill, white text and icon, coloured shadow | Pill springs between rows (`layoutId`); a light sweep crosses it every few seconds |
| Hover | Glass highlight (`bg-card/80`, hairline) | One highlight glides from row to row; the icon scales and tilts and plays its own hover pose; the label nudges right |
| Press | — | Rows press to 97% |
| Sign out | Red-tinted highlight on hover | Door arrow slides out; label switches to "Signing out…" |
| Topbar | Floating glass bar (`rounded-2xl`, `h-16`) | Drops in on load; the page name and its icon tile roll over (slide + blur) when the page changes |
| Owner chip | Initials avatar inside a rotating cyan → blue → indigo ring, green live dot | Ring turns (6s); dot pings; chip lifts on hover |
| Page change | — | Content blurs, fades and slides in (0.5s) |
| Placeholder | Card with a flowing gradient border; icon tile in an orbiting dashed ring; shimmering badge; three pulsing preview rows | Tile springs in then floats; ring orbits; rows cascade in |
| Drawer, tooltips | shadcn Sheet / Tooltip | Enter/exit animations from `tw-animate-css` (slide, fade, zoom) |

## 4. Content (database)

All shell text lives in `site_screens`, `_id: "studio-shell"` (schema `src/lib/shared/content/studio-shell-schema.ts`).

| Field | Default (seed) |
| --- | --- |
| `brand.name` | `Studio` |
| `owner.name` / `owner.role` | `Studio Owner` / `Owner` (the live database holds the real owner's name; the repository never does) |
| `breadcrumbRoot` | `Studio` |
| `groups[]` | `Workspace`: dashboard, release, content · `Tools`: resume, chat, analytics |
| `modules.<key>` | `label`, `title`, `description` for each module |
| `placeholder` | `badge` (`Coming soon`), `body` |
| `actions` | `collapse`, `expand`, `openMenu`, `navigation` (drawer title), `signOut`, `signingOut`, `shortcut` |

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
