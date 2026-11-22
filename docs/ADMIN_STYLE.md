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

## Provisional tokens (in use by shared components)

> **Provisional.** These values exist only so that the shared components (`ActionButton variant="studio-action"`, `MagicIcon` error colour) work on the studio surface. Treat them as placeholders: the real studio design replaces them.

They are defined on `[data-surface="studio"]` in `src/app/globals.css` and mapped to Tailwind names in a separate `@theme inline` block.

| Tailwind name | Variable | Value | Role | Contrast |
| --- | --- | --- | --- | --- |
| `canvas` | `--studio-canvas` | `#F7F7F8` | App background | n/a |
| `panel` | `--studio-panel` | `#FFFFFF` | Cards, buttons, inputs | n/a |
| `fg` | `--studio-fg` | `#111113` | Primary text | 18.9:1 on panel |
| `fg-muted` | `--studio-fg-muted` | `#5D5D66` | Secondary text | 6.5:1 on panel |
| `line` | `--studio-line` | `#DCDCE1` | Hairline borders (decorative) | 1.4:1 |
| `accent` | `--studio-accent` | `#1F4FFF` | Focus, active border, progress, pressed toggle | 5.8:1 on panel |
| `on-accent` | `--studio-on-accent` | `#FFFFFF` | Text on accent | 5.8:1 |
| `glow` | `--studio-glow` | `rgb(31 79 255 / 0.22)` | Focus ring | n/a |
| `danger` | `--studio-danger` | `#D92D20` | Errors, destructive actions, `--icon-error` | 4.8:1 on panel |
| `success` | `--studio-success` | `#0E8A5F` | Success border and pulse (non-text only) | 4.4:1, so don't use it for small text |

**Motion:** the `studio` theme in `src/lib/motion/tokens.ts` sets fast, stiff springs, 0.12 to 0.28s durations, a 0.97 press detent, no magnetism and no smooth scroll. See [ANIMATION_UI.md](ANIMATION_UI.md) §4.

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
