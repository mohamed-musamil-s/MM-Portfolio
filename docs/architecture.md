# Architecture

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript (strict) |
| Database | MongoDB Atlas via the official `mongodb` driver, database `mm-portfolio` |
| Session signing | `jose` (HS256 JWT) |
| Logging | `pino` (JSON), `pino-pretty` in development |

Next.js 16 renamed Middleware to **Proxy**: the file is `src/proxy.ts` and it runs on the Node.js runtime.

Cache Components (`cacheComponents` in `next.config.ts`) is turned off. Every studio route reads the session cookie at request time, and turning it on would mean wrapping each of those reads in `<Suspense>`. We can revisit this when the public portfolio exists and has static content worth caching.

## Folder layout

```
src/
  proxy.ts                  # runs before every request: request id, / redirect, studio guard
  instrumentation.ts        # boot logging, early DB connect, global server error sink
  app/
    layout.tsx              # root layout (no styling yet)
    not-found.tsx           # 404 placeholder
    error.tsx               # 500 boundary
    global-error.tsx        # root-layout failure boundary
    [...slug]/route.ts      # unknown URL: 302 to /404 (JSON 404 under /api)
    404/page.tsx            # calls notFound(), so /404 returns status 404
    maintenance/page.tsx    # public placeholder
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
  lib/
    shared/routes.ts        # route constants, safe redirect helper (client-safe)
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
| `/maintenance` | public | placeholder, 200 |
| `/404` | public | placeholder, 404 |
| any unknown path | public | 302 to `/404` |
| `/studio` | protected | 302 to `/studio/dashboard` (or to login) |
| `/studio/login` | public | login form; already signed in: redirect to dashboard |
| `/studio/{dashboard,release,content,resume,chat,analytics}` | protected | placeholders |
| `POST /api/auth/login` | public | see [auth-security.md](auth-security.md) |
| `POST /api/auth/logout` | session | revokes the session |
| `GET /api/health` | public | 200 when MongoDB answers a ping, else 500 |

## MongoDB

- One `MongoClient` per process, cached on `globalThis` so dev hot reloads don't leak connection pools.
- A failed connect clears the cached promise, so the next request tries again.
- Indexes are created on first use (`db/indexes.ts`):
  - `sessions.tokenHash` (unique)
  - `sessions.expiresAt` (TTL)
  - `auth_attempts.expiresAt` (TTL)

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
