# MM-Portfolio Public Design System

Version 1.0, 2026-11-22. Source artwork: `docs/reference/Gemini_MM.png` (the "Musamil" editorial poster).

---

## 1. Scope and separation

**This document governs the public portfolio only:**

- `/` (currently redirects to `/maintenance`)
- `/maintenance`
- `/404` and the not-found screen
- every future public showcase page

**It does not apply to the admin studio.** Every `/studio/...` route, including `/studio/login`, uses its own design system, defined separately in `docs/ADMIN_STYLE.md`. None of the tokens, fonts, textures or print motifs below may leak into the studio.

### How the separation is enforced in code

- The root layout (`src/app/layout.tsx`) stays neutral: it holds no theme tokens, no fonts and no global styles from this system.
- All tokens in this document are scoped to a public wrapper, not to `:root`:

  ```css
  [data-surface="public"] { /* tokens from sections 2 to 4 */ }
  ```

- Public pages render inside a `PublicShell` component that sets `data-surface="public"` and loads the public stylesheet and fonts. Two ways to use it:
  - public routes move into an `app/(public)/` route group whose layout wraps them in the shell;
  - `not-found.tsx` lives at the app root, so it wraps its own content in `PublicShell`.
- Studio routes never render inside `PublicShell`, so they inherit nothing from this system.

---

## 2. Color

### 2.1 Tokens

The palette is strictly monochrome: warm ivory paper and carbon ink. There are **no saturated accent colors**, including for links, focus, success or error states.

| Token | Hex | Role |
| --- | --- | --- |
| `--bg-primary` | `#F4F3EE` | Archival ivory paper. Full-viewport canvas behind every public page. |
| `--bg-surface` | `#EAE8E1` | Aged newsprint tint. Cards, blocks, image placeholders, input fills. |
| `--text-primary` | `#0A0A0A` | Screen-print carbon ink. All headings, body text, the wordmark, primary buttons. |
| `--text-secondary` | `#2E2E2E` | Charcoal graphite. Microtext, metadata, captions, secondary labels. |
| `--border-ink` | `#141414` | Hairline rules, frames, registration marks, crosshairs. |

These are the only five color values allowed. Every other tone is one of them with opacity applied (see 2.4).

Measured from the poster, the paper is `#F7F5E9` and the ink is pure black. The tokens deliberately pull the paper slightly away from yellow and lift the ink off `#000`, which keeps large ivory areas from looking tinted on screens and softens the black-on-ivory glare in long text.

### 2.2 Contrast (WCAG 2.2)

| Foreground | On `--bg-primary` | On `--bg-surface` | Allowed use |
| --- | --- | --- | --- |
| `--text-primary` `#0A0A0A` | 17.8 : 1 | 16.2 : 1 | Any text size (AAA). |
| `--border-ink` `#141414` | 16.6 : 1 | 15.0 : 1 | Rules and marks; text too if needed. |
| `--text-secondary` `#2E2E2E` | 12.2 : 1 | 11.1 : 1 | Any text size (AAA). |
| `--bg-primary` on `--text-primary` (inverted) | 17.8 : 1 | | Inverted blocks and buttons. |

### 2.3 Contrast rules

1. Text is always ink on paper or paper on ink. Never place text in `--text-secondary` on an inverted ink block; use `--bg-primary` there.
2. Opacity variants (2.4) are **never** used for text that carries meaning, because they drop below 4.5 : 1.
3. Text placed over imagery sits on a solid `--bg-primary` or `--text-primary` plate, never directly on the photo.
4. State is never shown by color alone, because there is no color. Errors, success and the current page use words, icons, rules or weight.

### 2.4 Derived tones

Derived tones are opacity applied to the five base tokens. They are not new hex values.

| Token | Value | Use |
| --- | --- | --- |
| `--ink-12` | `rgb(10 10 10 / 0.12)` | Halftone dots on imagery. |
| `--ink-disabled` | `rgb(10 10 10 / 0.40)` | Disabled controls. Exempt from contrast rules and always paired with `aria-disabled`. |
| `--grain-opacity` | `0.04` | Paper grain overlay (allowed range `0.03` to `0.05`). |

### 2.5 Dark mode

