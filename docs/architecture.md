# Architecture

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript (strict) |
| Database | MongoDB Atlas via the official `mongodb` driver, database `mm-portfolio` |
| Session signing | `jose` (HS256 JWT) |
| Logging | `pino` (JSON), `pino-pretty` in development |
| Motion | `motion` (transforms, springs, gestures), `animejs` (SVG draw and morph), `gsap` + ScrollTrigger (scroll), `lenis` (smooth scroll), `three` + R3F + drei (WebGL hero, not built yet). See [ANIMATION_UI.md](ANIMATION_UI.md) |
| UI primitives | `radix-ui` (headless, accessible) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), `tailwind-variants` (`tv()`), `clsx` + `tailwind-merge` (`cn()`), Prettier with `prettier-plugin-tailwindcss` |

Next.js 16 renamed Middleware to **Proxy**: the file is `src/proxy.ts` and it runs on the Node.js runtime.

Cache Components (`cacheComponents` in `next.config.ts`) is turned off. Every studio route reads the session cookie at request time, and turning it on would mean wrapping each of those reads in `<Suspense>`. We can revisit this when the public portfolio exists and has static content worth caching.

## Folder layout

```
src/
  proxy.ts                  # runs before every request: request id, / redirect, studio guard
  instrumentation.ts        # boot logging, early DB connect, global server error sink
  app/
    layout.tsx              # root layout: imports globals.css, no theme of its own
    globals.css             # Tailwind entry + design tokens (names in @theme, values per data-surface)
    not-found.tsx           # 404 placeholder
    error.tsx               # 500 boundary
    global-error.tsx        # root-layout failure boundary
    [...slug]/route.ts      # unknown URL: 302 to /404 (JSON 404 under /api)
    404/page.tsx            # calls notFound(), so /404 returns status 404
    (public)/               # route group: every public page renders inside PublicShell
      layout.tsx
      maintenance/page.tsx  # reads site_screens/maintenance, renders MaintenanceScreen
    api/
      auth/login/route.ts   # POST: verify credentials, create session
      auth/logout/route.ts  # POST: revoke session, clear cookie
      health/route.ts       # GET: MongoDB ping
    studio/
      login/page.tsx        # public studio login
      (protected)/          # route group, does not appear in the URL
        layout.tsx          # studio nav + sign out
        dashboard|release|content|resume|chat|analytics/page.tsx
  components/studio/        # client components (login form, logout button, placeholders)
  components/ui/            # shared across surfaces: MotionProvider, MagicIcon, ActionButton
  components/motion/        # reusable editorial motion pieces (InkReveal, Marquee, VelocitySkew, ParallaxLayer, CalibrationRig ...)
  components/public/        # PublicShell, PosterFrame, SlashLabel
  components/maintenance/   # /maintenance: screen composition, Countdown, WindowRuler, PillarRow, BuildScene (animated panel)
  hooks/                    # shared hooks: useMotionTheme, useActionRunner, useMagnetic, useParallax
  lib/
    shared/routes.ts        # route constants, safe redirect helper (client-safe)
    shared/cn.ts            # cn(): clsx + tailwind-merge
    shared/content/         # zod content schemas + screen registry (shared with the future admin form)
    server/content/         # getScreenContent / saveScreenContent (site_screens)
    motion/                 # motion tokens, action state machine, GSAP and anime.js setup
    server/
      env.ts                # lazy, validated env access
      logger.ts             # pino logger + scoped children
      db/                   # client singleton, collections, indexes
      auth/                 # credentials, session token, session store, rate limit, guard
      http/                 # response helpers, request helpers, withApi wrapper
```

### Client and server code

- Anything under `src/lib/server` is server-only. Modules that touch cookies or the database (`auth/session.ts`, `auth/guard.ts`, `auth/rate-limit.ts`) import `server-only`, so importing them from a client component fails the build.
- `auth/session-token.ts`, `logger.ts` and `env.ts` skip the `server-only` import because `proxy.ts` and `instrumentation.ts` import them, and those files don't resolve the `react-server` export condition that `server-only` relies on.
- `src/lib/shared` holds only code that is safe in the browser.
- Client components live in `src/components` and talk to the server only through `/api` routes.

