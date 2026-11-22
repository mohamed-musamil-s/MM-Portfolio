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

## Open items

- [ ] Choose a longer `ADMIN_ACCESS_CODE` before deploying.
- [ ] When deploying, set all `.env.example` variables in the host's environment, and confirm that the host sets `x-forwarded-for`.

## On hold (waiting for instructions)

- Public portfolio
- All studio modules: dashboard, release, content, resume, chat, analytics
- UI design and styling
