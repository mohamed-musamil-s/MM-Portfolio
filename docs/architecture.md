# Architecture

## Stack

| Layer           | Choice                                                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack), React 19                                                                                                                                                                                 |
| Language        | TypeScript (strict)                                                                                                                                                                                                          |
| Database        | MongoDB Atlas via the official `mongodb` driver, database `mm-portfolio`                                                                                                                                                     |
| Session signing | `jose` (HS256 JWT)                                                                                                                                                                                                           |
| Logging         | `pino` (JSON), `pino-pretty` in development                                                                                                                                                                                  |
| Motion          | `motion` (transforms, springs, gestures), `animejs` (SVG draw and morph), `gsap` + ScrollTrigger (scroll), `lenis` (smooth scroll), `three` + R3F + drei (WebGL hero, not built yet). See [ANIMATION_UI.md](ANIMATION_UI.md) |
| UI primitives   | `radix-ui` (headless, accessible)                                                                                                                                                                                            |
| Styling         | Tailwind CSS v4 (`@tailwindcss/postcss`), `tailwind-variants` (`tv()`), `clsx` + `tailwind-merge` (`cn()`), Prettier with `prettier-plugin-tailwindcss`                                                                      |

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
    not-found.tsx           # last-resort fallback (unknown URLs never reach it: they 302 to /404)
    error.tsx               # 500 boundary
    global-error.tsx        # root-layout failure boundary
    [...slug]/route.ts      # unknown URL: 302 to /404 (JSON 404 under /api)
    (public)/404/           # page.tsx calls notFound(); not-found.tsx renders the 404 screen (status 404);
                            # layout.tsx supplies the DB title/description
    (public)/               # route group: every public page renders inside PublicShell
      layout.tsx
      maintenance/page.tsx  # reads site_screens/maintenance, renders MaintenanceScreen
    api/
      auth/initiate-login/route.ts # POST: step 1, validate email, issue the login challenge cookie
      auth/login/route.ts   # POST: step 2, check challenge + credentials, create session
      auth/logout/route.ts  # POST: revoke session, clear cookie
      health/route.ts       # GET: MongoDB ping
    studio/
      layout.tsx            # StudioShell: studio surface, Inter, studio motion theme
      login/page.tsx        # two-step sign-in (content from site_screens/studio-login)
      (protected)/          # route group, does not appear in the URL
        layout.tsx          # studio nav + sign out
        dashboard|release|content|resume|chat|analytics/page.tsx
  components/studio/        # StudioShell, login/ (LoginFlow, EmailStep, CodeStep, FormAlert), logout button, placeholders
  components/studio/ui/     # shadcn/ui components (button, card, input, label, form, alert) on studio tokens
  components/ui/            # shared across surfaces: MotionProvider, MagicIcon, ActionButton, StatusPillButton, CustomCursor
  components/brand/         # Monogram ("MM." mark; geometry in lib/shared/brand/monogram.ts)
  components/not-found/     # 404: NotFoundScreen, ErrorCode, Redirect{Provider,Countdown,Line}
  components/motion/        # reusable editorial motion pieces (InkReveal, Marquee, VelocitySkew, ParallaxLayer, CalibrationRig ...)
  components/public/        # PublicShell, PosterFrame, SlashLabel
  components/maintenance/   # /maintenance: screen composition, MaintenanceIllustration (GSAP film), Countdown, WindowRuler, LiveCheck{Provider,Footer}, CheckAgain, DepthStage (CSS 3D)
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
  - The studio uses `data-surface="studio"` (StudioShell) and follows [ADMIN_STYLE.md](ADMIN_STYLE.md): slate + blue tokens named after shadcn/ui, light/dark from the OS.
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
       - "/maintenance" -> 302 "/" while the maintenance flag is OFF
       - "/studio/**"   -> no valid signed cookie: 302 /studio/login?next=...
  -> App Router
       - page:  requireSession() checks the session in MongoDB (authoritative)
       - API:   withApi() logs the request and response and maps throws to 500
       - unknown path: [...slug] -> 302 /404
  -> instrumentation.onRequestError logs any uncaught exception
