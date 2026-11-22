# MM-Portfolio Public Design System

Version 1.3, 2026-11-22. Source artwork: `docs/reference/Gemini_MM.png` (the "Musamil" editorial poster).

**Styling is done with Tailwind CSS v4.** Every rule below names the utility classes that implement it. The token layer is `src/app/globals.css`.

---

## 1. Scope and separation

**This document governs the public portfolio only:**

- `/` (currently redirects to `/maintenance`)
- `/maintenance`
- `/404` and the not-found screen
- every future public showcase page

**It does not apply to the admin studio.** Every `/studio/...` route, including `/studio/login`, uses its own design system, defined separately in `docs/ADMIN_STYLE.md`. None of the tokens, fonts, textures or print motifs below may leak into the studio.

### How the separation is enforced in code

`src/app/globals.css` splits tokens into **names** and **values**.

- **Names (Tailwind utilities).** `@theme inline` declares them: `bg-paper`, `text-ink`, `font-grotesk`, `text-display`, `px-page` and so on. Each one points at a CSS variable.
- **Values (the variables).** They live only on the public surface:

  ```css
  @layer base {
    [data-surface="public"] { --bg-primary: #f4f3ee; /* ... */ }
  }
  ```

- **What that achieves.** Because the theme is `inline`, a public utility used outside the public surface resolves to an undefined variable and renders as nothing. The poster theme therefore can't quietly style a studio page.
- **No default palette.** `@theme { --color-*: initial; }` removes Tailwind's built-in colors, so classes like `bg-red-500` or `text-white` don't exist anywhere in the project.
- **The shell.** Public pages render inside a `PublicShell` component. It sets `data-surface="public"` and adds the `next/font` class names. Two ways to use it:
  - public routes move into an `app/(public)/` route group whose layout wraps them in the shell;
  - `not-found.tsx` lives at the app root, so it wraps its own content in `PublicShell`.
- **The studio** will get its own `[data-surface="studio"]` values and token names (see `ADMIN_STYLE.md`). It never renders inside `PublicShell`.

### Tailwind conventions

- **Style with utilities on the element.** Don't write inline `style` attributes or CSS modules, and don't use `@apply` for components.
- **Colors come only from tokens** (`bg-paper`, `text-ink`, `border-rule`). There's no default palette to fall back on.
- **Variants use `tv()`** from `tailwind-variants`. Type a component's variant props with `VariantProps`.
- **Conditional classes go through `cn()`** (`src/lib/shared/cn.ts`, clsx + tailwind-merge). Put the incoming `className` last so it can override defaults.
- **Prefer on-scale values and named tokens.** An arbitrary `[...]` value is a last resort, for a true one-off.
- **Class order is automatic.** `prettier-plugin-tailwindcss` sorts classes; run `npm run format`.
- **Mobile-first:** write the base classes for mobile, then layer `sm:`, `md:` and `lg:` on top.

---

## 2. Color

### 2.1 Tokens

The palette is warm ivory paper and carbon ink, plus **exactly one accent: signal orange** (added 2026-11-22). Orange is a *signal*, not a theme colour. It marks a few specific things (see 2.5); links, focus, success and error states stay ink.

| CSS variable | Hex | Tailwind name | Role |
| --- | --- | --- | --- |
| `--bg-primary` | `#F4F3EE` | `paper` | Archival ivory paper. Full-viewport canvas behind every public page. |
| `--bg-surface` | `#EAE8E1` | `newsprint` | Aged newsprint tint. Cards, blocks, image placeholders, input fills. |
| `--text-primary` | `#0A0A0A` | `ink` | Screen-print carbon ink. All headings, body text, the wordmark, primary buttons. |
| `--text-secondary` | `#2E2E2E` | `graphite` | Charcoal graphite. Microtext, metadata, captions, secondary labels. |
| `--border-ink` | `#141414` | `rule` | Hairline rules, frames, registration marks, crosshairs. |
| `--signal` | `#E8480F` | `signal` | **The single accent.** Non-text marks only (see 2.5). |

Each name works with every color utility: `bg-paper`, `text-ink`, `border-rule`, `outline-ink`, `fill-ink`, `stroke-rule`, `decoration-ink`.

These are the only six color values allowed. Every other tone is one of them with opacity applied (see 2.4).

