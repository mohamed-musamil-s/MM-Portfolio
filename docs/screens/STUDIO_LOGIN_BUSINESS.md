# Screen: `/studio/login`, Business Spec

Version 1.2, 2026-11-23 (light-only, gradient brand panel with a 3D workspace illustration). Two-step sign-in for the admin studio: **email → Continue → access code → Authenticate**. Studio surface ([ADMIN_STYLE.md](../ADMIN_STYLE.md)), shadcn/ui components. Screenshots: [light desktop](studio-login/desktop-light-1440x900.jpg), [code step](studio-login/desktop-code-1024x768.jpg), [mobile](studio-login/mobile-375x667.jpg).

## 1. Purpose

Let the single admin into the studio quickly, without making the login an easy target. The screen is calm and precise, and clearly separate from the public portfolio.

## 2. Flow

| Step | User sees | Request | Outcomes |
| --- | --- | --- | --- |
| 1. Email | "Admin Access", email field, **Continue** | `POST /api/auth/initiate-login { email }` | 200 → step 2 (sets the 10-minute `mm_login_challenge` cookie). 400 invalid email. 429 locked out (button disabled until it expires). |
| 2. Access code | "Enter your access code", an identity row (avatar initial, email, **Change email**), one masked box per digit with show/hide (submits by itself on the last digit), **Authenticate** | `POST /api/auth/login { email, accessCode }` | 200 → session cookie → redirect to `/studio/dashboard` (or the safe `?next=`). 401 "email or access code is incorrect": stays on step 2, clears the boxes and focuses the first one. 400 `challenge_expired` → back to step 1 with a message. 429 locked out. |

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
| `steps` | `Email` · `Access code` (the two step pills) |
| `showcase` | status `All systems online` · headline `Operate the studio.` · body · workspace `Workspace` · modules (the floating pills, up to 5) `Releases and feature flags`, `Portfolio content`, `Website analytics`, `Expenses and budget` · footer `© 2026 Studio`. The window title in the illustration is `brand.name`. |
| `emailStep` | `Welcome back` · "Sign in with your authorized email address to continue." · `Email address` · `name@example.com` · `Continue` · `Checking…` |
| `codeStep` | `Enter your access code` · "Type your access code to finish signing in." · `Access code` · `Authenticate` · `Verifying…` · `Change email` · `Signed in. Opening the studio…` · `Show access code` / `Hide access code` |
| `errors` | `Couldn't sign in` (alert title); email required / invalid; code required / too short; invalid credentials; locked (`{minutes}`); challenge expired; network; generic |
| `footer.note` | "Restricted area. Sign-in attempts are logged and rate limited." |

## 4. Validation (before any request)

| Field | Rules |
| --- | --- |
| Email | required, ≤ 254 characters, valid email format (zod) |
| Access code | required, 4–64 characters. The real code length is never sent to the browser. |

The same limits are enforced again on the server (`src/lib/shared/auth/login-input.ts`).

## 5. Layout and motion

- **Split screen** from `lg`, **light only** (pinned with `data-studio-theme="light"`, so it stays light when the OS is dark).
- Left: a light gradient brand panel (periwinkle, lavender and sky shades drifting) with the monogram and status pill on top, a tilted 3D workspace illustration in the middle (glass window, chart card, line chart, gauge, module pills floating out), and the headline, body and footer at the bottom. Right: the form in a 400px column with the brand name top-right and the security note at the bottom.
- Below `lg`: a compact gradient band (monogram, status, headline) above the form.
- Step pills show progress; steps fade and slide 24px (0.28s); alerts expand and collapse; the button shows a spinner while busy and a check on success.
- **Code boxes.** When `ADMIN_ACCESS_CODE` is 4–8 digits, the page renders one box per digit (the count comes from the server). This shows the code's length, which the lockout makes an acceptable trade for faster entry. Any other code format gets a single masked field instead.
- No scroll at 1440×900, 1280×720, 1024×768 or 375×667 (the panel tightens at heights ≤ 800px).

## 6. Acceptance criteria (verified 2026-11-23)

1. Empty and malformed emails show field errors and send nothing.
2. Any valid email reaches step 2; the response is identical for unknown emails.
3. A wrong code (auto-submitted on the 4th digit) shows the alert, stays on step 2, clears the boxes and focuses the first one.
4. **Change email** returns to step 1 with the email filled in.
5. The right code redirects to `/studio/dashboard`.
6. `POST /api/auth/login` without step 1 returns 400 `challenge_expired` and doesn't count as a failed attempt.
7. Cross-origin POSTs return 403.
