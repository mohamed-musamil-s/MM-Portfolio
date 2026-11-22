# Features

Status key: **Done**, **Placeholder** (route exists, shows "Coming soon", functionality on hold), **Planned**.

## Public

| Feature | Route | Status |
| --- | --- | --- |
| Root redirect | `/` -> 302 `/maintenance` | Done |
| Maintenance page | `/maintenance` | Done: database-driven content, full-width type layout, countdown + calibration ruler, ticker, index rows ([spec](screens/MAINTENANCE_BUSINESS.md)) |
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
| Public design system spec ([STYLE.md](STYLE.md)) | Done (documented, not yet implemented in code) |
| Admin design system spec ([ADMIN_STYLE.md](ADMIN_STYLE.md)) | Placeholder, with provisional tokens used by shared components |
| Motion system ([ANIMATION_UI.md](ANIMATION_UI.md)) | Done: tokens, MotionProvider, shared hooks |
| `MagicIcon` (6 action-reactive icons) | Done (not yet used on any page) |
| `ActionButton` (6 methods, 2 variants) | Done (not yet used on any page) |
| WebGL halftone canvas | Specified, not built |
| Editorial motion components (InkReveal, Marquee, VelocitySkew, ParallaxLayer, CalibrationRig ...) | Done |
| Database-managed screen content (`site_screens`) + admin content API | Done (admin UI later) |
| UI styling of pages | Not started (intentionally) |