Measured from the poster, the paper is `#F7F5E9` and the ink is pure black. The tokens deliberately pull the paper slightly away from yellow and lift the ink off `#000`, which keeps large ivory areas from looking tinted on screens and softens the black-on-ivory glare in long text.

> The CSS variable `--text-primary` is a **color**. Tailwind's `--text-*` theme namespace holds **font sizes**, so the brief's variable names stay on the surface and never go into `@theme`. Utilities use the names in the third column.

### 2.2 Contrast (WCAG 2.2)

| Foreground | On `bg-paper` | On `bg-newsprint` | Allowed use |
| --- | --- | --- | --- |
| `text-ink` `#0A0A0A` | 17.8 : 1 | 16.2 : 1 | Any text size (AAA). |
| `rule` `#141414` | 16.6 : 1 | 15.0 : 1 | Rules and marks; text too if needed. |
| `text-graphite` `#2E2E2E` | 12.2 : 1 | 11.1 : 1 | Any text size (AAA). |
| `text-paper` on `bg-ink` (inverted) | 17.8 : 1 | | Inverted blocks and buttons. |
| `signal` `#E8480F` | 3.5 : 1 | 3.2 : 1 | Graphics and large type only (WCAG 1.4.11 needs ≥ 3 : 1). **Never body or label text.** |

### 2.3 Contrast rules

1. Text is always ink on paper or paper on ink. Never place `text-graphite` on a `bg-ink` block; use `text-paper` there.
2. Opacity variants (2.4) are **never** used for text that carries meaning, because they drop below 4.5 : 1.
3. Text placed over imagery sits on a solid `bg-paper` or `bg-ink` plate, never directly on the photo.
4. State is never shown by colour alone. Errors, success and the current page use words, icons, rules or weight. Orange may reinforce a state; it never carries it alone.

### 2.5 Signal orange: where it may appear

Use it sparingly: at most about six marks per screen, and never as a large fill behind text.

| Allowed | Example (maintenance screen) |
| --- | --- |
| Live or status beacons | Pulsing status dot (`StatusDot`) |
| A single typographic accent | The headline's final full stop |
| Progress and "now" indicators | The ruler's elapsed line and now dot |
| One accent inside an illustration | The cursor and landing rings in `BuildScene` |
| Hover affordances | The 2px rule drawn across a pillar on hover |
| Brand tile detail | The small square on the logo tile |
| Ambient light | One blurred background glow at 9% opacity |

**Never** use it for text smaller than `text-h2`, links, focus rings, buttons' base fill, error states, or more than one element competing in the same area.

### 2.4 Derived tones

Derived tones are opacity applied to the base tokens, using Tailwind's `/` modifier. They are not new hex values.

| Use | Classes |
| --- | --- |
| Halftone dots on imagery | `bg-ink/12` |
| Disabled controls (always paired with `aria-disabled`; exempt from contrast rules) | `text-ink/40 border-ink/40` |
| Construction lines | `stroke-ink/60` |
| Paper grain overlay (range 3% to 5%) | `opacity-4` |

### 2.6 Dark mode

The public site has **no dark mode**: the ivory paper is the brand.

