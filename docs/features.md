# Features

Status key: **Done**, **Placeholder** (route exists, shows "Coming soon", functionality on hold), **Planned**.

## Public

| Feature | Route | Status |
| --- | --- | --- |
| Root redirect | `/` -> 302 `/maintenance` | Done |
| Maintenance page | `/maintenance` | Placeholder |
| Custom 404 | `/404`, unknown routes 302 here | Placeholder |
| Public portfolio | TBD | Planned (not started) |

## Studio (admin)

| Feature | Route | Status |
| --- | --- | --- |
| Login | `/studio/login` | Done (functional form, unstyled) |
| Session management | MongoDB `sessions` | Done |
| Route protection | proxy + `requireSession()` | Done |
| Sign out | nav button -> `POST /api/auth/logout` | Done |
| Dashboard | `/studio/dashboard` | Placeholder |
| Release | `/studio/release` | Placeholder |
| Content | `/studio/content` | Placeholder |
| Resume | `/studio/resume` | Placeholder |
| Chat | `/studio/chat` | Placeholder |
| Analytics | `/studio/analytics` | Placeholder |

## Platform

| Feature | Status |
| --- | --- |
| MongoDB Atlas connection with logging and retry | Done |
| Centralized logging (pino) | Done |
| Standard API responses (200 / 302 / 4xx / 500) | Done |
| Health check `GET /api/health` | Done |
| Security headers | Done |
| Login brute-force lockout | Done |
| UI design / styling | Not started (intentionally) |
