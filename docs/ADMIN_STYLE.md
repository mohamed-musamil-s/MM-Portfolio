# MM-Portfolio Studio Design System

> **Status: placeholder.** This file reserves the admin design system. Its contents will be defined later.

## Scope

This document will govern the **admin studio only**: every `/studio/...` route, including:

- `/studio/login`
- `/studio/dashboard`
- `/studio/release`
- `/studio/content`
- `/studio/resume`
- `/studio/chat`
- `/studio/analytics`

The public portfolio follows [STYLE.md](STYLE.md) instead. The two systems share nothing. In particular, the studio must not use:

- the public tokens (`[data-surface="public"]`);
- the public fonts;
- the paper grain, the print motifs, or the grayscale image treatment.

## Already decided

- **Styling is Tailwind CSS v4**, the same toolchain and conventions as the public site: utilities on the element, `tv()` for variants, `cn()` for conditional classes, no `@apply`, and no arbitrary values except for true one-offs.
- **Tokens follow the same name/value split.**
  - The values go on `[data-surface="studio"]` in `src/app/globals.css`.
  - The studio's own names are mapped in a separate `@theme inline` block.
  - The studio must not reuse the public names (`paper`, `ink`, `font-grotesk`, `text-display`, and so on). They resolve to nothing outside the public surface.
- **No default palette.** Tailwind's default palette is turned off for the whole project, so every studio color needs a token too.

## To be defined

- [ ] Visual direction and reference material
- [ ] Color tokens, contrast rules, light and dark mode
- [ ] Typography scale and font pairing
- [ ] Layout: app shell, sidebar or top bar, content grid, spacing
- [ ] Components: buttons, forms, tables, cards, navigation, modals, toasts
- [ ] Login screen (`/studio/login`)
- [ ] Data visualization rules (for analytics)
- [ ] Motion and accessibility
- [ ] Token reference and how the tokens are scoped in code
