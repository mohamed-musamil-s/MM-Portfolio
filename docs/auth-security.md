# Authentication and Security

The studio has a single admin. Credentials come from the environment and never appear in source code:

- `ADMIN_EMAIL`
- `ADMIN_ACCESS_CODE`, a static access code (not an expiring OTP)

## Login

`POST /api/auth/login` with JSON `{ "email": "...", "accessCode": "..." }`.

1. **Origin check.** If the request has an `Origin` header that doesn't match the host, it gets a 403.
2. **Input validation.** Both fields must be non-empty strings, email at most 254 characters, code at most 64. Otherwise 400.
3. **Lockout check.** If the IP or the global counter is locked, it gets a 429 with `Retry-After`.
4. **Credential check** (`auth/credentials.ts`):
   - The email is trimmed and lowercased.
   - Each submitted value and its expected value are SHA-256 hashed, then compared with `crypto.timingSafeEqual`. Hashing first makes the buffers the same length, so the comparison never throws and doesn't leak how long the expected value is.
   - Both comparisons always run, so a wrong email takes as long as a wrong code.
5. **On failure:** the failure is recorded and the response is 401 `invalid_credentials`. The message doesn't say which field was wrong.
6. **On success:** the failure counters are cleared, a session is created, and the response is 200 `{ ok: true, data: { redirectTo } }`.

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
| 400 | invalid input |
| 401 | invalid credentials |
| 403 | cross-origin request |
| 429 | locked out |
| 500 | server or database failure |
