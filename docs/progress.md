# Progress

## 2026-11-22: Foundation

Done:

- [x] Linked the GitHub repo `mohamed-musamil-s/MM-Portfolio` as `origin`
- [x] Set up Next.js 16.4 + TypeScript (App Router, `src/`, ESLint, no Tailwind)
- [x] MongoDB Atlas client for database `mm-portfolio`, with connection-state logging and indexes
- [x] Database-backed sessions: signed `HttpOnly` / `Secure` / `SameSite=Strict` cookie, timing-safe credential check
- [x] Brute-force lockout on login (per IP and global)
- [x] `/studio/**` protected in two layers: proxy (302) and a server guard
- [x] `/studio/login` page: functional and unstyled, as requested
- [x] Placeholder routes: `/maintenance`, `/404`, studio modules
- [x] Unknown routes redirect with 302 to `/404`
- [x] Centralized pino logging, `withApi` wrapper, standard response helpers, `onRequestError` sink
- [x] Docs: architecture, auth-security, logging, features, progress

Verified against a production build (`next start`), without a database:

| Request | Result |
| --- | --- |
| `/` | 302 to `/maintenance` |
| `/maintenance` | 200 |
| `/404` | 404 |
| `/does/not/exist` | 302 to `/404` |
| `/studio`, `/studio/dashboard`, `/studio/unknown` | 302 to `/studio/login?next=...` |
| a forged cookie | 302 to login, cookie cleared |
| `/studio/login` | 200 |
| `/api/nope` | JSON 404 |
| cross-origin login | 403 |
| login and health with no `MONGODB_URI` | logged 500 with `requestId` |

## 2026-11-22: Verified against MongoDB Atlas

The Atlas database already had `sessions` and `auth_attempts` collections. Their TTL indexes are named `session_ttl` and `attempt_ttl`, so `db/indexes.ts` now uses those names; a different name for the same index makes MongoDB raise `IndexOptionsConflict`. No existing data or indexes were changed. The `users` and `user` collections are not used by this app.

Verified with a production build (`next start`) connected to Atlas:

| Check | Result |
| --- | --- |
| `GET /api/health` | 200, database up |
| Boot logs | connecting, connected, server state changes, indexes ensured |
| Wrong code, wrong email | 401 |
| Empty body | 400 |
| 5 failures from one IP | locked; correct credentials then get 429 with `Retry-After: 900` |
| Correct login | 200; cookie is `Secure; HttpOnly; SameSite=strict`, expires in 12 h |
| Session row in `sessions` | stores only the token hash |
| All 6 studio pages with the session | 200 |
| `/studio` | 302 to `/studio/dashboard` |
| `/studio/login` while signed in | redirect to dashboard |
| Logout | 200; cookie cleared, row deleted |
| Old cookie after logout | rejected by the server guard, redirect to login |
| Browser: login form, then `?next=` target, then sign out | works |
| Server errors during the run | none |

## 2026-11-22: Public design system spec

- [x] `docs/STYLE.md` written from the `Gemini_MM.png` poster. It covers the public portfolio only.
- Colors measured from the poster: the paper is `#F7F5E9`, the ink is pure black. The brief's tokens (`#F4F3EE` paper, `#0A0A0A` ink) are kept, and every text pairing reaches WCAG AAA (at least 11:1).
- Display font is Inter Tight, not a condensed face, because the poster's headline is a regular-width grotesque. The "Musamil" wordmark will be a traced SVG asset.
- Nothing is implemented in CSS or components yet. The `/studio` design system (`ADMIN_STYLE.md`) is still to be defined.

## 2026-11-22: Tailwind CSS adopted

- [x] Installed Tailwind CSS 4.3, plus `tailwind-variants`, `tailwind-merge`, `clsx`, Prettier and `prettier-plugin-tailwindcss`.
- [x] `src/app/globals.css` holds the public tokens from STYLE.md. They are scoped to `[data-surface="public"]`, and Tailwind's default palette is turned off.
- [x] `cn()` helper added.
- [x] STYLE.md rewritten so every rule names its Tailwind classes. All 40 classes the spec uses were checked to compile with Tailwind 4.3.
- [x] ADMIN_STYLE.md records the Tailwind decision.
- Side effect: Tailwind's reset (Preflight) now removes the browser's default heading sizes and margins, so the current unstyled placeholder pages look plainer. No page uses the design tokens yet.

