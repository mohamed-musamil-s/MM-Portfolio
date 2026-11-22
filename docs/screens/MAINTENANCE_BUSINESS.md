# Screen: `/maintenance`, Business Spec

Version 1.4, 2026-11-22. **One viewport (100svh), no scrolling, on a clean ivory canvas, with signal orange as the single accent.** Content is trimmed to the essentials. The page re-checks the **maintenance flag** (set from the admin panel) every minute and sends visitors to the site once it's off. Screenshots: [desktop](maintenance/desktop-1280x720.jpg), [mobile](maintenance/mobile-375x812.jpg). Public route. Look: [STYLE.md](../STYLE.md). Motion: [ANIMATION_UI.md](../ANIMATION_UI.md).

---

## 1. Business purpose and user value

While the public portfolio is being built, `/` redirects here (302). This page is the **first impression of the brand**, so it must read as an *intentional, high-craft system upgrade*, never as a broken or abandoned site.

| Goal | How the screen delivers it |
| --- | --- |
| Signal authority and craft | Editorial poster composition, screen-print motifs, and choreographed motion straight from the brand poster. |
| Build trust | A concrete narrative (what's being upgraded), a stated target window, and a live countdown. |
| Stay honest when the date slips | Past the target, the countdown switches to a clearly worded "finalizing" state instead of showing negative time or zeros. |
| Zero maintenance cost for content changes | **Every word, date and image path is managed in the database** (see §3), and will be editable in the admin panel. |

**Audience:** recruiters, clients and peers arriving from social links, a CV, or by typing the domain.

**What a visitor should come away with:** "This person ships with care. The site is coming, and roughly when."

---

## 2. Content (essentials only)

The defaults the seed writes are generic, with no personal details. All of them can be changed in the database.

| Element | Default |
| --- | --- |
| Kicker | `SYSTEM UPGRADE` (≤ 40 characters) |
| Headline | `UPGRADING` / `THE SYSTEM.` (the final `.` renders in signal orange) |
| Body | We're shipping a new version of the site. It'll be back shortly, a little sharper than before. (≤ 200 characters) |
| Countdown label | `ETA` (≤ 24 characters) |
| Live-check labels | `LAST CHECKED` · `NEXT CHECK` |
| Status | `STATUS / LIVE UPGRADE` |
| Brand | `PORTFOLIO / STUDIO`; the logo tile shows the first letter of the wordmark `Portfolio` |
| Footer note | `© 2026 ALL RIGHTS RESERVED.` |

Removed on 2026-11-22 to keep the screen focused: the upgrade pillars, both motto lists, the `EST.` line and the long kicker. The database was migrated with `$unset` (version 6 → 7).

## 3. Content source: database only

No user-facing text, date or asset path is hardcoded in the page or its components.

| Item | Value |
| --- | --- |
| Collection | `site_screens` (new), database `mm-portfolio` |
| Document | `_id: "maintenance"` |
| Shape | `{ _id, content, version, updatedAt, updatedBy }` |
| Schema | `src/lib/shared/content/maintenance-schema.ts` (zod). Shared, so the future admin form can validate in the browser with the same rules. |
| Read path | `getScreenContent("maintenance")`. It's server-only, memoised per request, and validates the document. |
| Write path | `PUT /api/studio/screens/maintenance` (admin session required, same-origin only). |
| Seed | `npm run seed:screens` inserts the default document. It never overwrites one that exists; `-- --force` replaces it. |

### Content model (`content`)

| Field | Type | Rules |
| --- | --- | --- |
| `meta.title`, `meta.description` | text | ≤ 70 and ≤ 160 characters. Used for `<title>` and the meta description. |
| `brand.label`, `brand.wordmark` | text | The header label; the wordmark's first letter is the logo tile. |
| `status.kicker`, `status.label` | text, ≤ 40 each | The small kicker above the headline; the label next to the orange beacon. |
| `headline.lines` | 1 to 3 lines, ≤ 40 each | Each line reveals separately. A trailing `.` on the last line renders in signal orange. |
| `body` | text, ≤ 200 | One or two sentences. |
| `timeline` | object | `label` (≤ 24, e.g. `ETA`), `windowStart`, `targetAt` (dates; `targetAt` must be after `windowStart`), `srRemaining` (screen-reader template with `{days}`, `{hours}` and `{minutes}`), `units`, `overdue { title, detail }`. |
| `liveCheck` | object | `lastCheckedLabel`, `nextCheckLabel` (≤ 24 each). |
| `footer.note` | text | Small print, footer right. |

### Saving changes (for the admin panel)

1. `GET /api/studio/screens/maintenance` returns `{ content, version, updatedAt, updatedBy }`.
2. `PUT /api/studio/screens/maintenance` with `{ content, version }`.
   - The content is validated against the schema; an invalid body gets 400 with the list of issues.
   - **Version check:** if someone saved in between, the response is 409 and nothing is overwritten.
   - On success: 200, `version` goes up by one, and `updatedAt` and `updatedBy` (the admin email) are set.
3. The next request to `/maintenance` shows the new content. The page is rendered fresh on every request, with no cache to clear.

---

## 4. Timeline and live countdown rules

| Rule | Behaviour |
| --- | --- |
| Source | `timeline.windowStart` and `timeline.targetAt` from the database (stored as dates). The default seed uses a placeholder window, 2026-11-22 → 2026-12-31 (UTC); **set the real date** through the API. |
| Display | The window's start and end dates (`22 NOV 2026`, `31 DEC 2026`) label the two ends of the calibration ruler. They're formatted on the server in UTC, so every visitor sees the same text. |
| Readout | Four giant tabular-number cells (days, hours, minutes, seconds) split by hairlines. Labels come from `timeline.units`. Days aren't capped (`120` is valid). |
| Ticking | `useCountdown` ticks on the wall-clock second boundary, so it doesn't drift, and pauses while the tab is hidden. Each digit that changes slides in; unchanged digits stay still. |
| First paint | The server renders `-- : -- : -- : --` and the client fills in real values on mount. This avoids a hydration mismatch from the time difference between server and client. |
| Reaching zero | Exactly at `targetAt` the readout switches to the overdue state. It never shows negative numbers. |
| Overdue | Shows `timeline.overdue.title` (default `FINALIZING DEPLOY`) and `timeline.overdue.detail` (default `WINDOW EXTENDED`). The status icon keeps orbiting. |
| Progress | **Calibration ruler** across the full width:<br>• one tick per day of the window (weekly ticks only once it's over 120 days), with a major tick every 7 days;<br>• the elapsed part is hatched, and a bullseye needle marks "now";<br>• elapsed share = `(now - windowStart) / (targetAt - windowStart)`, clamped to 0..1. |
| Accessibility | The readout is `role="timer"`, with an `aria-label` that updates once per minute (not every second), so screen readers aren't flooded. |

---

## 4b. Maintenance flag and live check

**Whether the site is in maintenance at all is a site setting, not screen content.** Only the admin panel controls it. There's no admin UI yet; the admin API is the control.

| Item | Value |
| --- | --- |
| Storage | `site_settings` collection, `_id: "maintenance"`, `{ enabled, updatedAt, updatedBy }`. Seeded as `enabled: true`. |
| Default if missing | ON (the portfolio isn't built yet) |
| Admin API | `GET /api/studio/settings/maintenance` returns `{ enabled, updatedAt, updatedBy }`.<br>`PUT /api/studio/settings/maintenance` with `{ "enabled": false }` switches it. Requires a session and a same-origin request. |
| Routing (proxy) | **ON:** `/` → 302 `/maintenance`.<br>**OFF:** `/maintenance` → 302 `/`.<br>The proxy caches the flag for about 10s. |
| Public status | `GET /api/status` returns `{ maintenance, checkedAt }`, uncached. If MongoDB is unreachable it falls back to the last known value, else ON. |

**Live check on the page:**

| Rule | Behaviour |
| --- | --- |
| When | Once on load, then **every 60 seconds** (`useLiveCheck`) |
| Flag still ON | The footer updates **LAST CHECKED** (the visitor's local time, `HH:MM:SS`) and restarts **NEXT CHECK** (`m:ss`, with an orange progress line). |
| Flag OFF | The visitor is sent to `/` with `location.replace` (no back-button loop). |
| Network error | The page stays up; the next tick retries. |
| Until the first check finishes | Shows `--:--:--` and `-:--`. |

> **Known gap:** the portfolio home page doesn't exist yet. When the flag is OFF, `/` shows the not-found placeholder (404). This resolves itself once the home page is built.

Verified on 2026-11-22: 401 without a session, 400 for a bad body, 403 cross-origin. Switching it OFF made `/api/status` return `false` and `/maintenance` return 302 → `/`, and an **open page redirected itself within the minute**. Switching it back ON restored `/` → `/maintenance`.

## 5. Layout, motion and asset requirements

### Layout: one screen, no scrolling

| Row | Content |
| --- | --- |
| Header | Logo tile with an orange square, and `brand.label` (from `sm`). On the right, the orange `StatusDot` and `status.label`. |
| Middle, left (6 columns) | Kicker, headline, body, then the countdown (`ETA`, `DD : HH : MM : SS`). |
| Middle, right (columns 8 to 12, `lg` and up) | `BuildScene` line illustration |
| Ruler | Window timeline: day ticks, orange elapsed line and now dot, dates at both ends |
| Footer | Three spaced columns divided by hairlines: **LAST CHECKED**, **NEXT CHECK** (orange progress), and the note on the right (from `sm`) |

| Constraint | Rule |
| --- | --- |
| Height ≤ 820px (laptops) | The headline steps down to `text-h2`, and the header, middle, ruler and footer spacing tighten. |
| Below `lg` | The illustration is hidden, so the content column has the full width. |

Verified with zero overflow at 1440×900, 1280×720, 1024×768, 375×812 and 360×640.

### Colour

The canvas is ivory and the type is ink, plus **one accent, signal orange `#E8480F`**, used only for:
- the status beacon;
- the logo-tile square;
- the headline's full stop;
- the ruler's elapsed line and now dot;
- the illustration's cursor and landing rings;
- the NEXT CHECK progress line;
- one blurred background glow.

It's never used for small text (it's 3.5:1 on ivory, which passes for graphics and large type only). See STYLE.md §2.5.

### Motion

The motion direction is "200%", within the STYLE.md §7 guardrails, and everything is off under `prefers-reduced-motion`.

| Layer | Motion | Built with |
| --- | --- | --- |
| Status | Orange beacon with an expanding pulse ring | `StatusDot` |
| Kicker, headline, body | Ink-mask line reveals, staggered | `InkReveal` |
| Countdown | Per-digit slide inside a fixed 1em mask | `Countdown` |
| Ruler | Ticks draw in left to right; the orange line and dot ease to "now" | `WindowRuler` |
| Footer | NEXT CHECK progress line fills over the minute, then resets | `LiveCheckFooter` |
| Illustration | A calm loop, every 6s: the page wireframe draws in, copy lines type, and an orange cursor visits each card, which fills with hatching. The scene leans gently toward the pointer. (Gears, scanline, rings and dimension lines were removed for calm.) | `BuildScene` |

**Image assets:** none. Everything is inline SVG or CSS.

## 6. Reuse and scope boundaries

### Shared modules this screen uses

These are reusable by any future page.

| Module | Reused for |
| --- | --- |
| `PublicShell`, `PosterFrame`, `SlashLabel` | Every public page: surface tokens, fonts, MotionProvider, grain, frame, labels |
| `InkReveal`, `StatusDot` (`src/components/motion/`) | Any editorial section or status display |
| `BuildScene`, `WindowRuler`, `LiveCheckFooter` (`src/components/maintenance/`) | Promote to shared modules if another screen needs them |
| `useSecondClock`, `useLiveCheck` (`src/hooks/`) | Any timed UI or live status poll |
| `useCountdown`, `useScrollVelocity`, `useParallax` (`src/hooks/`) | Any timed or scroll-reactive UI |
| `MagicIcon` (new `calibrate` icon), `ActionButton` | App-wide |
| `getScreenContent` and the `site_screens` collection | Every future configurable screen (add a schema to the registry) |

### In scope

This spec, the `/maintenance` route, its components, the content API, and the seed.

### Out of scope

| Item | Status |
| --- | --- |
| Admin panel UI for editing content | Later |
| Notify-me or email capture | Not approved |
| Any link to `/studio` from public pages | Not allowed |
| Other public pages | Not approved |
| The WebGL halftone canvas (ANIMATION_UI §10.1) | Not used here: type and SVG carry the motion |
| Images on this screen | Removed with the layout revision |

---

## 7. Failure behaviour

| Situation | Result |
| --- | --- |
| Content document missing | Logged (`screen content missing: run npm run seed:screens`); the error page shows a 500. |
| Content document invalid (fails the schema) | Logged with the zod issues; error page, 500. |
| Database unreachable | Logged by the db layer; error page, 500. |
| JavaScript disabled | All text is server-rendered and readable. The countdown shows the target window without ticking. |