## Styling

- **Tailwind CSS v4 is the only styling method.** It's configured in CSS (`src/app/globals.css`); there is no `tailwind.config` file.
- **Each design surface has its own tokens.**
  - Public pages are wrapped in `data-surface="public"` and follow [STYLE.md](STYLE.md).
  - The studio will use `data-surface="studio"` and follow [ADMIN_STYLE.md](ADMIN_STYLE.md).
  - Utilities reference the surface's variables inline, so one surface's tokens render as nothing on the other.
- **Tailwind's default color palette is turned off.** Only the project's tokens exist, so a class like `bg-red-500` doesn't compile.
- **Formatting:**
  - `npm run format` runs Prettier, which also sorts Tailwind classes.
  - `npm run format:check` checks formatting without writing.

## Request flow

```
Browser
  -> proxy.ts
       - adds x-request-id
       - "/"            -> 302 /maintenance
       - "/studio/**"   -> no valid signed cookie: 302 /studio/login?next=...
  -> App Router
       - page:  requireSession() checks the session in MongoDB (authoritative)
       - API:   withApi() logs the request and response and maps throws to 500
       - unknown path: [...slug] -> 302 /404
  -> instrumentation.onRequestError logs any uncaught exception
```

## Routes

| Path | Access | Behaviour |
| --- | --- | --- |
| `/` | public | 302 to `/maintenance` |
| `/maintenance` | public | System-upgrade screen from database content, 200 (see [screens/MAINTENANCE_BUSINESS.md](screens/MAINTENANCE_BUSINESS.md)) |
| `/404` | public | placeholder, 404 |
| any unknown path | public | 302 to `/404` |
| `/studio` | protected | 302 to `/studio/dashboard` (or to login) |
| `/studio/login` | public | login form; already signed in: redirect to dashboard |
| `/studio/{dashboard,release,content,resume,chat,analytics}` | protected | placeholders |
| `POST /api/auth/login` | public | see [auth-security.md](auth-security.md) |
| `POST /api/auth/logout` | session | revokes the session |
| `GET /api/health` | public | 200 when MongoDB answers a ping, else 500 |
| `GET /api/studio/screens/:slug` | session | Screen content + version (backend for the admin panel) |
| `PUT /api/studio/screens/:slug` | session, same-origin | Save validated content; 409 on a version conflict |

## MongoDB

- One `MongoClient` per process, cached on `globalThis` so dev hot reloads don't leak connection pools.
- A failed connect clears the cached promise, so the next request tries again.
- Indexes are created on first use (`db/indexes.ts`):
  - `sessions.tokenHash` (unique)
  - `sessions.expiresAt` (TTL, named `session_ttl`)
  - `auth_attempts.expiresAt` (TTL, named `attempt_ttl`)
- **`site_screens`** holds database-managed page content, one document per screen (`_id` = slug, `{ content, version, updatedAt, updatedBy }`).
  - Every public screen reads its copy from here; no user-facing text is hardcoded.
  - Content is validated with the zod schema registered in `src/lib/shared/content/screens.ts`, both on read (`getScreenContent`) and on write (`PUT /api/studio/screens/:slug`, admin session, optimistic version check).
  - Seed with `npm run seed:screens`.

## Environment

See `.env.example`. Values are read lazily, so `next build` works without secrets. A missing value throws on first use, gets logged, and the request returns 500.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB` | database name (default `mm-portfolio`) |
| `ADMIN_EMAIL` | studio admin email |
| `ADMIN_ACCESS_CODE` | studio static access code |
| `SESSION_SECRET` | at least 32 characters, used to sign session cookies |
| `LOG_LEVEL` | pino level (default `info`) |
