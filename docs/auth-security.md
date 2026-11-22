# Authentication and Security

The studio has a single admin. Credentials come from the environment and never appear in source code:

- `ADMIN_EMAIL`
- `ADMIN_ACCESS_CODE`, a static access code (not an expiring OTP)

## Login (two steps, since 2026-11-23)

The screen is specified in [screens/STUDIO_LOGIN_BUSINESS.md](screens/STUDIO_LOGIN_BUSINESS.md).

### Step 1: `POST /api/auth/initiate-login` with `{ "email": "..." }`

1. Origin check (403), then zod validation: a well-formed email of at most 254 characters (400).
2. Lockout check (429 with `Retry-After`), so a locked-out admin learns it before typing the code.
3. Issues `mm_login_challenge`: an HS256 JWT (audience `mm-portfolio:login-challenge`, 10 minutes) holding only the **SHA-256 of the lowercased email**. Cookie: `HttpOnly`, `Secure` (except `next dev`), `SameSite=Strict`, `Path=/api/auth`.
4. Answers **200 for every well-formed email**. Whether the email is the admin's is never revealed at this step (no account enumeration).

### Step 2: `POST /api/auth/login` with `{ "email": "...", "accessCode": "..." }`

1. **Origin check.** If the request has an `Origin` header that doesn't match the host, it gets a 403.
2. **Input validation** (shared zod schema, `src/lib/shared/auth/login-input.ts`): email as above, code 4–64 characters. Otherwise 400.
3. **Challenge check.** The challenge cookie must be valid, unexpired and for this same email; otherwise 400 `challenge_expired` (not counted as a failed attempt). The code endpoint can't be used without step 1.
4. **Lockout check.** If the IP or the global counter is locked, it gets a 429 with `Retry-After`.
4. **Credential check** (`auth/credentials.ts`):
   - The email is trimmed and lowercased.
   - Each submitted value and its expected value are SHA-256 hashed, then compared with `crypto.timingSafeEqual`. Hashing first makes the buffers the same length, so the comparison never throws and doesn't leak how long the expected value is.
   - Both comparisons always run, so a wrong email takes as long as a wrong code.
5. **On failure:** the failure is recorded and the response is 401 `invalid_credentials`. The message doesn't say which field was wrong.
6. **On success:** the failure counters and the challenge cookie are cleared, a session is created, and the response is 200 `{ ok: true, data: { redirectTo } }`.

The client then navigates to the validated `?next=` path, or `/studio/dashboard` if there isn't one. `safeStudioRedirect` only accepts `/studio/...` paths, which prevents open redirects.

## Brute-force protection

A 4-digit code has only 10,000 possible values, so failed attempts are counted in MongoDB (`auth_attempts`). The counts survive restarts and are shared across instances.

| Scope | Limit | Lock |
| --- | --- | --- |
| Per IP | 5 failures in 15 min | 15 min |
| Global | 20 failures in 15 min | 15 min |

The global limit stops distributed guessing, but it also means an attacker can lock the admin out for 15 minutes. A successful login clears both counters.

The client IP comes from `x-forwarded-for`. That header is only trustworthy behind a proxy that sets it (Vercel, a load balancer). Without one, a client can spoof it, and only the global limit still applies.

**Recommendation:** use a longer access code in production. The limits above make 4 digits workable, but not strong.

## Sessions

Sessions are stored in the MongoDB `sessions` collection:

```ts
{
  tokenHash: string,  // SHA-256 of the session id; the raw id only lives in the cookie
  email: string,
  createdAt: Date,
  expiresAt: Date,    // TTL index, MongoDB deletes the row after this
  ip: string,
  userAgent: string,
}
```

- **Session id:** 32 random bytes, base64url-encoded.
- **Cookie:** `mm_session` holds an HS256 JWT signed with `SESSION_SECRET`.
  - Claims: `sid`, `iss=mm-portfolio`, `aud=mm-portfolio:studio`, `iat`, `exp`.
- **Lifetime:** 12 hours, absolute. Sessions don't slide.
- **Cookie flags:**
  - `HttpOnly`
  - `SameSite=Strict`
  - `Path=/`
  - `Expires` matches the session
  - `Secure` everywhere except `next dev`, which runs over plain http
- **Logout** (`POST /api/auth/logout`) deletes the database row and clears the cookie. Because the database row is removed, the cookie can't be reused even though its signature is still valid.

The database stores only a hash of the session id. If the database leaks, its rows can't be turned into working cookies.

## Route protection (two layers)

1. **Proxy** (`src/proxy.ts`) is the optimistic check.
   - Every `/studio/**` path except `/studio/login` needs a cookie whose JWT signature and expiry check out.
   - Without one, the request gets a **302** to `/studio/login?next=<path>`, and any bad cookie is deleted.
   - This check doesn't touch the database, so it's cheap.
2. **Server guard** (`requireSession()` in `auth/guard.ts`) is the authoritative check.
   - Every protected page calls it.
   - It verifies the JWT and looks up a live row in MongoDB, so revoked or expired sessions are rejected.
   - The check runs in each page, not in the layout, because layouts don't re-render on client-side navigation.

`getCurrentSession()` is wrapped in React `cache()`, so several callers in one request share one database lookup.

## Other hardening

- Security headers on every response:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
- The `X-Powered-By` header is turned off.
- Studio pages send `robots: noindex, nofollow`.
- 500 responses never include internals. They carry a `requestId` that matches the server log entry.
- The logger redacts `accessCode`, `password`, `token`, cookies, authorization headers and `MONGODB_URI`.

## Status codes used by the auth API

| Status | Meaning |
| --- | --- |
| 200 | login or logout succeeded |
| 302 | proxy and guard redirects |
| 400 | invalid input, or `challenge_expired` (step 2 without a valid step 1) |
| 401 | invalid credentials |
| 403 | cross-origin request |
| 429 | locked out |
| 500 | server or database failure |