```

## Routes

| Path                                                        | Access                      | Behaviour                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                         | public                      | Home. The name splash plays over it on every visit; while the maintenance flag is ON the page moves on to `/maintenance` underneath the splash. When it's OFF: the home page, navbar and hero (see [screens/HOME_BUSINESS.md](screens/HOME_BUSINESS.md)). |
| `/maintenance`                                              | public                      | System-upgrade screen from database content, 200 (see [screens/MAINTENANCE_BUSINESS.md](screens/MAINTENANCE_BUSINESS.md))                                                                                                                                 |
| `/404`                                                      | public                      | 404 screen from the DB (`site_screens/not-found`), status 404, auto-redirect to `/` after 10s                                                                                                                                                             |
| any unknown path                                            | public                      | 302 to `/404`                                                                                                                                                                                                                                             |
| `/studio`                                                   | protected                   | 302 to `/studio/dashboard` (or to login)                                                                                                                                                                                                                  |
| `/studio/login`                                             | public                      | two-step sign-in (email → access code); already signed in: redirect to dashboard                                                                                                                                                                          |
| `/studio/{dashboard,release,content,resume,chat,analytics}` | protected                   | placeholders                                                                                                                                                                                                                                              |
| `POST /api/auth/initiate-login`                             | public, same-origin         | step 1: issue the login challenge (same answer for any valid email)                                                                                                                                                                                       |
| `POST /api/auth/login`                                      | public, same-origin         | step 2; see [auth-security.md](auth-security.md)                                                                                                                                                                                                          |
| `POST /api/auth/logout`                                     | session                     | revokes the session                                                                                                                                                                                                                                       |
| `GET /api/health`                                           | public                      | 200 when MongoDB answers a ping, else 500                                                                                                                                                                                                                 |
| `GET /api/studio/screens/:slug`                             | session                     | Screen content + version (backend for the admin panel)                                                                                                                                                                                                    |
| `PUT /api/studio/screens/:slug`                             | session, same-origin        | Save validated content; 409 on a version conflict                                                                                                                                                                                                         |
| `GET /api/status`                                           | public                      | `{ maintenance, checkedAt }`, uncached. The maintenance page polls it every minute.                                                                                                                                                                       |
| `GET /api/studio/settings/maintenance`                      | session                     | `{ enabled, updatedAt, updatedBy }`                                                                                                                                                                                                                       |
| `PUT /api/studio/settings/maintenance`                      | session, same-origin        | `{ enabled: boolean }`: the admin maintenance switch                                                                                                                                                                                                      |
| `GET /api/studio/settings/sections`                         | session                     | `{ visible, updatedAt, updatedBy }`: which portfolio sections show (Launchpad)                                                                                                                                                                            |
| `PUT /api/studio/settings/sections`                         | session, same-origin        | `{ visible: { <section>: boolean } }` (any subset)                                                                                                                                                                                                        |
| `GET /api/studio/screens/:slug/versions`                    | session                     | Version history of a screen (Launchpad)                                                                                                                                                                                                                   |
| `POST /api/studio/screens/:slug/versions/:version`          | session, same-origin        | `{ expectedVersion }`: restore that version as a new one                                                                                                                                                                                                  |
| `POST /api/contact`                                         | public, same-origin         | The contact form; stores a conversation. See [CONTACT_MESSAGES.md](features/CONTACT_MESSAGES.md)                                                                                                                                                          |
| `GET /api/studio/messages`                                  | session                     | Conversation summaries + unread count (backend for the chat module)                                                                                                                                                                                       |
| `GET`/`PATCH /api/studio/messages/:id`                      | session (PATCH same-origin) | One conversation; PATCH `{ unread?, status? }`                                                                                                                                                                                                            |

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
- **`contact_conversations`** holds contact-form messages, one conversation per send (indexes `conversation_recent`, `conversation_by_client`). See [CONTACT_MESSAGES.md](features/CONTACT_MESSAGES.md).
- **`site_screen_versions`** keeps the newest 50 saved versions of each screen (`{ slug, version, content, savedAt, savedBy }`, index `screen_version`), written by every save; Launchpad lists and restores them.
- **`site_settings`** holds site-wide switches set from the admin panel. Today that's only `_id: "maintenance"`, `{ enabled, updatedAt, updatedBy }`.
  - The proxy reads it (cached about 10s) to route `/` ↔ `/maintenance`.
  - `_id: "sections"`, `{ visible: { about, experience, education, skills, work, recognition, contact }, updatedAt, updatedBy }`: set from Launchpad; the home page reads it on every request and skips hidden sections and their links (missing means visible).
  - `GET /api/status` exposes it publicly.
  - `GET`/`PUT /api/studio/settings/maintenance` changes it (session required).

## Environment

Local files `.env.development` / `.env.production` (templates: `.env.*.example`); Vercel Preview and Production have their own values. Full setup: [deployment.md](deployment.md). Values are read lazily, so `next build` works without secrets. A missing value throws on first use, gets logged, and the request returns 500.

| Variable               | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `MONGODB_URI`          | Atlas connection string                              |
| `MONGODB_DB`           | database name (default `mm-portfolio`)               |
| `ADMIN_EMAIL`          | studio admin email                                   |
| `ADMIN_ACCESS_CODE`    | studio static access code                            |
| `SESSION_SECRET`       | at least 32 characters, used to sign session cookies |
| `LOG_LEVEL`            | pino level (default `info`)                          |
| `CORS_ALLOWED_ORIGINS` | optional, origins allowed to read public GET APIs    |