## 2026-11-22: Animation engine and core UI primitives

- [x] Installed the motion stack: `motion`, `gsap` + `@gsap/react`, `lenis`, `animejs`, `three` + `@react-three/fiber` + `@react-three/drei`, and `radix-ui`. GSAP is free but uses its own license, not an open-source one.
- [x] `src/lib/motion` holds the motion tokens (portfolio and studio), the pure action state machine, and the GSAP and anime.js setup.
- [x] `src/hooks` holds the shared hooks: `useMotionTheme`, `useActionRunner`, `useMagnetic` and `useParallax`.
- [x] `src/components/ui` holds `MotionProvider`, `MagicIcon` (6 icons, 6 states) and `ActionButton` (6 methods, 2 variants).
- [x] Provisional studio tokens added to `globals.css` and ADMIN_STYLE.md, so the studio variant works.
- [x] STYLE.md §6.1 and §7 updated: buttons are `ActionButton`, and the motion rules now allow parallax, Lenis, springs and the WebGL canvas, with guardrails.
- [x] Checked both themes in the in-app browser on a temporary page, since removed. See ANIMATION_UI.md §13 for what was and wasn't verified.
- Not built yet: the WebGL halftone canvas and kinetic typography, which wait for the public pages. None of the new components is mounted on a real page yet.

## 2026-11-22: `/maintenance` screen

- [x] Business spec at `docs/screens/MAINTENANCE_BUSINESS.md`.
- [x] **All content is in the database:** the new `site_screens` collection holds the `maintenance` document, validated by a zod schema.
  - It's seeded with `npm run seed:screens`.
  - The admin API (`GET`/`PUT /api/studio/screens/:slug`) requires a session, and saves use a version check.
  - The admin UI comes later.
- [x] Page structure: the `(public)` route group with `PublicShell` (fonts, surface, MotionProvider with Lenis, grain).
- [x] New reusable pieces:
  - motion components: InkReveal, InkRule, ParallaxLayer, CalibrationRig, RegistrationMark, XMark, CropMarks;
  - hooks: useCountdown, usePointerParallax;
  - a new MagicIcon icon, `calibrate`.
- [x] Image paths come from the database. Each file is checked on every request, with SVG or halftone fallbacks until it exists.
- [x] Checked in the browser on a production build, at desktop 1440×900 and mobile 375×812:
  - layout and motion;
  - the countdown ticks, and its screen-reader label reads correctly;
  - no horizontal overflow on mobile.
