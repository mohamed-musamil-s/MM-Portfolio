# Screen: `/studio/login`, Business Spec

Version 1.0, 2026-11-23. Two-step sign-in for the admin studio: **email → Continue → access code → Authenticate**. Studio surface ([ADMIN_STYLE.md](../ADMIN_STYLE.md)), shadcn/ui components. Screenshots: [light desktop](studio-login/desktop-light-1440x900.jpg), [mobile](studio-login/mobile-375x667.jpg).

## 1. Purpose

Let the single admin into the studio quickly, without making the login an easy target. The screen is calm and precise, and clearly separate from the public portfolio.

## 2. Flow

| Step | User sees | Request | Outcomes |
| --- | --- | --- | --- |
| 1. Email | "Admin Access", email field, **Continue** | `POST /api/auth/initiate-login { email }` | 200 → step 2 (sets the 10-minute `mm_login_challenge` cookie). 400 invalid email. 429 locked out (button disabled until it expires). |
| 2. Access code | "Security Check", the email as a chip, masked numeric code field with show/hide, **Authenticate**, **Change email** | `POST /api/auth/login { email, accessCode }` | 200 → session cookie → redirect to `/studio/dashboard` (or the safe `?next=`). 401 "email or access code is incorrect": stays on step 2, clears and refocuses the field. 400 `challenge_expired` → back to step 1 with a message. 429 locked out. |

- **No account enumeration.** Step 1 answers the same for every well-formed email; whether it's the admin's is only decided at step 2, together with the code, and the error never says which part was wrong. (The brief also mentioned an "email not authorised" error at step 1; that would reveal the admin address, so it's deliberately not shown.)
- Step 2 can't be called without step 1: the code endpoint requires a valid challenge for the same email.
- Already signed in: visiting the page redirects to the dashboard.
- Brute-force limits are unchanged (5 failures per IP, 20 global, per 15 minutes); see [auth-security.md](../auth-security.md).

## 3. Content (database)

Every visible string, including validation and error messages, comes from `site_screens`, `_id: "studio-login"` (schema `src/lib/shared/content/studio-login-schema.ts`).

| Field | Default |
| --- | --- |
| `meta.title` | `Studio sign in` |
| `brand.name` | `Studio` (next to the monogram) |
| `stepIndicator` | `Step {current} of {total}` |
| `emailStep` | `Admin Access` · "Please enter your authorized email address to proceed." · `Email address` · `name@example.com` · `Continue` · `Checking…` |
| `codeStep` | `Security Check` · "Enter the secure access code for {email}." · `Access code` · `Authenticate` · `Verifying…` · `Change email` · `Signed in. Opening the studio…` · `Show access code` / `Hide access code` |
| `errors` | `Couldn't sign in` (alert title); email required / invalid; code required / too short; invalid credentials; locked (`{minutes}`); challenge expired; network; generic |
| `footer.note` | "Restricted area. Sign-in attempts are logged and rate limited." |

## 4. Validation (before any request)

| Field | Rules |
| --- | --- |
| Email | required, ≤ 254 characters, valid email format (zod) |
| Access code | required, 4–64 characters. The real code length is never sent to the browser. |

The same limits are enforced again on the server (`src/lib/shared/auth/login-input.ts`).

## 5. Layout and motion

- Centred `max-w-sm` column on a faint dot grid: monogram + `Studio`, the card, the footer note.
- Card header strip: step indicator text and two progress segments (blue fills as you advance).
- Steps fade and slide 16px (0.28s); alerts expand and collapse; the button shows a spinner while busy and a check on success.
- Light and dark follow the OS. No scroll at 375×667 and up.

## 6. Acceptance criteria (verified 2026-11-23)

1. Empty and malformed emails show field errors and send nothing.
2. Any valid email reaches step 2; the response is identical for unknown emails.
3. A wrong code shows the alert, stays on step 2, and clears and refocuses the code field.
4. **Change email** returns to step 1 with the email filled in.
5. The right code redirects to `/studio/dashboard`.
6. `POST /api/auth/login` without step 1 returns 400 `challenge_expired` and doesn't count as a failed attempt.
7. Cross-origin POSTs return 403.