- The public surface sets `color-scheme: light`.
- Never use the `dark:` variant in public components.
- Inverted sections (`bg-ink text-paper`, like the black label box on the poster's collar) are allowed as deliberate editorial moments. They are not a theme.

---

## 3. Typography

### 3.1 Font pairing

The poster uses three voices. The headline and the slash-separated labels are a **bold, regular-width neo-grotesque**, not a condensed face. The name is **dry-brush marker lettering**. Edge annotations such as `EST. 2000` and `XXX` are **technical markings**.

| Role | Typeface | Weights | Utility |
| --- | --- | --- | --- |
| Display and headlines | **Inter Tight** | 700, 800 | `font-grotesk font-extrabold` |
| Body | **Inter Tight** | 400, 500 | `font-grotesk font-normal` |
| Editorial labels (poster style) | **Inter Tight** | 700 | `font-grotesk font-bold` |
| Technical microtext | **JetBrains Mono** | 400, 500 | `font-technical` |
| Brush wordmark "Musamil" | **Custom SVG** traced from the poster | n/a | `public/brand/musamil-wordmark.svg` |
| Brush accents (other words) | **Permanent Marker** | 400 | `font-brush` |

Why these:

- **Inter Tight, not Anton or Oswald.** The poster's "CREATE. INSPIRE. ELEVATE." is a regular-width Helvetica-style bold. Inter Tight ExtraBold matches its proportions; Anton and Oswald are condensed and would read as a different poster.
- **The wordmark is an SVG asset, not a font.** No web font reproduces the poster's lettering: the slant, the dry-brush edges, the long descending "M" stroke. Trace it once and use it as a logo.
- **Permanent Marker for other brush words.** It's the closest open-source match in weight. Caveat Brush is too light and casual next to the wordmark.

**Loading the fonts.** Load them with `next/font/google`, which self-hosts them (no request to Google at runtime). Use `display: "swap"` and these `variable` names:

| `next/font` import | `variable` |
| --- | --- |
| `Inter_Tight` | `--font-inter-tight` |
| `JetBrains_Mono` | `--font-jetbrains-mono` |
| `Permanent_Marker` | `--font-permanent-marker` |

`PublicShell` puts those three class names on its root element. The public surface then maps them to `font-grotesk`, `font-technical` and `font-brush`.

### 3.2 Type scale

Mobile-first. The fluid sizes use `clamp()` and scale between a 360px and a 1440px viewport. Each utility sets size, line height and tracking together.

| Utility | Size | Line height | Tracking | Pair with |
| --- | --- | --- | --- | --- |
| (wordmark SVG height) | `clamp(5rem, 20vw, 18rem)` via `text-wordmark` + `h-[1em]` | 0.85 | n/a | brush SVG |
| `text-display` | `clamp(3.5rem, 10vw, 9rem)` | 0.92 | `-0.02em` | `font-grotesk font-extrabold uppercase` |
| `text-h1` | `clamp(2.5rem, 6vw, 5rem)` | 0.95 | `-0.015em` | `font-grotesk font-extrabold uppercase` |
| `text-h2` | `clamp(1.75rem, 3.5vw, 3rem)` | 1.0 | `-0.01em` | `font-grotesk font-extrabold uppercase` |
| `text-h3` | `clamp(1.25rem, 2vw, 1.75rem)` | 1.1 | `0` | `font-grotesk font-bold uppercase` |
| `text-lead` | `clamp(1.125rem, 1.6vw, 1.375rem)` | 1.45 | `0` | `font-grotesk` |
| `text-body` | `1rem` (16px), `1.0625rem` from 1024px | 1.6 | `0` | `font-grotesk` |
| `text-label` | `0.8125rem` (13px) | 1.3 | `0.04em` | `font-grotesk font-bold uppercase` |
| `text-micro` | `0.6875rem` (11px) | 1.4 | `0.2em` | `font-technical uppercase` |
| `text-micro-deco` | `0.625rem` (10px) | 1.4 | `0.25em` | `font-technical uppercase`, decorative only |

Don't use Tailwind's default `text-sm`, `text-xl` and so on in public components. They aren't part of this scale.

### 3.3 Typography rules

**Headlines**

1. Headlines use the `uppercase` utility. Type the source text in normal case so screen readers don't spell it out letter by letter.
2. A headline can end with full stops between words, as in `CREATE. INSPIRE. ELEVATE.` This is the signature cadence. Use it only for short manifesto lines of 2 to 4 words.
3. Underline a headline with a **partial rule**: a `<span aria-hidden>` beneath it with `block h-0.5 w-[70%] bg-ink mt-[0.35em]`. That's a 2px ink rule, shorter than the text, exactly as on the poster.

**Brush lettering**

4. Brush lettering appears **at most once per viewport**.
   - It is never used for UI controls, body copy, or anything under 48px.
   - It can overlap imagery: on the poster, the wordmark crosses the portrait.
   - Overlapping text must not cover a face, and must not cover any other text.

**Labels and microtext**

5. Labels follow the poster's slash pattern, `MINDSET / AMBITION / FREEDOM`: words separated by ` / ` with a regular space on each side. Wrap the separators in `aria-hidden` spans, or write them as a list.
6. Technical microtext (`font-technical`) is for metadata only: dates, indices, coordinates, figure numbers, `EST. 2000`.
   - The smallest readable size is `text-micro` (11px). `text-micro-deco` is only for `aria-hidden` decoration.
   - Vertical edge annotations use `[writing-mode:vertical-rl] rotate-180`, so they read bottom to top as on the poster's right edge.

**Body text**

7. Body text runs at most 68 characters wide (`max-w-[68ch]`), is left-aligned and has a ragged right edge. Never use `text-justify`.
8. Use only two weights per screen in the grotesk (for example `font-extrabold` and `font-normal`). Use bold as structure, never as decoration.

---

## 4. Layout, spacing and grid

### 4.1 Spacing scale

Spacing uses Tailwind's default 4px (`0.25rem`) scale. Only these steps are allowed:

| Step | px | Example | Step | px | Example |
| --- | --- | --- | --- | --- | --- |
| `1` | 4 | `gap-1` | `8` | 32 | `p-8` |
| `2` | 8 | `gap-2` | `12` | 48 | `mt-12` |
| `3` | 12 | `gap-3` | `16` | 64 | `py-16` |
| `4` | 16 | `p-4` | `24` | 96 | `py-24` |
| `6` | 24 | `gap-6` | `32` | 128 | `py-32` |
| | | | `48` | 192 | `py-48` |

Section rhythm: `py-24` on mobile and `lg:py-48` on desktop. Use `gap-*` between siblings rather than margins.

### 4.2 Frame and margins

These are measured from the poster and expressed as fractions of the viewport.

| Utility | Value | Meaning |
| --- | --- | --- |
| `frame` (as in `inset-frame`, `top-frame`, `p-frame`) | `clamp(16px, 3.5vw, 56px)` | Distance from the viewport edge to the registration crosshairs. |
| `page` (as in `px-page`, `left-page`) | `clamp(24px, 7vw, 128px)` | Distance from the edge to text content (the poster's left text column). |
| `max-w-poster` | `1440px` | The grid stops growing here. The paper background keeps going. |

### 4.3 Swiss editorial grid

- The grid is `grid grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12`.
- **The layout is asymmetric by default.** The hero follows the poster:
  - Columns 1 to 5 are mostly empty paper. At least 40% of the canvas stays open.
  - The image fills `lg:col-start-5 lg:col-end-13` and **bleeds off the right edge**.
  - Text anchors to the **bottom-left** of the empty field, about two-thirds of the way down (`self-end`).
- Never center a hero composition. Center alignment is only for the single status line on very small screens.
- The space is split by stark 1px rules (`border-t border-rule`), never by background color changes or shadows. One structural rule per section edge is enough.
- **Negative space is content.** Don't fill the empty field with stock graphics, gradients or extra copy.

### 4.4 Shape rules

- **No radius.** Never use `rounded-*` in public components. The default is square; write `rounded-none` only when overriding a primitive.
  - The **only** curves in the system are the crosshair circles (`rounded-full` inside the mark component), the bullseye mark, the brush lettering, **status dots** and the **blurred background glow**.
- **No shadows.** Never use `shadow-*` or `drop-shadow-*`. Depth comes from overlap and rules, as in print.
- **Borders:** always `border border-rule` (1px). The heavy rule is 2px (`border-b-2 border-ink` or `h-0.5 bg-ink`), used only for headline underlines and the active nav item.

---

## 5. Signature print motifs and texture

Every motif is decorative and must carry all of the following:

- `aria-hidden="true"`
- `pointer-events-none`
- no place in the tab order
- `print:hidden`

### 5.1 Registration crosshair

This is the core mark: a circle with a cross through it, the cross extending past the circle.

| Property | Value |
| --- | --- |
| Circle diameter | `size-6` (24px) on desktop, `size-4.5` (18px) on mobile |
| Cross length | 1.5 × the diameter, centered |
| Stroke | 1px `stroke-rule`, `fill-none` |
| Placement (desktop) | 4 corners at `inset-frame`, plus the midpoints of the top, bottom, left and right edges |
| Placement (below 640px) | 4 corners only; the midpoint marks get `hidden sm:block` |

- **Corner companions.** A corner crosshair can carry a 64px hairline just below it (`h-px w-16 bg-rule`), plus a 40px vertical tick beside it (`h-10 w-px bg-rule`), mirroring the poster's top-left corner.
- **Bullseye variant.** A crosshair with a solid ink dot (40% of the diameter) at its center. Use it at most twice per screen, top-right and bottom-right, to mark the "registered" corner.
- Build the crosshair once as an inline SVG component, `<RegistrationMark variant="open" | "bullseye" />`, with a `tv()` recipe. Don't use the text glyph `⊕`, because its rendering varies by font.

### 5.2 Crop marks

Crop marks are L-shaped corner ticks drawn outside a framed image.

- Each leg is 12px long (`w-3` or `h-3`), 1px `bg-rule`.
- The marks sit 8px outside the image's bounding box (`-top-2 -left-2`, and so on).
- Use them on feature images and the maintenance or 404 frame, never on small thumbnails.

### 5.3 X marks

These are hand-drawn crossed strokes, as on the poster's right edge.

- Use an SVG with slightly irregular strokes, 1.5px, `stroke-ink`.
- Place 1 or 2 per screen, near an edge, as rhythm markers. Never use them as a close or delete icon. That needs a clean, geometric UI icon, so it isn't confused with decoration.

### 5.4 Newsprint dividers and columns

- **Section divider:** `border-t border-rule`. You can put a mono label at its left end, for example `01 / WORK`, styled `-translate-y-1/2 bg-paper pr-3 font-technical text-micro uppercase`.
- **Newsprint column texture.** The poster's columns of small text behind the portrait are a **texture layer**, shipped as a raster or SVG image.
  - Never put lorem-ipsum text in the DOM: it's selectable, gets indexed, and is read aloud by screen readers.
  - If real text forms the texture (for example project notes), it must be real content at `text-micro` or larger.

### 5.5 Construction lines

Use thin straight SVG strokes (0.75px, `stroke-ink/60`) that cross the edges of an image at an angle, like the sketch lines around the sunglasses. Use at most 3 per image, and only on hero imagery.

### 5.6 Paper grain overlay

Render the grain as one element inside `PublicShell`:

```tsx
<div
  aria-hidden
  className="pointer-events-none fixed inset-0 z-50 bg-[url(/textures/grain.svg)] bg-size-[256px] opacity-4 mix-blend-multiply print:hidden contrast-more:hidden"
/>
```

- `grain.svg` is tiled `feTurbulence` noise.
- Adjust the opacity only within `opacity-3` to `opacity-5`.
- The grain is static. **Never animate it** (no flickering film grain), because animating a full-screen layer costs frame rate.
- It sits above content (`z-50`) but below focus rings and any open modal (`z-100`).
- `contrast-more:hidden` removes it for users who ask the system for more contrast.

### 5.7 Halftone

Halftone belongs on **imagery only**, not on flat surfaces.

- Overlay the image frame with a dot pattern: an absolutely positioned element using `bg-[radial-gradient(var(--text-primary)_1px,transparent_1px)] bg-size-[4px_4px] opacity-12`.
- Or bake the halftone into the image asset itself.

---

## 6. Components

Components with variants define a `tv()` recipe in a `*.styles.ts` file next to the component. Variant props come from `VariantProps<typeof recipe>`.

### 6.1 Buttons

All public buttons are `<ActionButton variant="editorial-ink">`. That's the default under `<MotionProvider theme="portfolio">`. The behaviour, the method matrix and the state machine are specified in [ANIMATION_UI.md](ANIMATION_UI.md) §8; this section only fixes the look.

- **Base:** `min-h-11 border border-ink bg-paper px-6 py-3.5 font-grotesk text-label font-bold uppercase text-ink`. Radius 0, no shadow.
- **Hover and focus (ink wipe):**
  - an ink layer scales in from the left over 0.48s with `ease-print`;
  - the label inverts with `mix-blend-difference` (paper text over the paper or ink layer);
  - four registration crosshairs slide in and lock onto the corners.
- **Magnetic pull:** the button drifts toward a cursor within 72px. Fine pointers only, and off under reduced motion.
- **Press:** scale 0.98.
- **Focus ring:** `outline-2 outline-offset-3 outline-ink`. Always visible on `:focus-visible`.
- **Loading, success, error:**
  - the ink layer shows progress, completes on success, and drains on error;
  - on error the button shakes and shows a mono badge (for example `401`) in ink. **No red.**
- **Disabled:** `opacity-40`, plus `aria-disabled` on links.
- **Text link style:** for inline text links use the link rules in 6.2, not a button.

### 6.2 Links

- **Inline links:** `text-ink underline decoration-1 underline-offset-3 hover:decoration-2`.
- There's **no color change** for hover or visited links. Weight and underline carry the state.
- **External links** end with a small mono `↗`, and include an `aria-label` that mentions the new tab when one opens.
- **Label links** (nav and footer) use `text-label font-bold uppercase no-underline hover:underline`.

### 6.3 Navigation

The navigation mirrors the poster's top-right label, `MINDSET / AMBITION / FREEDOM`.

- **Desktop:**
  - A single row of label links separated by ` / ` (`hidden md:flex items-center gap-2`), top-right, aligned to `px-page`.
  - No bar, background or logo block.
  - A small brush or grotesk monogram sits top-left.
- **Current page:** `aria-current="page"` plus `aria-[current=page]:border-b-2 aria-[current=page]:border-ink`.
- **Below 768px:**
  - The row collapses into a single `MENU` label button (`md:hidden`).
  - The button opens a full-screen overlay: `fixed inset-0 z-100 bg-paper`. Its links use `text-h1 font-extrabold uppercase` and are stacked left-aligned, with crosshairs in the four corners.
  - The overlay traps focus, closes with `Esc`, and gives focus back to the `MENU` button when it closes.
- The nav never uses brush lettering.

### 6.4 Maintenance screen (`/maintenance`)

The business rules, content model and motion layers are in [screens/MAINTENANCE_BUSINESS.md](screens/MAINTENANCE_BUSINESS.md). **Every string, date and image path comes from the database** (`site_screens`, `_id: "maintenance"`), never from code.

As of 2026-11-22 (v1.3) this is **one viewport (`h-svh`) with no scrolling**, on a **clean ivory canvas**:

- **Background:** faint 12-column rules at about 4.5% opacity, plus one soft signal glow bottom-right. There's no ink panel, ticker or crosshairs on this screen.
- **Header:**
  - left: an ink logo tile (the first letter of the wordmark) with a small orange square, then the brand label from `sm` up;
  - right: the orange `StatusDot` beacon and the status label.
- **Middle** (12-column grid):
  - left (7 columns): kicker, headline (`text-h1`, its final full stop in signal orange), body (`text-lead`), and the clean countdown (`DD : HH : MM : SS`, faint colons);
  - right (5 columns, `lg` up only): the `BuildScene` line illustration in ink with an orange cursor, and the secondary mottos as its caption.
- **Ruler:** a full-width timeline with faint day ticks, the orange elapsed line, the orange "now" dot, and the dates at both ends.
- **Pillars:** three columns on hairlines. On hover an orange 2px rule draws across the top.
- **Footer:** primary mottos, the `EST.` line and the note, all in mono micro.

### 6.5 404 screen

- Use the same poster frame as maintenance, so the two read as one family.
- The `404` numerals use `text-display font-extrabold`, set in the empty left field. Beneath them is `ERROR / PAGE NOT FOUND` in `font-technical text-micro uppercase`.
- Add 1 or 2 X marks near the numerals. This is the only screen where the X motif sits next to a heading.
- Add one primary button, `BACK TO HOME`. It points to `/` (which currently lands on `/maintenance`).
- Don't show the portrait here. The empty paper itself signals "nothing here".
- The response keeps HTTP status 404. Don't add a meta refresh or an automatic redirect.

### 6.6 Image treatment

**Photos:** `next/image` with `className="bg-newsprint object-cover grayscale contrast-125"`.

- Every photo and screenshot is shown grayscale and high-contrast. Never show a color image on the public site.
- The filter is applied with utilities so source assets stay untouched. For hero assets, prefer baking the grayscale in so the image ships smaller and isn't filtered at runtime.
- **Framing options:**
  - none (full bleed);
  - a 1px frame, `border border-rule`;
  - a frame with crop marks (5.2).
- **Captions:** `mt-2 font-technical text-micro uppercase text-graphite`, for example `FIG. 01 / PROJECT NAME`, left-aligned to the image edge.
- **Hover:** no color reveal and no zoom. A link wrapping an image underlines its caption instead (`group` on the link, `group-hover:underline` on the caption).
- **Brand assets** (the wordmark, marks and icons) never get the filter. They are already ink-only.
- **`next/image` props:** explicit `sizes`, `alt` text for content images, and `alt=""` for decorative ones.

### 6.7 Cards and surfaces

- **Card:** `border border-rule bg-newsprint p-6`, with no radius and no shadow.
- **Card title:** `text-h3 font-bold uppercase`. **Metadata:** `font-technical text-micro uppercase text-graphite`.
- **Hover:** `hover:outline-2 hover:-outline-offset-2 hover:outline-ink`. The outline makes the frame look 2px thick without changing its size, so the layout doesn't shift.

### 6.8 Form fields (future contact form)

- **Field:** `border-0 border-b border-ink bg-transparent px-0 py-2 text-body`.
- **Label:** `text-label font-bold uppercase`, placed above the field. Never use a placeholder as the label.
- **Focus:** `focus-visible:border-b-2` plus the standard focus outline.
- **Error:** a line of `font-technical text-micro uppercase` text below the field, beginning `ERROR /`, linked with `aria-describedby`. The field gets `aria-invalid:border-b-2`. No red.

---

## 7. Motion

The full motion system lives in [ANIMATION_UI.md](ANIMATION_UI.md): the stack, tokens, MagicIcon, ActionButton and the flagship pipelines. The public theme is `portfolio`: **editorial, kinetic, tactile, gallery-grade.**

This section used to ban parallax and springs. As of 2026-11-22 the motion direction includes:

- multi-layer scroll parallax (GSAP ScrollTrigger);
- Lenis inertial scroll;
- magnetic springs;
- a WebGL halftone canvas.

These rules still apply on top:

| Rule | Detail |
| --- | --- |
| Easing | `ease-print` (`cubic-bezier(0.2, 0, 0, 1)`) for tweens. Springs are damped with no visible overshoot. Never bounce or elastic easing. |
| Durations | 0.24s fast, 0.48s base, 0.9s slow (`MOTION_THEMES.portfolio`). |
| Properties | Only `transform`, `opacity` and `clip-path`. SVG `d` and stroke dash are allowed inside icons. Never `transition-all`. |
| Colour | Colour is never animated. Inversion uses `mix-blend-difference` or a layer wipe, not a colour tween. |
| Grain | The CSS paper grain (5.6) stays static. Moving halftone or grain belongs only to the hero WebGL canvas (ANIMATION_UI §10.1). |
| Parallax | Small drift only (speeds of 0.05 to 0.25). Below `md`, at most two layers move. No scroll-jacking beyond Lenis smoothing and a single hero pin. |
| Reduced motion | Under `prefers-reduced-motion: reduce`, everything above is off: no Lenis, parallax, magnetism, canvas animation, decoding or skew. Content appears in its final state. |

## 8. Token reference

The source of truth is `src/app/globals.css`.

| Group | Utilities | Variable on `[data-surface="public"]` |
| --- | --- | --- |
| Color | `paper`, `newsprint`, `ink`, `graphite`, `rule`, `signal` | `--bg-primary`, `--bg-surface`, `--text-primary`, `--text-secondary`, `--border-ink`, `--signal` |
| Font family | `font-grotesk`, `font-technical`, `font-brush` | `--public-font-grotesk`, `--public-font-technical`, `--public-font-brush` |
| Type size | `text-wordmark`, `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-lead`, `text-body`, `text-label`, `text-micro`, `text-micro-deco` | `--fs-*` |
| Spacing | `*-frame`, `*-page` (padding, margin, inset, gap) | `--frame-inset`, `--page-margin` |
| Width | `max-w-poster` | `--max-content` |
| Easing | `ease-print` | fixed: `cubic-bezier(0.2, 0, 0, 1)` |

**Adding a token:**

1. Put the value on `[data-surface="public"]`.
2. Map a name to it in the public `@theme inline` block.
3. Add a row to this table.

Never put a raw hex value in a component.

---

## 9. Quick checklist for any new public page

**Setup**

- [ ] Renders inside `PublicShell` (`data-surface="public"`) and never touches `/studio`.

**Tailwind usage**

- [ ] Styled with Tailwind utilities only: no inline styles, no CSS modules, no `@apply`.
- [ ] Colors come only from the token utilities, with no `dark:` variants.
- [ ] Signal orange appears only in the places listed in 2.5, never as text below `text-h2`.
- [ ] Components with variants use `tv()`, and conditional classes use `cn()`.
- [ ] Classes sorted by `npm run format`.

**Visual rules**

- [ ] No `rounded-*` and no `shadow-*`.
- [ ] Asymmetric composition with at least 40% open paper in the hero.
- [ ] At most one brush element per viewport, and none under 48px.
- [ ] Images are `grayscale contrast-125`, with captions in `font-technical`.
- [ ] Decorative marks have `aria-hidden`, `pointer-events-none` and `print:hidden`.

**Accessibility**

- [ ] Focus is visible on every control (`focus-visible:`), and touch targets are at least `min-h-11`.
- [ ] Text meets the minimum sizes (`text-micro` for microtext, `text-body` for body) and runs no wider than `max-w-[68ch]`.
- [ ] `motion-reduce:` is respected.