- [x] Admin API checked: 401, 404, 200 (edit appears on the page), 409, 400 (with the failing fields), 403. The original content was restored afterwards.
- Not verified: the reduced-motion behaviour (it couldn't be emulated in the test browser) and the copy with your real image files, which don't exist yet.

## 2026-11-22: `/maintenance` redesign (image column removed)

- [x] New layout:
  - hero with an oversized indented headline (leaning with scroll velocity), rule, body, and an ink ticker band;
  - a countdown instrument with giant numerals and a calibration ruler for the window;
  - the pillars as full-width index rows with an ink-flood hover;
  - a footer with a bleeding brush wordmark.
- [x] New reusable pieces: `Marquee`, `VelocitySkew` and `useScrollVelocity`.
- [x] Removed for this screen: the portrait, grid plate and stamp (components, schema fields and `assets.ts`).
- [x] Database migration: `$unset` of `content.images` and `content.stamp` on the `maintenance` document (version 4 → 5). Other content was kept as it was.
- [x] Fixed: the countdown digits spilled outside their mask at display size; the mask is now a fixed 1em.
- [x] Checked on a production build at 1440×900 and 375×812:
  - no horizontal overflow;
  - the screen-reader texts are correct (headline, ticker announced once, timer label);
  - the row hover inverts the row.

## 2026-11-22: `/maintenance` as a single viewport + generic content

- [x] One screen, no scrolling: the content column on the left, an ink panel with the animated `BuildScene` on the right. On phones the panel is a top band.
- [x] Height-aware sizing (≤820px laptops, ≤720px phones). Zero overflow verified at 1440×900, 1280×720, 1024×768, 375×812, 390×667 and 360×640.
- [x] **Personal details removed** from all visible content:
  - in the database: brand label, wordmark, `EST.` line, body, meta description and footer note (version 5 → 6, targeted `$set`);
  - in the seed defaults;
  - in the root `<title>` and description.

  The internal identifiers (database name `mm-portfolio`, token issuer, log app name) were left alone: visitors never see them, and renaming the database would disconnect the existing data.
- [x] Fixed: the short-screen Tailwind classes were built from a template string, so Tailwind never generated them; they're now written out in full.
- Note: the in-app browser throttles animation frames while it's unfocused, so screenshots sometimes catch the wireframe before it has drawn in. It draws normally in a visible tab.

## 2026-11-22: Clean layout with one signal colour

- [x] **Signal orange `#E8480F`** is the single accent: token `--signal`, Tailwind `signal`. Its contrast is 3.5:1 on ivory, so it's for graphics and large type only. STYLE.md §2.5 lists exactly where it may appear.
- [x] `/maintenance` restyled to match the clean reference:
  - ivory canvas, faint column rules and a soft orange glow;
  - logo tile and status beacon;
  - headline with an orange full stop, and a clean countdown;
  - full-width ruler with an orange elapsed line and now dot;
  - three pillar columns with an orange hover rule;
  - a light line illustration on the right with an orange cursor.
- [x] Removed from this screen: the ink panel, ticker band, crosshair frame, corner calibration rig and big brush wordmark. The components are kept for reuse.
- [x] Still generic content, with no personal details. The reference's email address was deliberately not added.
- [x] Zero overflow verified at 1440×900, 1280×720, 1024×768, 375×812, 390×667 and 360×640.

## 2026-11-22: Essentials, live check and the maintenance flag

- [x] Content trimmed:
  - the kicker is now `SYSTEM UPGRADE`, the countdown label `ETA`, and the body one or two sentences;
  - removed the pillars, mottos, `EST.` line and countdown prefix (DB migrated, version 6 → 7);
  - the schema now enforces short lengths.
- [x] **Maintenance flag** in `site_settings`, controlled only through the admin API (no admin UI, as requested):
  - the proxy routes `/` ↔ `/maintenance` from it;
  - `/api/status` exposes it publicly.
- [x] **Live check:**
  - the page polls every 60s, showing LAST CHECKED (local time) and NEXT CHECK (countdown with an orange progress line);
  - it redirects to `/` once the flag is off;
  - verified end to end, and the flag was restored to ON afterwards.
- [x] Footer rebuilt as three spaced columns; the illustration simplified (no gears, scanline, rings or dimension lines).
- [x] Screenshots in `docs/screens/maintenance/`.
- Known gap: with the flag OFF, `/` shows the 404 placeholder until the portfolio home is built.

## 2026-11-22: Check again + halftone sphere

- [x] **CHECK AGAIN** button (solid ink pill, like the reference) with a hint beside it. It runs the live check immediately and restarts the 60s timer.
  - Verified: loading → success, the sync icon animates, LAST CHECKED updated, NEXT CHECK reset to 1:00.
  - Its label and hint come from the DB (version 7 → 8).
- [x] New `ActionButton tone="solid"` variant, available app-wide.
- [x] Live-check state is shared through `LiveCheckProvider`; `useLiveCheck` gained `checkNow()`.
- [x] The right side was replaced with the **halftone sphere** (canvas dot-screen globe, orange meridian, pointer-lit light); the wireframe `BuildScene` was removed.
- [x] Zero overflow at 1440×900, 1280×720, 1024×768, 375×812, 390×667 and 360×640. Short phones drop the body and hint.

## 2026-11-22: Maintenance film

- [x] The right side is now a **continuous "movie" maintenance illustration**: one GSAP timeline with a camera dolly and push-in, and an orange cursor as the actor through manage → construct → content → redesign → upgrade. It dissolves and loops. Film-style subtitles from the DB, never two at once (verified by sampling).
  - It replaced the halftone sphere and an interim step carousel.
  - DB: `content.illustration` steps and version tags (version 8 → 9).
- [x] The Check again pill no longer moves on hover (magnetism is off for solid pills; verified, no transform on hover).
- [x] Fixed: square line caps painted a dot on undrawn paths, so the film now uses butt caps.
- [x] Zero overflow at 1440×900, 1280×720 and 1024×768. The phone layout is unchanged (the film is desktop-only).

## 2026-11-23: Hero Check again, 3D stage, 404, cursor and monogram

- [x] **CHECK AGAIN is now a hero action** (`HeroActionButton`): breathing halo, sheen, reticle brackets, magnetic hover with a two-layer orange wipe, press detent and shockwave, `CHECKING STATUS...` with a comet ring, `STILL UPGRADING` with a check, ray burst and settle. Labels from the DB (`liveCheck.checkingLabel`, `checkedLabel`; version 9 → 10). Verified idle → loading → success → idle by sampling.
- [x] **3D-look right side** (`DepthStage`): the film now plays on an extruded CSS 3D slab with a cube, gear, orb and version chip at different depths. Leans to the pointer, drifts, and runs a lift + scan + pulse sequence on every status check.
- [x] **404 screen** (`site_screens/not-found`, new): Error 404 display, Page Not Found, return button, 10s countdown ring with pause, progress line, auto-redirect to `/`. `/abc` → 302 → `/404` (status 404, title from the DB). Pause holds the count; the redirect lands on `/maintenance` while the flag is on.
- [x] **Custom cursor** in signal orange on all public pages (fine pointers only).
- [x] **"MM." monogram**: shared geometry, `<Monogram />`, four SVG files (`npm run brand:assets`) and [brand/LOGO.md](brand/LOGO.md) with generation prompts. Replaces the letter tile in the header (`brand.wordmark` removed; version 10 → 11).
- [x] Fixed: tailwind-merge dropped custom font sizes (`text-h3`) next to text colours (`text-paper`). `cn()` and `tv()` now use a merger that knows the type scale.
- [x] Zero overflow for `/maintenance` and `/404` at 1440×900, 1280×720, 1024×768, 390×667, 375×812 and 360×640.
- [ ] Not verified: reduced-motion behaviour (can't be emulated in the test browser).

## 2026-11-23: Check again back to a small, clean pill

- [x] Replaced the oversized hero button with `StatusPillButton`: a 48px ink pill with a label-size font. Hover only dims the fill; no hover movement, magnetic pull, orange corner brackets, halo, sheen or shockwaves. The status labels still change (`CHECKING STATUS...` → `STILL UPGRADING`). Verified: no transform on hover, label sequence by sampling, zero overflow at 1440×900, 1280×720 and 360×640.

## 2026-11-23: Animated logo (slice split)

- [x] `AnimatedMonogram` in the headers of `/maintenance` and the 404 page. Intro: each M arrives as five horizontal slices from alternating sides, the letters snap together along their diagonal cut with an orange flash, then the full stop pops in. Hover: the letters split along the cut with an orange line between them. Verified by sampling transforms through the intro and on hover; after the intro the slices are replaced by whole paths.

## 2026-11-23: Bigger header logo, no brand label

- [x] The header monogram is larger (32px tall on phones, 40px from `sm`) and stands alone: `PORTFOLIO / STUDIO` is gone from both headers. `content.brand` was removed from both schemas, the seed and MongoDB (maintenance v12, not-found v2). Verified zero overflow at 1440×900, 1280×720 and 360×640.

## 2026-11-23: Studio design system + two-step login

- [x] **docs/ADMIN_STYLE.md v1.0**: slate neutrals + one blue accent, Inter, 4px grid, light/dark from the OS, shadcn/ui token names. Replaced the provisional studio tokens (`ActionButton studio-action` migrated).
- [x] **shadcn/ui** set up (`components.json`; button, card, input, label, form, alert in `src/components/studio/ui`; recipes converted to the project `tv()`). Added react-hook-form, @hookform/resolvers, lucide-react. The CLI also installed an unrelated npm package called `cn` because of the utils alias; it was removed and the imports point to `@/lib/shared/cn`.
- [x] **StudioShell** (`src/app/studio/layout.tsx`) wraps every studio route.
- [x] **/studio/login** is a two-step flow: email (`POST /api/auth/initiate-login`, 10-minute challenge cookie, same answer for every valid email) → access code (`POST /api/auth/login`, now requires the challenge). Content from `site_screens/studio-login` (new).
- [x] Verified in the browser (light and dark): field validation, step change, wrong code (alert, stays on step 2, field cleared and refocused), Change email (prefilled), correct code → `/studio/dashboard`, signed-in visit redirects. API: 400 / 403 / 200 + cookie / 400 `challenge_expired` by curl. No scroll at 375×667.

## 2026-11-23: Studio login redesign (split screen)

- [x] Replaced the centred card with a **split-screen** layout: an always-dark brand panel (animated aurora, grid, gradient headline, module chips, glass release card) and a clean form column with step pills, a leading-icon email field, an identity row and **shadcn InputOTP** boxes (masked, show/hide, auto-submit on the last digit). Compact aurora band on phones.
- [x] Content model: `steps` and `showcase` added, `stepIndicator` removed, new copy ("Welcome back", "Enter your access code"). `npm run seed:screens -- --force --only=<slug>` replaces one screen.
- [x] The shadcn CLI installed the unrelated `cn` package again; removed, and `components.json` now points `utils` at `@/lib/utils` (re-export) so it won't recur.
- [x] Verified light and dark: wrong code auto-submits, alerts, clears, refocuses the first box; correct code → `/studio/dashboard`. No scroll at 1440×900, 1280×720, 1024×768 and 375×667.

## 2026-11-23: Studio login, light gradient panel + 3D workspace illustration

- [x] Left panel now follows the supplied reference: a light gradient shade (periwinkle / lavender / sky) and a tilted CSS 3D "Studio workspace" illustration (glass window, chart card, line chart, toggle, gauge, floating module pills, shelf and ruler), animated and pointer-leaning.
- [x] The login is **light only** (`data-studio-theme="light"`; the `dark:` variant skips pinned subtrees). Verified with the OS in dark mode: page, inputs and code boxes stay light.
- [x] Content: `showcase.workspace` added, modules now `Releases and feature flags`, `Portfolio content`, `Website analytics`, `Expenses and budget`; the release card was removed (DB version 5).
- [x] Sign-in verified again; no scroll at 1440×900, 1280×720, 1024×768 and 375×667.

## 2026-11-23: Bigger login illustration, no feature text

- [x] The workspace illustration fills the brand panel (square composition sized to the panel; panel widened to `1.45fr` from `xl`).
- [x] No feature names or taglines: the pills are abstract (dot + placeholder bars), and the headline, body and footer are gone from the panel and the phone band. `showcase` now holds only `status` and `workspace` (DB version 6).
- [x] No scroll at 1440×900, 1280×720, 1024×768 and 375×667.

## 2026-11-23: Modern login form + icon "Change email"

- [x] Form restyle: icon tile per step, segmented gradient progress, 48px rounded fields with a soft focus ring, larger code boxes that tint when filled, gradient primary button. Column widened to 420px.
- [x] "Change email" is now a pencil icon button with a shadcn Tooltip (and the same text as its accessible name).
- [x] Fixed: Radix overlays (tooltips) rendered outside the studio scope; `BodyScope` mirrors the surface, light pin and font onto `<body>`, and light pinning now wins on the same element.
- [x] `npm run ui:add -- <name>` wraps the shadcn CLI and removes the stray `cn` package it keeps installing.
- [x] Verified: tooltip (dark bubble), change email → step 1 prefilled, correct code → dashboard; no scroll at 1440×900, 1280×720, 375×667.

## 2026-11-23: New login illustration (labelled widget cluster)

- [x] Replaced the tilted workspace window with a cluster of labelled glass widgets: Overview (visitors, delta, gradient area chart, days), uptime ring, recent activity, auto-sync toggle, secure-session badge. Generic labels from the DB (`showcase.illustration`, version 7), animated and pointer-leaning.
- [x] Fixed: SVG gradient stops ignored CSS variables in the `stopColor` attribute; they're set through `style` now.
- [x] No scroll and no widget outside the panel at 1440×900, 1280×720 and 1024×768.

## 2026-11-23: Bigger login illustration

- [x] The widget cluster now uses the whole brand panel (logo row overlaid instead of stacked), the panel is `1.6fr` from `xl`, and the Overview, uptime and activity cards are larger. About 800px wide at 1440×900 (was about 720px). No scroll at 1440×900, 1280×720 and 1024×768.

## 2026-11-23: Studio shell (sidebar + topbar)

- [x] Spec: docs/components/STUDIO_SHELL_BUSINESS.md (reference video inspected frame by frame).
- [x] Collapsible sidebar (256px / 68px rail, cookie-persisted, Ctrl/Cmd+B, tooltips when collapsed, sliding active pill), mobile Sheet drawer, sticky topbar with breadcrumb and owner chip, sign-out row. Eight new animated MagicIcons. Module pages are "Coming soon" placeholders inside the shell. Shell copy from site_screens/studio-shell (owner name set only in the DB). Studio is light-only.
- [x] Verified: navigation + active state, collapse persists through reload, centred rail icons, tooltip, mobile drawer opens with all six links, next= redirect after login.

## 2026-11-23: Studio shell, modern glass redesign

- [x] Light-only lavender canvas with drifting light fields; floating glass sidebar and topbar; gradient active pill that springs between rows with a light sweep; one hover highlight gliding between rows; staggered row entrance; press feedback; animated breadcrumb; owner chip with a rotating gradient ring and live dot; blur/slide page transitions; animated placeholder (flowing border, orbiting ring, shimmering badge, pulsing rows).
- [x] Installed `tw-animate-css`, so shadcn's Sheet/Tooltip enter and exit animations now run.
- [x] Verified: navigation and breadcrumb, gliding hover, collapse, mobile drawer slides in and closes after choosing a page, sign-out → `/studio/login` and protected pages redirect afterwards; no horizontal scroll.

## 2026-11-23: Studio shell v1.2 (flush, click-only motion)

- [x] Researched current admin sidebar/topbar practice; built an original design: flush full-height sidebar and full-width topbar with edge shades (no rounded floating panels), 22px icons in 40px icon wells, sliding edge accent bar, title + group + date chip + owner in the topbar, static porcelain canvas.
- [x] Motion only on first load and on click (ripple, press, bar slide, icon-well pop, title roll, page slide); hover is colour only; no loops (verified: 0 running animations after load and after a click settles). Entrances use shadcn / tw-animate-css.
- [x] `brand.tagline` added (DB version 3). Verified navigation, collapse (icons centred), mobile, no horizontal scroll.

## 2026-11-23: Studio sidebar v1.3 (compact, search, site status)

- [x] Smaller overall: 248px / 68px, 40px rows, 32px icon wells with 18px icons, 64px header and topbar, smaller logo.
- [x] Menu search (Ctrl/⌘ K, live filter, Enter opens the first match, Esc clears, empty state) and a site status card reading the real maintenance flag with a "View site" link. New content: `search`, `siteStatus` (DB version 5); `warning` token for the amber dot.
- [x] Verified: filter ("an" → Content Management, Analytics), "chat" + Enter → /studio/chat, no-match message, status shows "Maintenance mode".

## 2026-11-23: Clean topbar with account menu

- [x] Topbar simplified: one-line breadcrumb (group / page), date with a calendar icon, and an account menu (shadcn DropdownMenu) with who is signed in, View site and Sign out. `actions.accountMenu` added (DB version 6).
- [x] Verified: menu opens with the right items, Sign out from the menu → /studio/login and protected pages redirect, phone topbar (menu, page name, avatar), no horizontal scroll.

## 2026-11-23: Module names and Content Forge

- [x] Modules renamed (DB and seed): Mission Control, Launchpad, Content Forge, Resume Lab, Inbox, Pulse.
- [x] Content Forge (`/studio/content`, [spec](components/CONTENT_FORGE_BUSINESS.md)): form generated from the stored content, field search, section chips, sticky save bar with Ctrl/⌘ S, plain-language validation messages, version-conflict banner, site-mode switch. Lists portfolio screens only (Maintenance page, 404 page); studio screens are not edited there.
- [x] Verified: edit → save → live on /maintenance; empty field → field error; value restored.

## 2026-11-23: Modern content fields and app icons

- [x] Content Forge fields redesigned: filled tiles with type icons, accent focus ring, inline errors with an icon, per-field `Edited` marker with undo, numbered list rows, section headers with field counts. New copy in `editor` (DB version 11).
- [x] App icons from the monogram (`npm run brand:icons`): favicon.ico (16/32/48), icon.svg, apple-icon.png, manifest icons 192/512 and a maskable 512; `src/app/manifest.ts`. Verified the `<link>` tags and that the manifest and icons are served.

## 2026-11-23: Shared content (one field for repeated text)

- [x] Checked all portfolio content for repeated values: only the footer note ("© 2026 ALL RIGHTS RESERVED.") was stored twice (maintenance and 404). It now lives once in a new `shared` record (`site_screens/shared`, `shared-schema.ts`); both pages read it. Removed `footer` from the maintenance and 404 records (DB versions 18 and 3).
- [x] Content Forge lists "Shared content" first. Verified: one save changed the footer on /maintenance and /404; value restored.

## 2026-11-23: Content Forge in three columns with live preview

- [x] Left: screens list with a hide toggle (icon strip with tooltips). Centre: fields. Right: the real page in a scaled frame showing unsaved drafts live, desktop/mobile switch, and an outline on every place the focused field's text appears ("Shown in n places").
- [x] `/preview/<slug>`: signed-in only, same-origin framing only (`X-Frame-Options: SAMEORIGIN` there, `DENY` elsewhere); screens run in preview mode (no 404 redirect, no status polling). Copy in `editor.previewPanel` (DB version 13).

## 2026-11-23: 100vh admin frame, full-height preview

- [x] Studio shell is a fixed 100vh frame; only the page area scrolls.
- [x] Content Forge from 1280px: three full-height columns that scroll independently; the preview stage fills its column. New default view "Fit to panel" fills the stage; Desktop and Mobile are centred and scaled to fit (`editor.previewPanel.fit`, DB version 14).

## 2026-11-23: Content Forge on phones

- [x] Screens as a sideways row of chips; no hide toggle on mobile; sticky Edit / Preview switch below 1280px; Fit preview shows the phone layout on phones (`editor.previewPanel.editTab` / `previewTab`, DB version 15). Verified at 375×812 (no sideways scroll) and 1440×900 (unchanged).

## 2026-11-23: Deployment setup

- [x] Branches `develop` (Vercel Preview) and `go-live` (Production); other branches never deploy (`vercel.json` `git.deploymentEnabled` + `scripts/vercel-ignore-build.mjs`). Guide: [deployment.md](deployment.md).
- [x] Env split: `.env.development` (local dev) and `.env.production` (local production build), both gitignored, own database (`mm-portfolio-prod`) and own session secret for production; templates `.env.*.example` committed; Vercel values set per environment in the dashboard.
- [x] API security: CORS gate in the proxy, central write checks (same-origin, JSON, 256 KB), `withStudioApi` session guard, one error envelope with `details`, `no-store` on all API responses, extra security headers (CSP base, HSTS, COOP). Verified with curl: 403 cross-origin preflight/write, 401 without session, 415, 413, 400.

## 2026-11-23: First deployment (Vercel project md-musamil)

- [x] Production branch set to `go-live` (Vercel had picked `develop`, the GitHub default). 12 environment variables (6 Production, 6 Preview). Production database `mm-portfolio-prod` filled with a copy of the development content.
- [x] `go-live` deployed to Production: https://md-musamil.vercel.app. Verified: `/api/health` database up, `/` → `/maintenance` with live content, unknown pages → 404, studio redirects to login, security headers present, cross-origin write 403, favicon served.
- [x] `develop` deployed to Preview (protected by Vercel Authentication); `/api/health` database up. The build guard cancelled the two `develop`-as-production attempts, as designed.

## 2026-11-23: Name splash

- New screen `site_screens/splash` ([spec](screens/SPLASH_BUSINESS.md)), redesigned on 2026-11-25 from the three reference videos (`docs/reference/splash-1..3.mp4`) into a 33-second showreel: hook (the full name shrinks letter by letter into "MM."), loading counter, colour floods, a browser window built with a dragged card, a terminal deploying to a live card, a dot matrix (wave, halftone sphere, monogram), a skills node graph, stacked statements, and a new end card. It ends with the logo flying into the page's navbar.
- Every style is computed from time (`src/components/splash/splash-timeline.ts`); springs and expo easing in `src/lib/shared/motion/time-easing.ts`; the dot matrix, pulses and orbit are drawn on one canvas.
- Plays on every visit to `/` only (not other pages, no studio preview). Skip intro pill, Esc, or the call to action open the page; off for reduced motion. While maintenance is on, `/` moves on to `/maintenance` underneath the splash (the proxy no longer redirects `/`).
- Words editable in Content Forge (no live preview for this screen).

## 2026-11-26: Home — navbar and hero

- New screen `site_screens/home` ([spec](screens/HOME_BUSINESS.md)), editable in Content Forge.
- Navbar (`src/components/home/SiteNav.tsx`): monogram left (the splash lands its logo on it), floating glass pill of links with a sliding ink highlight, availability chip, magnetic call to action; hides on scroll down, returns on scroll up, condenses past the top; full-screen phone menu (Esc, focus trap, focus returns).
- Hero (`src/components/home/Hero.tsx`), redesigned the same day for a clean, non-overlapping layout: statement, brush signature, intro and calls to action on the left; a framed halftone sphere with its tags on the right; facts along the bottom. 200svh section with a sticky stage: each layer moves at its own scroll speed, the stage shrinks into a card on ink; pointer depth on the sphere; velocity skew; an ink velocity marquee under it.
- Navbar restyled: slash-separated labels with a letter-roll hover and an orange dot; transparent at the top, a blurred paper bar when it returns on scroll up.
- Entrances wait for the splash to start leaving (`useIntroReady`, `src/components/splash/splash-state.ts`).

## Open items

- [ ] Seed the home screen on production (`npm run seed:screens:prod -- --only=home`, plus its studio-shell `editor.screens` entry) once development is complete.
- [ ] Seed the name splash on production (`npm run seed:screens:prod -- --only=splash`) and add its entry to the production studio-shell `editor.screens`; until then production shows no splash.

- [ ] Delete the local `vercel-env/` folder after saving the production access code in a password manager.

- [ ] Set the real upgrade window: `timeline.windowStart` and `timeline.targetAt` currently hold a placeholder of 22 Nov → 31 Dec 2026 UTC.

- [ ] Choose a longer `ADMIN_ACCESS_CODE` before deploying.
- [ ] Delete the old `.env.local` (its values now live in `.env.development`; it would override both env files).

## On hold (waiting for instructions)

- Public portfolio
- Studio modules other than Content Forge: dashboard, release, resume, chat, analytics
- UI design and styling for the studio modules (the login is done)
