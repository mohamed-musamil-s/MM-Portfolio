# MM-Portfolio Studio Design System

Version 1.4, 2026-11-23 (login illustration: labelled glass widget cluster). The design system for the admin studio: every `/studio/...` route. Its aim is **operational efficiency, precision, clarity and craft**. First screen built on it: [`/studio/login`](screens/STUDIO_LOGIN_BUSINESS.md) (screenshots: [light desktop](screens/studio-login/desktop-light-1440x900.jpg), [code step](screens/studio-login/desktop-code-1440x900.jpg), [1024×768](screens/studio-login/desktop-1024x768.jpg), [mobile](screens/studio-login/mobile-375x667.jpg)).

---

## 1. Scope and separation

| | Public portfolio ([STYLE.md](STYLE.md)) | Studio (this document) |
| --- | --- | --- |
| Surface | `[data-surface="public"]`, `PublicShell` | `[data-surface="studio"]`, `StudioShell` (`src/app/studio/layout.tsx`) |
| Feel | Editorial poster, monochrome ink, signal orange | Calm, neutral, precise operational UI |
| Colour | Ivory, ink, orange | Slate neutrals + one **blue** accent |
| Type | Inter Tight, JetBrains Mono, Permanent Marker | **Inter** (UI), system monospace (codes, emails, IDs) |
| Components | `ActionButton editorial-ink`, motion pieces | **shadcn/ui** (`src/components/studio/ui`), `ActionButton studio-action` |
| Motion | Kinetic, "200%" | Subtle, fast, purposeful (`studio` motion theme) |
| Extras | Grain, print motifs, custom cursor | None. No orange, no grain, no custom cursor. |

The two systems share only the toolchain (Tailwind v4, `tv()`, `cn()`) and the "MM." monogram, which the studio renders in its own text colour (`dot="letter"`, no orange).

## 2. Colour

### 2.1 Tokens

Names follow the shadcn/ui convention, so shadcn components work without edits. Values live on `[data-surface="studio"]` in `src/app/globals.css` and flip for dark mode under `prefers-color-scheme: dark` in that one place (components never use `dark:` for colour).

| Utility | Role | Light | Dark |
| --- | --- | --- | --- |
| `background` | App canvas (the shell adds drifting light fields on top) | `#F3F5FC` | `#0F172A` |
| `foreground` | Primary text | `#1E293B` | `#F1F5F9` |
| `card` / `card-foreground` | Cards, popovers | `#FFFFFF` / `#1E293B` | `#1E293B` / `#F1F5F9` |
| `primary` / `primary-foreground` | **The accent**: primary actions, focus, active and progress states | `#2563EB` / `#FFFFFF` | `#60A5FA` / `#0F172A` |
| `secondary` / `secondary-foreground` | Secondary buttons | `#F1F5F9` / `#1E293B` | `#273449` / `#F1F5F9` |
| `muted` / `muted-foreground` | Quiet surfaces / secondary text | `#F1F5F9` / `#475569` | `#273449` / `#94A3B8` |
| `accent` / `accent-foreground` | Hover tint on ghost and outline controls (not the brand accent) | `#EFF6FF` / `#1E3A8A` | `#172554` / `#BFDBFE` |
| `destructive` / `destructive-surface` | Errors, destructive actions / error alert fill | `#DC2626` / `#FEF2F2` | `#F87171` / `#2A1215` |
| `success` | Success marks (non-text) | `#15803D` | `#4ADE80` |
| `border` | Decorative hairlines (default border colour) | `#E2E8F0` | `#334155` |
| `input` | Form-field boundaries | `#7B8BA3` | `#64748B` |
| `ring` | Focus ring | `#2563EB` | `#60A5FA` |

### 2.1b Light pinning and the illustration palette

- `data-studio-theme="light"` pins a subtree to the light set even when the OS is dark: the light tokens are declared on `[data-surface="studio"], [data-studio-theme="light"]`, and the `dark:` variant is redefined (`@custom-variant dark`) to skip pinned subtrees. **The login is light-only.**
- Decorative palette for the login illustration and its gradient shade. Never used for UI states.

