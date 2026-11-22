# Screen: `/maintenance`, Business Spec

Version 1.0, 2026-11-22. Public route. Look: [STYLE.md](../STYLE.md). Motion: [ANIMATION_UI.md](../ANIMATION_UI.md).

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

## 2. System upgrade narrative

The default content below is what the seed writes. All of it can be changed in the database.

| Element | Default |
| --- | --- |
| Status kicker | `SYSTEM UPGRADE IN PROGRESS // CORE INFRASTRUCTURE & EDITORIAL ENGINE` |
| Headline | `UPGRADING THE SYSTEM.` |
| Body | MM-Portfolio is undergoing a scheduled system upgrade: hardening database and session security, refining the motion and UI systems, and preparing the next release. |
| Pillar 01 | `CORE ENGINE`: database and session architecture calibration |
| Pillar 02 | `MOTION & UI`: editorial kinetic typography, WebGL grain and SVG choreography |
| Pillar 03 | `RELEASE PIPELINE`: staging verification and studio readiness |
| Mottos | `MINDSET / AMBITION / FREEDOM` · `FOCUS / DISCIPLINE / CONSISTENCY / EXECUTION` |
| Stamp | `SYS // UPGRADE` · `EST. 2000` |

> **Disclosure note.** Copy that names internal systems ("database and session security") tells anyone, attackers included, what's being worked on. It's kept because it was requested, and it's one database edit away from a more general wording.

---

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
| `brand.label`, `brand.wordmark`, `brand.established` | text | Top-left label, brush wordmark, `EST.` line. |
| `status.kicker`, `status.label` | text | Kicker above the headline; short live-status label. |
| `headline.lines` | 1 to 3 lines | Each line reveals separately. |
| `body` | text | ≤ 600 characters. |
| `pillars[]` | 1 to 4 items | `{ index, title, description, icon }`. `icon` must be a MagicIcon name. |
| `timeline` | object | `label`, `windowStart`, `targetAt` (dates; `targetAt` must be after `windowStart`), `countdownLabel`, `units { days, hours, minutes, seconds }`, `overdue { title, detail }`. |
| `mottos.primary[]`, `mottos.secondary[]` | 1 to 5 words each | Rendered as slash labels. |
| `stamp.lines[]` | 1 to 3 lines | Text on the SVG stamp fallback. |
| `images.portrait`, `images.gridPlate`, `images.stamp` | `{ src, alt }` | `src` must be under `/images/` and be png, jpg, webp, avif or svg. An empty `alt` marks the image as decorative. |
| `footer.note` | text | Small print. |

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
| Display | The window is shown as `22 NOV 2026 → 31 DEC 2026`, formatted on the server in UTC, so every visitor sees the same text. |
| Readout | `DD : HH : MM : SS` using tabular numbers. Labels come from `timeline.units`. Days aren't capped (`120 : 04 : 09 : 33` is valid). |
| Ticking | `useCountdown` ticks on the wall-clock second boundary, so it doesn't drift, and pauses while the tab is hidden. Each digit that changes slides in; unchanged digits stay still. |
| First paint | The server renders `-- : -- : -- : --` and the client fills in real values on mount. This avoids a hydration mismatch from the time difference between server and client. |
| Reaching zero | Exactly at `targetAt` the readout switches to the overdue state. It never shows negative numbers. |
| Overdue | Shows `timeline.overdue.title` (default `FINALIZING DEPLOY`) and `timeline.overdue.detail` (default `WINDOW EXTENDED`). The status icon keeps orbiting. |
| Progress | A hairline bar shows the share of the window that has passed, `(now - windowStart) / (targetAt - windowStart)`, clamped to 0..1. |
| Accessibility | The readout is `role="timer"`, with an `aria-label` that updates once per minute (not every second), so screen readers aren't flooded. |

---

## 5. Motion and asset requirements

The motion direction is "200%": high-energy, layered and kinetic, within the STYLE.md §7 guardrails. That means no bounce, no animated colour, a static CSS grain, and everything off under `prefers-reduced-motion`.

| Layer | Motion | Built with |
| --- | --- | --- |
| Entrance | Staggered **ink-mask reveals**: kicker, then headline lines, rule, body, countdown digits, then pillars as they scroll into view | `InkReveal` (motion) |
| Calibration rig | Counter-rotating degree and orbital rings, vernier ticks drawn with stroke-dashoffset, and a crosshair reticle that **locks on** at load. Leans toward the pointer; turns with scroll. | `CalibrationRig` (motion + anime.js + GSAP) |
| Registration marks | Frame crosshairs at the corners and edge midpoints, with a slow breathing scale and opacity | `RegistrationMark` |
| Depth parallax | The portrait, grid plate, calibration rig and stamp move at different scroll speeds and pointer depths | `ParallaxLayer` (GSAP ScrollTrigger + pointer springs) |
| Scroll | Lenis inertial scroll | `MotionProvider theme="portfolio"` |
| Icons | Status: `sync` orbiting. Pillars: icon set in the database, reacting on hover. | `MagicIcon` |
| Countdown | Per-digit slide transitions, plus progress bar growth | `Countdown` |

### Image assets

Image paths are configured in the database. Missing files fall back gracefully, and the page never breaks.

| Asset | Expected file | Spec | Fallback if the file is missing |
| --- | --- | --- | --- |
| Portrait | `public/images/maintenance/maintenance-portrait-ink.png` | 4:5 vertical, black-and-white screen-print or ink portrait, calm and focused, halftone grain on `#F4F3EE` | A framed halftone plate with registration crosshairs (decorative, no text) |
| Grid plate | `public/images/maintenance/maintenance-grid-plate.png` | 1:1 or 4:5, technical grid, calibration ticks, halftone dots, newsprint grain | A generated SVG technical grid with ticks |
| Stamp | `public/images/maintenance/maintenance-stamp-mark.png` | 1:1 risograph ink stamp with distressed edges | An SVG stamp drawing `stamp.lines` with a distressed edge filter |

- The server checks whether each file exists on every request, so dropping a file into `public/images/maintenance/` takes effect without a code change.
- All photos get the STYLE.md treatment: `grayscale contrast-125`, no radius.

---

## 6. Reuse and scope boundaries

### Shared modules this screen uses

These are reusable by any future page.

| Module | Reused for |
| --- | --- |
| `PublicShell` | Every public page: surface tokens, fonts, MotionProvider, grain |
| `InkReveal`, `RegistrationMark`, `CalibrationRig`, `ParallaxLayer`, `CropMarks` (`src/components/motion/`) | Any editorial section |
| `useCountdown`, `usePointerParallax`, `useParallax` (`src/hooks/`) | Any timed or parallax UI |
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
| The WebGL halftone canvas (ANIMATION_UI §10.1) | Not used here: SVG and CSS cover the depth |

---

## 7. Failure behaviour

| Situation | Result |
| --- | --- |
| Content document missing | Logged (`screen content missing: run npm run seed:screens`); the error page shows a 500. |
| Content document invalid (fails the schema) | Logged with the zod issues; error page, 500. |
| Database unreachable | Logged by the db layer; error page, 500. |
| Image file missing | Fallback visual (see §5); the page itself returns 200. |
| JavaScript disabled | All text is server-rendered and readable. The countdown shows the target window without ticking. |
