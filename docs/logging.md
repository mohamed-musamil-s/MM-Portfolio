# Logging and Error Handling

## Logger

`src/lib/server/logger.ts` exports one `pino` logger for the whole server, plus `getLogger(scope)` for child loggers.

- **Production:** one JSON object per line on stdout, ready for any log shipper.
- **Development:** pretty-printed through `pino-pretty`. It's used as a synchronous stream with no worker thread, so it works inside Next bundles.
- **Level:** set with `LOG_LEVEL` (default `info`).
- **Base fields:** every line has `app: "mm-portfolio"`, an ISO `time`, and a `scope`.
- **Redaction:** these fields are replaced with `[REDACTED]`:
  - `accessCode`, `password`, `token`
  - `cookie`, `headers.cookie`, `headers.authorization`
  - `MONGODB_URI`

### Scopes

| Scope | What is logged |
| --- | --- |
| `db` | connect start, success and failure, missing config, heartbeat failures, server state changes, pool cleared, topology closed, index setup |
| `api` | every API request (method, path) and response (status, duration in ms); handler exceptions |
| `auth` | login success and failure, lockouts, session create and destroy, rejected cookies, guard denials |
| `proxy` | studio access denied and redirected; proxy exceptions |
| `server` | boot, and every uncaught server exception via `instrumentation.onRequestError` |

## Request correlation

`src/proxy.ts` generates a new `x-request-id` (a UUID) for every request. It ignores any value the client sends, so clients can't inject ids into the logs. The proxy forwards the id to the app and also sets it on the response. `withApi` attaches it to every API log line and to 500 bodies, so a user-reported error maps to a single log entry.

## API wrapper

Every route handler is wrapped with `withApi()` (`src/lib/server/http/with-api.ts`). It:

1. logs `api request`;
2. runs the handler, and if the handler throws, logs `api handler threw` with the stack and returns a standard 500;
3. logs `api response` with the status and duration. The level follows the status: `info` below 400, `warn` for 4xx, `error` for 5xx.

## Response standard

`src/lib/server/http/responses.ts`:

| Helper | Status | Body |
| --- | --- | --- |
| `ok(data)` | 200 | `{ ok: true, data }` |
| `found(url)` | 302 | (redirect) |
| `fail(status, code, message)` | 4xx | `{ ok: false, error: { code, message } }` |
| `serverError(requestId)` | 500 | `{ ok: false, error: { code: "internal_error", message: "Internal Server Error", requestId } }` |

`NextResponse.redirect` defaults to 307, so the proxy and the catch-all route always pass 302 explicitly.

Server Component guards use Next's `redirect()`, which responds with 307. This only happens when the cookie is validly signed but the session is gone from MongoDB, because the proxy has already answered every other unauthenticated request with a 302.

## Page errors

- `app/error.tsx`: the 500 boundary for route segments. It shows the error `digest`.
- `app/global-error.tsx`: used when the root layout itself fails.
- Either way, the server side of the error is logged by `onRequestError`.

## Example (production output)

```json
{"level":30,"time":"2026-11-22T14:17:06.198Z","app":"mm-portfolio","scope":"api","requestId":"d5b4...","method":"POST","path":"/api/auth/login","msg":"api request"}
{"level":40,"time":"2026-11-22T14:17:06.216Z","app":"mm-portfolio","scope":"auth","ip":"203.0.113.7","msg":"login failed: invalid credentials"}
```
