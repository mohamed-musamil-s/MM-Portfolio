# Screen: `/maintenance`, Business Spec

Version 1.3, 2026-11-22. **One viewport (100svh), no scrolling, on a clean ivory canvas, with signal orange as the single accent.** Left: content and countdown. Right: an animated line illustration. Default content is generic, with no personal details. Public route. Look: [STYLE.md](../STYLE.md). Motion: [ANIMATION_UI.md](../ANIMATION_UI.md).

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
| Status kicker (scrolls in the ink ticker band) | `SYSTEM UPGRADE IN PROGRESS // CORE INFRASTRUCTURE & EDITORIAL ENGINE` |
| Headline | `UPGRADING THE SYSTEM.` |
| Body | This portfolio is undergoing a scheduled system upgrade: hardening database and session security, refining the motion and UI systems, and preparing the next release. |
| Brand label · `EST.` line · wordmark · footer | `PORTFOLIO / STUDIO` · `EST. 2026` · `Portfolio` · `© 2026 ALL RIGHTS RESERVED.` (generic on purpose: no personal names or dates) |
| Pillar 01 | `CORE ENGINE`: database and session architecture calibration |
| Pillar 02 | `MOTION & UI`: editorial kinetic typography, WebGL grain and SVG choreography |
| Pillar 03 | `RELEASE PIPELINE`: staging verification and studio readiness |
| Mottos | `MINDSET / AMBITION / FREEDOM` · `FOCUS / DISCIPLINE / CONSISTENCY / EXECUTION` |

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
| `brand.label`, `brand.wordmark`, `brand.established` | text | Header label; the wordmark's first letter is the logo tile; the `EST.` line is in the footer. |
| `status.kicker`, `status.label` | text | The kicker above the headline; the live-status label next to the orange beacon. |
| `headline.lines` | 1 to 3 lines | Each line reveals separately. A trailing `.` on the last line renders in signal orange. |
| `body` | text | ≤ 600 characters. |
| `pillars[]` | 1 to 4 items | `{ index, title, description, icon }`. `icon` must be a MagicIcon name. |
| `timeline` | object | `label`, `windowStart`, `targetAt` (dates; `targetAt` must be after `windowStart`), `countdownLabel`, `srRemaining` (screen-reader template with `{days}`, `{hours}` and `{minutes}`), `units { days, hours, minutes, seconds }`, `overdue { title, detail }`. |
| `mottos.primary[]`, `mottos.secondary[]` | 1 to 5 words each | Primary: footer. Secondary: caption under the illustration (`lg` and up). |
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
| Display | The window's start and end dates (`22 NOV 2026`, `31 DEC 2026`) label the two ends of the calibration ruler. They're formatted on the server in UTC, so every visitor sees the same text. |
| Readout | Four giant tabular-number cells (days, hours, minutes, seconds) split by hairlines. Labels come from `timeline.units`. Days aren't capped (`120` is valid). |
| Ticking | `useCountdown` ticks on the wall-clock second boundary, so it doesn't drift, and pauses while the tab is hidden. Each digit that changes slides in; unchanged digits stay still. |
| First paint | The server renders `-- : -- : -- : --` and the client fills in real values on mount. This avoids a hydration mismatch from the time difference between server and client. |
| Reaching zero | Exactly at `targetAt` the readout switches to the overdue state. It never shows negative numbers. |
| Overdue | Shows `timeline.overdue.title` (default `FINALIZING DEPLOY`) and `timeline.overdue.detail` (default `WINDOW EXTENDED`). The status icon keeps orbiting. |
| Progress | **Calibration ruler** across the full width:<br>• one tick per day of the window (weekly ticks only once it's over 120 days), with a major tick every 7 days;<br>• the elapsed part is hatched, and a bullseye needle marks "now";<br>• elapsed share = `(now - windowStart) / (targetAt - windowStart)`, clamped to 0..1. |
| Accessibility | The readout is `role="timer"`, with an `aria-label` that updates once per minute (not every second), so screen readers aren't flooded. |

---

## 5. Layout, motion and asset requirements

### Layout: one screen, no scrolling

| Row | Content |
| --- | --- |
| Header | Logo tile (first letter of `brand.wordmark`, with an orange square) and `brand.label` (from `sm`). On the right, the orange `StatusDot` and `status.label`. |
| Middle, left (7 columns) | `status.kicker`, `headline.lines` (final full stop in orange), `body`, then the countdown (`countdownLabel · label`, `DD : HH : MM : SS`). |
| Middle, right (5 columns, `lg` and up) | `BuildScene` line illustration, with `mottos.secondary` as its caption. |
| Ruler | Full-width window timeline: day ticks, orange elapsed line and now dot, start and end dates. |
| Pillars | Three columns (stacked on phones). The description is hidden on phones and on screens ≤ 820px tall. |
| Footer | `mottos.primary`, `brand.established` and `footer.note`. |

| Constraint | Rule |
| --- | --- |
| Height ≤ 820px (laptops) | The headline steps down to `text-h2`, the vertical padding tightens, and the pillar descriptions are hidden. |
| Phones ≤ 720px tall | The body paragraph is hidden. |
| Below `lg` | The illustration is hidden, so the content column has the full width. |

Verified with zero overflow (page and every row) at 1440×900, 1280×720, 1024×768, 375×812, 390×667 and 360×640.

### Colour

The canvas is ivory and the type is ink, plus **one accent, signal orange `#E8480F`**, used only for:
- the status beacon;
- the logo-tile square;
- the headline's full stop;
- the ruler's elapsed line and now dot;
- the illustration's cursor and landing rings;
- the pillar hover rule;
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
| Pillars | Rise in, staggered. Hover draws the orange rule and wakes the MagicIcon. | `PillarColumn` |
| Illustration | "Portfolio under reconstruction", looping every 6s: the wireframe and dimension lines draw in; copy lines type; an orange cursor travels card to card, filling each with hatching; a scanline sweeps the page; meshed gears turn; the scene leans toward the pointer. | `BuildScene` |

**Image assets:** none. Everything is inline SVG or CSS.

## 6. Reuse and scope boundaries

### Shared modules this screen uses

These are reusable by any future page.

| Module | Reused for |
| --- | --- |
| `PublicShell`, `PosterFrame`, `SlashLabel` | Every public page: surface tokens, fonts, MotionProvider, grain, frame, labels |
| `InkReveal`, `StatusDot` (`src/components/motion/`) | Any editorial section or status display |
| `BuildScene`, `WindowRuler`, `PillarColumn` (`src/components/maintenance/`) | Promote to shared modules if another screen needs them |
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
