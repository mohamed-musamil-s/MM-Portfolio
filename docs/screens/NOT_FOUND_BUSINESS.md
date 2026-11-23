# Screen: 404 (`/404` and every unknown URL), Business Spec

Version 1.0, 2026-11-23. **One viewport, no scrolling, clean ivory canvas, signal orange as the single accent.** The page says plainly that the address doesn't exist, offers one button back to the main page, and takes the visitor there by itself after a short countdown. Public surface. Look: [STYLE.md](../STYLE.md). Motion: [ANIMATION_UI.md](../ANIMATION_UI.md).

---

## 1. Business purpose

A broken link shouldn't lose the visitor. The page turns a dead end into a two-second detour.

| Goal | How the screen delivers it |
| --- | --- |
| Make the problem obvious | A large `Error 404` display and a `Page Not Found` heading. No jargon. |
| Get the visitor back fast | One primary button to `/`, plus an automatic redirect after 10 seconds. |
| Keep control with the visitor | The countdown can be paused and resumed. It also pauses itself while the tab is hidden. |
| Stay on brand | Same canvas, type, monogram and orange accent as `/maintenance`. |
| No content in code | Every word and the countdown length live in MongoDB (see §3). |

## 2. Routing

| Request | Result |
| --- | --- |
| Any unknown path, e.g. `/abc` | `302 → /404` (catch-all route handler, logged). |
| `/404` | Renders this screen with a real `404` status (`notFound()` → `app/not-found.tsx`). |
| Unknown `/api/*` path | JSON `404`, never this page. |
| Countdown reaches 0, or the button is pressed | Client navigation to `/`. While maintenance is on, the proxy then sends `/` on to `/maintenance` (302). |

## 3. Content source: database only

| Item | Value |
| --- | --- |
| Collection / document | `site_screens`, `_id: "not-found"` |
| Schema | `src/lib/shared/content/not-found-schema.ts` (zod), registered in `SCREEN_SCHEMAS` |
| Read path | `getScreenContent("not-found")` in `app/not-found.tsx` |
| Write path | `PUT /api/studio/screens/not-found` (admin session, same origin) |
| Seed | `npm run seed:screens` inserts it when missing |

### Content model

| Field | Default | Rules |
| --- | --- | --- |
| `meta.title` / `meta.description` | `Page not found` / short sentence | ≤ 70 / ≤ 160 |
| `display.label` / `display.code` | `ERROR` / `404` | ≤ 16 / ≤ 8. Renders as the large "Error 404" graphic; an orange full stop follows the code. |
| `heading` | `PAGE NOT FOUND.` | ≤ 40. A trailing `.` renders in orange. |
| `body` | "The page you're looking for doesn't exist or has moved. We'll take you back to the main page in a moment." | ≤ 200 |
| `action.label` | `RETURN TO MAIN PAGE` | ≤ 32. Alternatives the admin can pick: `GO TO HOMEPAGE`, `BACK TO SITE`. |
| `redirect.seconds` | `10` | Integer 3–60 |
| `redirect.label` | `REDIRECTING IN` | ≤ 32 |
| `redirect.pausedLabel` | `REDIRECT PAUSED` | ≤ 32 |
| `redirect.pauseLabel` / `redirect.resumeLabel` | `PAUSE` / `RESUME` | ≤ 16 each |
| `redirect.srAnnouncement` | `Taking you to the main page in {seconds} seconds.` | ≤ 120. `{seconds}` is replaced. Announced politely, not every second (at start, at 5 and at 3). |
| `footer.note` | `© 2026 ALL RIGHTS RESERVED.` | ≤ 80. Stored once in the **shared** record (`site_screens/shared`), used by the maintenance page too |

Header: the animated monogram only (`h-8`, `h-10` from `sm`), linking to `/` with the action label as its accessible name. The brand label was removed on 2026-11-23 (`content.brand` unset, version 1 → 2).

## 4. Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [MM.] (animated, links home)                    ● ERROR 404  │
│                                                              │
│  PAGE NOT FOUND.                       ERROR                 │
│  body copy                             404.   (giant, ink,   │
│                                               orange dot)    │
│  [ RETURN TO MAIN PAGE → ]  (◔ 7)  REDIRECTING IN 7S · PAUSE │
│                                                              │
│ ──────────────── orange progress line ─────────────────────  │
│ © 2026 ALL RIGHTS RESERVED.                                  │
└──────────────────────────────────────────────────────────────┘
```

Below `lg`, the giant code stacks above the heading at a smaller size. Nothing scrolls at 360×640 or above.

## 5. Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Heading, body, actions | Ink reveal on load (mask wipe, 0.14s stagger) | Shown at once |
| Giant `404` | Digits rise in one by one; the orange dot drops last and settles | Static |
| Countdown ring | Orange arc drains linearly; the number inside flips each second | Arc and number update without tweening |
| Progress line | Fills left to right over the countdown | Updates in steps |
| Pause | Ring dims and the label changes to `REDIRECT PAUSED` | Same |

## 6. Accessibility

- `h1` is the heading; the giant code is decorative text with an accessible label (`Error 404`).
- The pause control is a real `<button>` with `aria-pressed`. It's focusable before the redirect fires.
- The redirect never fires while the countdown is paused or the tab is hidden.
- The page works without JavaScript: the button is a plain link.

## 7. Acceptance criteria

1. `/does-not-exist` → 302 → `/404` → status 404 with this screen.
2. After the configured seconds (default 10) the browser lands on `/`.
3. Pausing stops the countdown. Resuming continues from where it stopped.
4. Changing `redirect.seconds` or any label in MongoDB shows on the next request.
5. No horizontal or vertical scroll at 1440×900, 1280×720, 1024×768, 390×667, 375×812 or 360×640.
