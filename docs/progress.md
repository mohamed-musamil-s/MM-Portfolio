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

## Open items

- [ ] Set the real upgrade window: `timeline.windowStart` and `timeline.targetAt` currently hold a placeholder of 22 Nov → 31 Dec 2026 UTC.
- [ ] Optional: use the monogram as the favicon (`app/icon.svg`).

- [ ] Choose a longer `ADMIN_ACCESS_CODE` before deploying.
- [ ] When deploying, set all `.env.example` variables in the host's environment, and confirm that the host sets `x-forwarded-for`.

## On hold (waiting for instructions)

- Public portfolio
- All studio modules: dashboard, release, content, resume, chat, analytics
- UI design and styling