The public site has **no automatic dark mode**: the ivory paper is the brand. Set `color-scheme: light` on the public shell.

Inverted sections (ivory text on an ink plate, like the black label box on the poster's collar) are allowed as deliberate editorial moments. They are not a theme.

---

## 3. Typography

### 3.1 Font pairing

The poster uses three voices. The headline and the slash-separated labels are a **bold, regular-width neo-grotesque**, not a condensed face. The name is **dry-brush marker lettering**. Edge annotations such as `EST. 2000` and `XXX` are **technical markings**.

| Role | Typeface | Weights | Loaded via |
| --- | --- | --- | --- |
| Display and headlines | **Inter Tight** | 700, 800 | `next/font/google` (`Inter_Tight`) |
| Body | **Inter Tight** | 400, 500 | same family |
| Editorial labels (poster style) | **Inter Tight** | 700 | same family |
| Technical microtext | **JetBrains Mono** | 400, 500 | `next/font/google` (`JetBrains_Mono`) |
| Brush wordmark "Musamil" | **Custom SVG** traced from the poster | n/a | `public/brand/musamil-wordmark.svg` |
| Brush accents (other words) | **Permanent Marker** | 400 | `next/font/google` (`Permanent_Marker`) |

Why these:

- **Inter Tight, not Anton or Oswald.** The poster's "CREATE. INSPIRE. ELEVATE." is a regular-width Helvetica-style bold. Inter Tight ExtraBold matches its proportions; Anton and Oswald are condensed and would read as a different poster.
- **The wordmark is an SVG asset, not a font.** No web font reproduces the poster's lettering: the slant, the dry-brush edges, the long descending "M" stroke. Trace it once and use it as a logo.
- **Permanent Marker for other brush words.** It's the closest open-source match in weight. Caveat Brush is too light and casual next to the wordmark.

Expose the fonts as CSS variables: `--font-grotesk`, `--font-mono` and `--font-brush`. Self-host them through `next/font` (no runtime request to Google), with `display: "swap"`.

### 3.2 Type scale

Mobile-first. The fluid sizes use `clamp()` and scale between a 360px and a 1440px viewport.

| Token | Size | Line height | Tracking | Face and style |
| --- | --- | --- | --- | --- |
| `--fs-wordmark` | `clamp(5rem, 20vw, 18rem)` | 0.85 | n/a | Brush SVG (height-driven) |
| `--fs-display` | `clamp(3.5rem, 10vw, 9rem)` | 0.92 | `-0.02em` | Grotesk 800, uppercase |
| `--fs-h1` | `clamp(2.5rem, 6vw, 5rem)` | 0.95 | `-0.015em` | Grotesk 800, uppercase |
| `--fs-h2` | `clamp(1.75rem, 3.5vw, 3rem)` | 1.0 | `-0.01em` | Grotesk 800, uppercase |
| `--fs-h3` | `clamp(1.25rem, 2vw, 1.75rem)` | 1.1 | `0` | Grotesk 700, uppercase |
| `--fs-lead` | `clamp(1.125rem, 1.6vw, 1.375rem)` | 1.45 | `0` | Grotesk 400, sentence case |
| `--fs-body` | `1rem` (16px), `1.0625rem` from 1024px | 1.6 | `0` | Grotesk 400, sentence case |
| `--fs-label` | `0.8125rem` (13px) | 1.3 | `0.04em` | Grotesk 700, uppercase |
| `--fs-micro` | `0.6875rem` (11px) | 1.4 | `0.2em` | Mono 400–500, uppercase |
| `--fs-micro-deco` | `0.625rem` (10px) | 1.4 | `0.25em` | Mono, decorative only |

### 3.3 Typography rules

**Headlines**

1. Headlines are uppercase via `text-transform: uppercase`. Type the source text in normal case so screen readers don't spell it out letter by letter.
2. A headline can end with full stops between words, as in `CREATE. INSPIRE. ELEVATE.` This is the signature cadence. Use it only for short manifesto lines of 2 to 4 words.
3. Underline a headline with a **partial rule**: 2px of ink, set 0.35em below the baseline, and shorter than the text (roughly 70% of the line width), exactly as on the poster.

**Brush lettering**

4. Brush lettering appears **at most once per viewport**.
   - It is never used for UI controls, body copy, or anything under 48px.
   - It can overlap imagery: on the poster, the wordmark crosses the portrait.
   - Overlapping text must not cover a face, and must not cover any other text.

**Labels and microtext**

5. Labels follow the poster's slash pattern, `MINDSET / AMBITION / FREEDOM`: words separated by ` / ` with a regular space on each side. Wrap the separators in `aria-hidden` spans, or write them as a list.
6. Technical microtext (mono) is for metadata only: dates, indices, coordinates, figure numbers, `EST. 2000`.
   - The smallest readable size is 11px. The 10px size is only for `aria-hidden` decoration.
   - Vertical edge annotations use `writing-mode: vertical-rl`, rotated so they read bottom to top, as on the poster's right edge.

**Body text**

7. Body text runs at most 68 characters wide (`max-width: 68ch`), is left-aligned and has a ragged right edge. Never justify it.
8. Use only two weights per screen in the grotesk (for example 800 and 400). Use bold as structure, never as decoration.

---

## 4. Layout, spacing and grid

### 4.1 Spacing scale

The base unit is 4px. Use only these steps.

| Token | Value | Token | Value |
| --- | --- | --- | --- |
| `--space-1` | 4px | `--space-7` | 48px |
| `--space-2` | 8px | `--space-8` | 64px |
| `--space-3` | 12px | `--space-9` | 96px |
| `--space-4` | 16px | `--space-10` | 128px |
| `--space-5` | 24px | `--space-11` | 192px |
| `--space-6` | 32px | | |

Section rhythm: `--space-9` between sections on mobile, `--space-11` on desktop.

### 4.2 Frame and margins

These are measured from the poster and expressed as fractions of the viewport.

| Token | Value | Meaning |
| --- | --- | --- |
| `--frame-inset` | `clamp(16px, 3.5vw, 56px)` | Distance from the viewport edge to the registration crosshairs. |
| `--page-margin` | `clamp(24px, 7vw, 128px)` | Distance from the edge to text content (the poster's left text column). |
| `--max-content` | `1440px` | The grid stops growing here. The paper background keeps going. |

### 4.3 Swiss editorial grid

- The desktop grid has 12 columns with a `--space-5` gutter. Tablet uses 8 columns and mobile uses 4.
- **The layout is asymmetric by default.** The hero follows the poster:
  - Columns 1 to 5 are mostly empty paper. At least 40% of the canvas stays open.
  - The image fills columns 5 to 12 and **bleeds off the right edge**.
  - Text anchors to the **bottom-left** of the empty field, about two-thirds of the way down.
- Never center a hero composition. Center alignment is only for the single status line on very small screens.
- The space is split by stark 1px `--border-ink` rules, never by background color changes or shadows. One structural rule per section edge is enough.
- **Negative space is content.** Don't fill the empty field with stock graphics, gradients or extra copy.

### 4.4 Shape rules

- Every element has `border-radius: 0`: buttons, inputs, cards, images, tags and modals.
- The **only** curves in the system are the crosshair circles, the bullseye mark and the brush lettering.
- No `box-shadow` and no `drop-shadow` anywhere. Depth comes from overlap and rules, as in print.
- Borders are always 1px `--border-ink`. The heavy rule is 2px, used only for headline underlines and the active nav item.

---

## 5. Signature print motifs and texture

Every motif is decorative. Each one must be `aria-hidden="true"`, have `pointer-events: none`, sit outside the tab order, and be removed in `@media print`.

### 5.1 Registration crosshair

This is the core mark: a circle with a cross through it, the cross extending past the circle.

| Property | Value |
| --- | --- |
| Circle diameter | 24px (desktop), 18px (mobile) |
| Cross length | 1.5 × the diameter, centered |
| Stroke | 1px `--border-ink`, no fill |
| Placement (desktop) | 4 corners at `--frame-inset`, plus the midpoints of the top, bottom, left and right edges |
| Placement (below 640px) | 4 corners only |

- **Corner companions.** A corner crosshair can carry a 64px horizontal hairline just below it, plus a 40px vertical tick beside it, mirroring the poster's top-left corner.
- **Bullseye variant.** A crosshair with a solid ink dot (40% of the diameter) at its center. Use it at most twice per screen, top-right and bottom-right, to mark the "registered" corner.
- Build the crosshair once as an inline SVG component (`<RegistrationMark variant="open" | "bullseye" />`). Don't use the text glyph `⊕`, because its rendering varies by font.

### 5.2 Crop marks

Crop marks are L-shaped corner ticks drawn outside a framed image.

- Each leg is 12px long, 1px `--border-ink`.
- The marks sit 8px outside the image's bounding box.
- Use them on feature images and the maintenance or 404 frame, never on small thumbnails.

### 5.3 X marks

These are hand-drawn crossed strokes, as on the poster's right edge.

- Use an SVG with slightly irregular strokes, 1.5px.
- Place 1 or 2 per screen, near an edge, as rhythm markers. Never use them as a close or delete icon. That needs a clean, geometric UI icon, so it isn't confused with decoration.

### 5.4 Newsprint dividers and columns

- **Section divider:** a full-width 1px rule. You can put a mono label at its left end, for example `01 / WORK`, on the `--bg-primary` background with a `--space-3` gap.
- **Newsprint column texture.** The poster's columns of small text behind the portrait are a **texture layer**, shipped as a raster or SVG image.
  - Never put lorem-ipsum text in the DOM: it's selectable, gets indexed, and is read aloud by screen readers.
  - If real text forms the texture (for example project notes), it must be real content at a readable size of 11px or more.

### 5.5 Construction lines

Use thin straight strokes (0.75px ink at 60% opacity) that cross the edges of an image at an angle, like the sketch lines around the sunglasses. Use at most 3 per image, and only on hero imagery.

### 5.6 Paper grain overlay

```css
[data-surface="public"]::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: var(--z-grain);
  pointer-events: none;
  opacity: var(--grain-opacity);          /* 0.03 to 0.05 */
  mix-blend-mode: multiply;
  background-image: url("/textures/grain.svg"); /* feTurbulence noise, tiled */
  background-size: 256px;
}
```

- The grain is static. **Never animate it** (no flickering film grain), because animating a full-screen layer costs frame rate.
- It sits above content but below focus rings and any open modal.
- Remove it with `@media print`, and also under `@media (prefers-contrast: more)`.

### 5.7 Halftone

Halftone belongs on **imagery only**, not on flat surfaces.

- Apply a dot pattern (`radial-gradient` at a 4px pitch, `--ink-12`) as an overlay on the image frame.
- Or bake the halftone into the image asset itself.

---

## 6. Components

### 6.1 Buttons

All variants share these properties:

| Property | Value |
| --- | --- |
| Type | `--fs-label`, uppercase |
| Padding | 14px 24px |
| Minimum height | 44px (touch target) |
| Corners | radius 0 |
| Border | 1px |

| Variant | Rest | Hover | Active |
| --- | --- | --- | --- |
| Primary | ink background, ivory text, ink border | inverts: ivory background, ink text | `translateY(1px)` |
| Secondary | transparent, ink text, ink border | ink background, ivory text | `translateY(1px)` |
| Text | ink text, 1px underline at 4px offset | 2px underline | none |

- **Focus (all variants):** `outline: 2px solid var(--text-primary); outline-offset: 3px;`. On an inverted ink plate, use a `--bg-primary` outline instead. Focus is always visible: use `:focus-visible` and never remove the outline.
- **Disabled:** `--ink-disabled` for text and border, `cursor: not-allowed`, plus `aria-disabled="true"`. No hover change.
- **Loading:** keep the button's width and swap the label for mono `LOADING` text. No spinner colors.
- **Transitions:** background and color only, over 120ms. Never `transition: all`.

### 6.2 Links

- **Inline links:** `--text-primary`, with a 1px underline at `text-underline-offset: 3px`. On hover the underline becomes 2px.
- There's **no color change** for hover or visited links. Weight and underline carry the state.
- **External links** end with a small mono `↗`, and include an `aria-label` that mentions the new tab when one opens.
- **Label links** (nav and footer) use `--fs-label` and show no underline until hover or the current page.

### 6.3 Navigation

The navigation mirrors the poster's top-right label, `MINDSET / AMBITION / FREEDOM`.

- **Desktop:**
  - A single row of label links separated by ` / `, top-right, aligned to `--page-margin`.
  - No bar, background or logo block.
  - A small brush or grotesk monogram sits top-left.
- **Current page:** a 2px ink rule under the label, plus `aria-current="page"`.
- **Below 768px:**
  - The row collapses into a single `MENU` label button.
  - The button opens a full-screen `--bg-primary` overlay. Its links use `--fs-h1` in uppercase grotesk and are stacked left-aligned, with crosshairs in the four corners.
  - The overlay traps focus, closes with `Esc`, and gives focus back to the `MENU` button when it closes.
- The nav never uses brush lettering.

### 6.4 Maintenance screen (`/maintenance`)

This is a full-viewport "poster" composition, the reference layout for the whole system.

```
⊕ |                     ⊕                     |⦿
───                                         ───
                         STATUS / IN DEVELOPMENT
          (empty paper)      [ portrait art, grayscale,
                               bleeds off right edge ]
⊕                                                ⊕
  PORTFOLIO
  COMING SOON.
  ───────────
  EST. 2000                     X
                                 X
          M u s a m i l   (brush SVG overlapping art)
  MINDSET / AMBITION / FREEDOM     FOCUS / DISCIPLINE / ...
⊕                       ⊕                        ⦿
```

- **Height:** exactly one viewport. Use `min-height: 100svh`; never let it scroll on desktop.
- **Headline:** `--fs-h1` grotesk 800 with full-stop cadence (`PORTFOLIO COMING SOON.`), the partial underline rule, and `EST. 2000` in `--fs-label` below.
- **Status line:** mono microtext, top-right.
- **Wordmark:** the brush SVG anchored bottom-right, overlapping the art. It carries `role="img"` and `aria-label="Musamil"`.
- **Footer row:** two slash-label groups, bottom-left and bottom-right.
- **Mobile:**
  - The art stacks above the text. It is cropped at the shoulders, not shrunk.
  - The wordmark spans the full width under the art.
  - Only the corner crosshairs are shown.
- **Content:** no links except an optional contact label link. This page is a holding poster, not a navigation hub.

### 6.5 404 screen

- Use the same poster frame as maintenance, so the two read as one family.
- The `404` numerals use `--fs-display` grotesk 800, set in the empty left field. Mono microtext beneath reads `ERROR / PAGE NOT FOUND`.
- Add 1 or 2 X marks near the numerals. This is the only screen where the X motif sits next to a heading.
- Add one primary button, `BACK TO HOME`. It points to `/` (which currently lands on `/maintenance`).
- Don't show the portrait here. The empty paper itself signals "nothing here".
- The response keeps HTTP status 404. Don't add a meta refresh or an automatic redirect.

### 6.6 Image treatment

```css
.public-image {
  filter: grayscale(100%) contrast(125%);
  border-radius: 0;
  object-fit: cover;
  background: var(--bg-surface); /* placeholder while loading */
}
```

- Every photo and screenshot is shown grayscale and high-contrast. Never show a color image on the public site.
- The filter is applied in CSS so source assets stay untouched. For hero assets, prefer baking the grayscale in so the image ships smaller and isn't filtered at runtime.
- **Framing options:**
  - none (full bleed);
  - a 1px `--border-ink` frame;
  - a frame with crop marks (5.2).
- **Captions** go below the image in mono microtext, `FIG. 01 / PROJECT NAME`, left-aligned to the image edge.
- **Hover:** no color reveal and no zoom on hover. A link wrapping an image underlines its caption instead.
- **Brand assets** (the wordmark, marks and icons) never get the filter. They are already ink-only.
- Always use `next/image` with explicit `sizes`, `alt` text for content images, and `alt=""` for decorative ones.

### 6.7 Cards and surfaces

- **Cards:** `--bg-surface` background, 1px `--border-ink` border, radius 0, no shadow, `--space-5` padding.
- **Card title:** `--fs-h3`. **Metadata:** mono microtext. **Hover:** the border thickens to 2px by animating `outline` or an inset box-shadow (not `border`), so the layout doesn't shift.

### 6.8 Form fields (future contact form)

- **Field:** bottom border only, 1px ink, transparent fill, radius 0.
- **Label:** `--fs-label`, placed above the field. Never use a placeholder as the label.
- **Focus:** the bottom border becomes 2px, plus the standard focus outline.
- **Error:** mono microtext below the field, beginning `ERROR /`, linked with `aria-describedby`. The field gets a 2px bottom border. No red.

---

## 7. Motion

The site should feel like print: restrained, never bouncy.

| Token | Value |
| --- | --- |
| `--duration-fast` | 120ms (hover, press) |
| `--duration-base` | 240ms (overlays, reveals) |
| `--ease-print` | `cubic-bezier(0.2, 0, 0, 1)` |

- **Allowed:** an ink-wipe reveal using `clip-path` (left to right, once per element, on first view); opacity fades; the nav overlay sliding in.
- **Not allowed:** parallax, scroll-jacking, spring or bounce easing, animated grain, or animating the color of anything.
- Animate only `transform`, `opacity` and `clip-path`.
- Under `@media (prefers-reduced-motion: reduce)`, every transition is instant and reveals are skipped.

---

## 8. Token reference

```css
[data-surface="public"] {
  color-scheme: light;

  /* Color */
  --bg-primary: #F4F3EE;
  --bg-surface: #EAE8E1;
  --text-primary: #0A0A0A;
  --text-secondary: #2E2E2E;
  --border-ink: #141414;
  --ink-12: rgb(10 10 10 / 0.12);
  --ink-disabled: rgb(10 10 10 / 0.4);
  --grain-opacity: 0.04;

  /* Type: families come from next/font variables */
  --font-grotesk: var(--font-inter-tight), "Helvetica Neue", Arial, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", monospace;
  --font-brush: var(--font-permanent-marker), "Marker Felt", cursive;

  --fs-wordmark: clamp(5rem, 20vw, 18rem);
  --fs-display: clamp(3.5rem, 10vw, 9rem);
  --fs-h1: clamp(2.5rem, 6vw, 5rem);
  --fs-h2: clamp(1.75rem, 3.5vw, 3rem);
  --fs-h3: clamp(1.25rem, 2vw, 1.75rem);
  --fs-lead: clamp(1.125rem, 1.6vw, 1.375rem);
  --fs-body: 1rem;
  --fs-label: 0.8125rem;
  --fs-micro: 0.6875rem;
  --fs-micro-deco: 0.625rem;

  /* Space */
  --space-1: 4px;  --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-5: 24px; --space-6: 32px;  --space-7: 48px;  --space-8: 64px;
  --space-9: 96px; --space-10: 128px; --space-11: 192px;

  /* Layout */
  --frame-inset: clamp(16px, 3.5vw, 56px);
  --page-margin: clamp(24px, 7vw, 128px);
  --max-content: 1440px;
  --rule: 1px solid var(--border-ink);
  --rule-heavy: 2px solid var(--text-primary);
  --radius: 0;

  /* Motion */
  --duration-fast: 120ms;
  --duration-base: 240ms;
  --ease-print: cubic-bezier(0.2, 0, 0, 1);

  /* Layers */
  --z-content: 1;
  --z-marks: 2;
  --z-nav: 10;
  --z-grain: 50;
  --z-overlay: 100;

  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-grotesk);
  font-size: var(--fs-body);
  line-height: 1.6;
}

@media (min-width: 1024px) {
  [data-surface="public"] { --fs-body: 1.0625rem; }
}
```

---

## 9. Quick checklist for any new public page

- [ ] Renders inside `PublicShell` (`data-surface="public"`), never touches `/studio`.
- [ ] Only the five color tokens (plus opacity-derived tones); no new hex values.
- [ ] Every radius is 0 and there are no shadows.
- [ ] Asymmetric composition with at least 40% open paper in the hero.
- [ ] At most one brush element per viewport, and none under 48px.
- [ ] Images are grayscale with contrast 125% and have captions in mono.
- [ ] Decorative marks are `aria-hidden`, have no pointer events, and are hidden in print.
- [ ] Focus is visible on every control, and touch targets are at least 44px.
- [ ] Text meets the minimum sizes (11px for microtext, 16px for body), and runs no wider than 68ch.
- [ ] Reduced motion is respected.
