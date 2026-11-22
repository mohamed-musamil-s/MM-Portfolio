# "MM." Monogram

Version 1.0, 2026-11-23. The brand mark for the public site. Reference: the logo image supplied on 2026-11-23 (charcoal "MM." on off-white).

![Circuit variation on paper](../../public/brand/mm-monogram-circuit-on-paper.svg)

## 1. Construction

A bold, wide geometric monogram. Two heavy M letterforms share the middle of the mark, with a crisp diagonal cut between them and a round full stop on the baseline.

| Part | Rule |
| --- | --- |
| Grid | Cap height 170 units, stem 42 units (1 : 4.05). View box `0 0 414 170`. |
| Each M | A vertical stem plus a V made of two 42-unit diagonals (slope ≈ 59°). The V's bottom is rounded (round join, r = 21); every top edge is cut flat. |
| First M | No right stem. Its right arm runs up into the second M. |
| Separation | The second M's left stem is cut parallel to that arm with an 8-unit gap. This is the "crisp diagonal separation": the two letters interlock without touching. |
| Full stop | A circle, r = 16, sitting on the baseline, one stem-gap to the right of the last stem. |

The geometry lives in one place, `src/lib/shared/brand/monogram.ts`. The React component and the exported files are both generated from it.

## 2. Variations

| Variation | Use | Description |
| --- | --- | --- |
| **Flat** | UI, favicons, small sizes, print | Pure 2D vector. Solid fill, no shadows, bevels or texture. |
| **Circuit** | Hero moments, large sizes only (≥ 120px wide) | Fine orange circuit traces (2 units) with small terminal nodes (r = 3.6), drawn inside the letterforms, plus a ring inside the full stop. |

## 3. Colour

| Context | Letters | Full stop | Traces |
| --- | --- | --- | --- |
| Logo files (`public/brand/`) | Charcoal `#232931` | Charcoal `#232931` | Orange `#FF7B1C` |
| Off-white background (files) | `#F5F4F0` | | |
| On the site (`<Monogram />`) | `currentColor` (default `text-ink`) | Signal orange (`dot="accent"`, default) or the letter colour (`dot="letter"`) | `--signal` (`#E8480F`) |

On the site the mark follows the design tokens (ink `#0A0A0A`, signal `#E8480F`) so it matches the rest of the page. The files keep the exact colours from the brief for use outside the site.

## 4. Files

Generated with `npm run brand:assets` (`scripts/build-brand-assets.mjs`):

| File | Background | Variation |
| --- | --- | --- |
| `public/brand/mm-monogram.svg` | transparent | flat |
| `public/brand/mm-monogram-on-paper.svg` | off-white, half-cap-height clear space | flat |
| `public/brand/mm-monogram-circuit.svg` | transparent | circuit |
| `public/brand/mm-monogram-circuit-on-paper.svg` | off-white, half-cap-height clear space | circuit |

## 5. Component

```tsx
import { Monogram } from "@/components/brand/Monogram";

<Monogram className="h-6 w-auto" />                      // header: decorative, next to the brand label
<Monogram variant="circuit" className="w-80" label="MM." /> // standalone: give it an accessible name
<Monogram dot="letter" className="h-8 w-auto text-paper" /> // on ink
```

The headers of `/maintenance` and the 404 page use the animated version, `<AnimatedMonogram className="h-6 w-auto" />` (§6).

## 6. Animation: slice split

`src/components/brand/AnimatedMonogram.tsx` (motion). Geometry: `MONOGRAM_M1`, `MONOGRAM_M2`, `MONOGRAM_CUT`, `MONOGRAM_CUT_DIRECTION` in `monogram.ts`.

| Moment | What happens |
| --- | --- |
| Intro (once, ~1.2s) | Each M is cut into **five horizontal slices** that slide in from alternating sides (64 units, 0.6s, 0.06s stagger; the second M 0.12s behind) and lock into place. The two letters start **12 units apart along their diagonal cut** and snap together with a spring while an **orange line flashes down the cut**. The orange full stop pops in last. |
| Hover | The letters **slide apart along the cut** (7 units each way), the orange cut line draws between them, and the full stop swells 1.2×. They close again on leave. |
| Rest | The slices are swapped for whole paths, so the mark has no seams. |
| Reduced motion | The finished mark; no intro and no hover. |

## 7. Usage rules

- Clear space: at least half the cap height on every side.
- Minimum size: 20px tall for flat, 120px wide for circuit.
- Don't stretch, rotate, outline, add shadows to the flat mark, or recolour the letters orange.
- Never put the mark on a busy photo. Use paper, newsprint or ink.

## 8. Image-generation prompts

For producing raster renders (presentations, social images) with an image model. The SVG files above remain the source of truth.

**Base (3D-look render):**

> Bold, wide geometric monogram logo reading "MM." in solid dark charcoal black (#232931). Two heavy interlocking "M" letterforms share a central vertical stroke with a crisp diagonal separation along the inner arm, rounded inner V vertices, flat-cut tops, and a small circular period dot on the bottom right. Set on a clean off-white background (#F5F4F0). Minimalist modern logo design, sharp geometric edges, high contrast, centered, generous empty space.

**Pure 2D flat vector:**

> Pure flat 2D vector graphic of a bold, wide geometric "MM." monogram in solid charcoal (#232931): two heavy interlocking "M" letterforms sharing a central vertical stroke with a crisp diagonal separation along the inner arm, small circular period dot bottom right. No shadows, no bevels, no gradients, no surface grain, no texture. Clean off-white background (#F5F4F0). Minimalist, sharp geometric edges, high contrast, suitable for SVG and UI use.

**With orange circuit accents:**

> Bold, wide geometric "MM." monogram in solid charcoal (#232931), two heavy interlocking "M" letterforms sharing a central vertical stroke with a crisp diagonal separation along the inner arm, small circular period dot bottom right. Fine orange (#FF7B1C) circuit line traces run inside the letters, following the stems and diagonals with 45° jogs, ending in small round terminal nodes; a thin orange ring sits inside the period. Flat 2D vector style, no shadows, clean off-white background (#F5F4F0), minimalist, high contrast.

Negative prompt for all three: `extra letters, slogans, brand names, gradients on letters, drop shadow (flat versions), 3D bevel (flat versions), noise, watermark`.