| Utility | Value |
| --- | --- |
| `aurora-blue` / `aurora-indigo` / `aurora-violet` | `#2563EB` / `#4F46E5` / `#6366F1` |
| `aurora-cyan` / `aurora-sky` | `#38BDF8` / `#7DD3FC` |
| `aurora-periwinkle` / `aurora-lavender` | `#A5B4FC` / `#C7D2FE` |
| `aurora-mist` / `aurora-ice` | `#EEF2FF` / `#CFFAFE` |

### 2.2 Contrast (WCAG 2.2)

| Pair | Light | Dark |
| --- | --- | --- |
| `foreground` on `card` | 14.6:1 | 13.4:1 |
| `muted-foreground` on `card` | 7.6:1 | 5.7:1 |
| `primary` on `card` (links, icons) | 5.2:1 | 5.8:1 |
| `primary-foreground` on `primary` (button text) | 5.2:1 | 7.0:1 |
| `destructive` on `card` | 4.8:1 | 5.3:1 |
| `input` boundary on `card` (1.4.11 non-text) | 3.5:1 | 3.1:1 |

### 2.3 Rules

- **Blue is used intentionally:** primary buttons, focus rings, the active step, progress, links. Never as a large background or decoration.
- Hairlines (`border`) are decorative; anything a user must find (inputs, toggles) uses `input` or stronger.
- Errors always pair colour with an icon and words; never colour alone.
- No orange, no ink-on-ivory, no gradients on controls.

## 3. Typography

- **UI:** Inter (next/font, `--font-studio-inter`), utility `font-ui`, set on the surface.
- **Code:** system monospace, utility `font-code`, for access codes, emails shown as values, IDs and timestamps.
- Scale (Tailwind defaults): `text-xs` 12px (meta, step indicator), `text-sm` 14px (body, labels, buttons), `text-base` 16px (inputs on phones, to stop iOS zoom), `text-xl` 20px semibold `tracking-tight` (card titles), `text-2xl` 24px (page titles).
- Numbers that change use `tabular-nums`.

## 4. Spacing, layout and shape

- **4px base grid.** Use Tailwind steps: 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), 12 (48px).
- Cards: `rounded-xl`, 1px `border`, `shadow-sm`, internal padding 24px (`px-6`, `py-6`), 24px between groups.
- Controls: `rounded-md`; inputs and buttons `h-10` in forms (`h-9` in dense tables later).
- Focus: a 3px `ring/50` halo plus a `ring` border on every interactive element (`focus-visible`).
- **Auth layout: split screen, light only.** `lg` and up: two columns (`1.15fr / 1fr`, `1.6fr / 1fr` from `xl`). The illustration fills the whole brand panel; the logo row floats over its top edge. Left, an inset (`m-3 rounded-3xl`) brand panel with a **light gradient shade** (mist base, periwinkle top-left, lavender top, sky bottom-left, washing to white at the bottom right, two faint diagonal light streaks), a **labelled glass widget cluster** in gently tilted 3D (an Overview card with a visitor count, delta badge, gradient area chart and day labels; an uptime ring; a recent-activity list; an auto-sync toggle chip; a secure-session badge), sized to fill the panel. Labels are generic UI copy from the database, never real data or feature names. Right, the form in a 400px column. Below `lg`: a compact gradient band on top, the form below.
- Glass surfaces (`bg-card/80`, `border-card`, `backdrop-blur-xl`) only sit on the gradient panel.

## 5. Components (shadcn/ui)

Generated with the shadcn CLI (`components.json`, style `new-york`) into `src/components/studio/ui/`, then adapted to the project rules:

| Component | Notes |
| --- | --- |
| `Button` | Variants `default` (primary), `secondary`, `outline`, `ghost`, `destructive`, `link`; sizes `xs`–`lg`, `icon*`. Recipes use the project `tv()` (not `cva`). |
| `Card` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`. |
| `Input` | `border-input`, focus ring, `aria-invalid` turns it destructive. |
| `Label` | Radix label. |
| `Form` | react-hook-form + zod (`@hookform/resolvers`). `FormLabel`/`FormControl`/`FormMessage` wire `htmlFor`, `aria-invalid` and `aria-describedby`. |
| `Alert` | `default` and `destructive` (tinted `destructive-surface` fill, `destructive/40` border). |
| `Tooltip` | Dark bubble (`bg-foreground text-background`). Every icon-only button gets one, plus an `aria-label` with the same text. |
| `InputOTP` | One box per digit (`h-14`, `rounded-xl`, `text-2xl`), separated boxes in a grid. Added a `masked` prop to `InputOTPSlot` so secrets show as dots. `animate-caret-blink` keyframes live in globals.css. |

Icons: `lucide-react`, 16px, `aria-hidden` when next to text. Navigation icons are MagicIcons (`dashboard`, `release`, `content`, `resume`, `chat`, `analytics`, `logout`, `panel`).

shadcn's enter/exit animations (`animate-in`, `slide-in-from-left`, …) come from **`tw-animate-css`**, imported in `globals.css`.

Patterns used by the login: an **icon tile** above each step's title (48px, `rounded-2xl`, primary → indigo gradient, white icon); a **segmented progress** bar (one segment per step, gradient fill, current step name and `n/total` above); an **identity chip** (gradient avatar initial, email, a pencil icon button with a tooltip to change it); `h-12 rounded-xl` fields with a 4px soft focus ring; **code boxes** `h-16 rounded-2xl` that tint (`border-primary/50 bg-primary/5`) once filled; a **gradient primary button** (`from-primary to-aurora-indigo`, coloured shadow, brightens on hover). Shared classes live in `src/components/studio/login/auth-styles.ts`.

Add shadcn components with **`npm run ui:add -- <name>`** (`scripts/shadcn-add.mjs`). The shadcn registry currently imports `cn` from an unrelated npm package of that name and installs it; the wrapper rewrites those imports to `@/lib/shared/cn` and uninstalls the package.

**Overlays.** Radix portals render at the end of `<body>`, outside the page's `[data-surface]` wrapper. `BodyScope` (in `StudioShell`, and with `theme="light"` on the login) mirrors the surface, the pinned theme and the Inter font variable onto `<body>` while a studio page is mounted. The dark token rule is `[data-surface="studio"]:not([data-studio-theme="light"])`, so a pin on the same element wins.

Shared components keep working on this surface: `ActionButton variant="studio-action"` now uses these token names (`border-input`, `bg-card`, `primary`, `destructive`).

## 6. Motion

Uses the `studio` theme in `src/lib/motion/tokens.ts`: 0.12 / 0.18 / 0.28s, `ease-print`, stiff springs, 0.97 press, no magnetism, no smooth scroll.

- Step and view changes: fade + 24px slide, 0.28s, out then in.
- Brand panel: gradient fields drift on 24–30s loops. The widget cluster leans up to 5° toward the pointer; each widget rises in and then bobs on its own loop; the chart line draws and its area fades in, the end point pulses, the uptime ring fills, activity rows slide in, the sync icon turns and the toggle switches on.
- SVG gradients: set `stop-color` through `style` (`style={{ stopColor: "var(--…)" }}`); the `stopColor` attribute doesn't accept CSS variables.
- Alerts: height + opacity in and out, 0.18s, so the layout never jumps.
- Progress indicators: `scaleX` from the left.
- Spinners only inside the control that is busy (`LoaderCircle` + `animate-spin`).
- Reduced motion: slides become fades; nothing moves more than opacity.

## 7. Accessibility

- Every field has a visible label; placeholders are examples, never labels.
- Errors are announced: field messages via `aria-describedby`, form-level alerts with `role="alert"`.
- After a failed submit, focus returns to the field that needs attention.
- Tap targets are at least 36px (`h-9`); primary actions 40px (`h-10`).

## 8. To be defined (with the next modules)

- [ ] App shell: sidebar / top bar, page header, breadcrumbs
- [ ] Tables, filters, empty states, pagination
- [ ] Dialogs, sheets, toasts, dropdowns
- [ ] Data visualisation rules (analytics)
