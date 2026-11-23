# Screen: Name splash (intro before the portfolio), Business Spec

Version 2.0, 2026-11-23. **A 10-second cinematic intro, cut to a 120 BPM beat, that plays once per visit before the portfolio appears.** Dark stage, warm orange light, modelled on the reference video `docs/reference/splash-1.mp4`. One through-line object, the orange full stop of the "MM." monogram, carries every scene and lands as the logo's period on the end card. Public surface (its own dark look; the page underneath keeps the paper theme).

---

## 1. Business purpose

| Goal               | How the splash delivers it                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| First impression   | A short, cinematic sequence instead of a page that just loads.                                           |
| Say who and what   | The owner's name, role and three disciplines, ending on a clean end card.                                |
| Brand recall       | It opens on a macro shot of the monogram and ends on the lit monogram; the orange dot links every scene. |
| Never in the way   | Plays once per browser session, has a Skip button (and Esc), and is skipped entirely for reduced motion. |
| No content in code | Every word lives in MongoDB (`site_screens`, `_id: "splash"`), edited in Content Forge.                  |

## 2. When it shows

| Situation                                   | Result                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| First public page load in a browser session | Splash plays over the page, then wipes up to reveal it.                              |
| Any later page load in the same session     | No splash (session cookie `mm_splash_seen`, read on the server, so nothing flashes). |
| `enabled` is off in the database            | No splash.                                                                           |
| The visitor prefers reduced motion          | No splash.                                                                           |
| `/preview/*` (studio preview frame)         | No overlay; `/preview/splash` shows the splash in a loop for Content Forge.          |
| The splash record is missing or invalid     | No splash; the page renders normally (logged as an error).                           |

## 3. Content model (`site_screens/splash`)

| Field                                | Use                                                | Seed default                                        |
| ------------------------------------ | -------------------------------------------------- | --------------------------------------------------- |
| `enabled`                            | Master switch                                      | `true`                                              |
| `claim.word`                         | "MM. = **word**", struck through and dissolved     | `Two letters`                                       |
| `claim.subtitle`                     | Line under the claim                               | `You thought the monogram meant one thing.`         |
| `claim.question`                     | Replaces the dissolved word (italic serif)         | `?`                                                 |
| `moments.first`, `.second`, `.third` | Words on the three lit cards (centre, left, right) | `Design`, `Code`, `Motion`                          |
| `name.first`, `name.last`            | End card name, beside the monogram                 | `Your`, `Name` (set the real name in Content Forge) |
| `role`                               | Line under the name                                | `Designer & Developer`                              |
| `tagline`                            | Italic serif line on the end card                  | `Portfolio.`                                        |
| `label`                              | Small line at the bottom of the end card           | `Est. 2026`                                         |
| `skip`                               | Skip button text                                   | `Skip intro`                                        |
| `srLabel`                            | Accessible name of the intro                       | `Intro animation`                                   |

Seeds stay generic: no personal details in code or seed files.

## 4. Storyboard (120 BPM, one beat = 0.5 s)

Through-line object: **the orange dot** (the monogram's period, `--signal`).

| Beats | Time      | Scene    | What happens                                                                                                                                                                                                            |
| ----- | --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–4   | 0.0–2.5   | Macro    | Extreme close-up on the diagonal cut between the two Ms, tilted. Dark letters, a warm light gliding over them, thin light streaks running along the edges. The camera pulls back to the whole mark; the period ignites. |
| 5–6   | 2.5–3.5   | Claim    | The mark shrinks into the line "MM. = Two letters" and turns bright; the subtitle blurs in.                                                                                                                             |
| 7–8   | 3.5–4.5   | Claim    | The dot stretches into an orange strike-through; the word glitches (RGB split) and dissolves into drifting dust, left to right; an italic serif "?" takes its place.                                                    |
| 9     | 4.5–5.0   | Claim    | The line blurs away; the dot stays.                                                                                                                                                                                     |
| 10–12 | 5.0–6.5   | Cards    | A dark glass card with an orange edge rises ("Design"); the dot is its status light. It deals out "Code" and "Motion", then the grid multiplies outward while the camera pulls back.                                    |
| 12–14 | 6.5–7.5   | Stars    | The cards collapse into points of light that spread into a linked star field.                                                                                                                                           |
| 14–15 | 7.0–8.0   | Converge | The stars stream into the monogram's outline; the dot leads them into the period; the mark lights up with an orange halo.                                                                                               |
| 16–19 | 8.0–10.0  | End card | The mark moves beside the name; role, italic tagline and label blur in on the beats.                                                                                                                                    |
| —     | 10.0–10.6 | Exit     | The splash wipes upward, revealing the page.                                                                                                                                                                            |

## 5. Motion and light

- Every style is computed from time in one `paint(t)` (`src/components/splash/`): no CSS animations, no timers, no state carried between frames. A `requestAnimationFrame` loop only supplies `t`; particles are drawn on one canvas from the same `t` (seeded, so every frame is reproducible).
- Springs with a small overshoot, exponential ease-in-out; text arrives by blurring in and leaves by blurring out.
- Light: a warm pool that follows the light on the mark, a vignette, film grain, light streaks along the monogram's outline, glows on the dot and the lit mark.
- One accent colour (signal orange) for every light. Typefaces: Inter Tight, plus Instrument Serif italic for the question mark and tagline.

## 6. Layout

- Full viewport, above the page and below the custom cursor.
- Sizes follow the viewport; long lines shrink to fit, with no horizontal scroll at phone width. Cards are 5 × 3 on wide screens, 3 × 5 on phones.
- Positions for match cuts (claim-line glyph, end-card glyph, the claim word's pixels) are measured from the layout at runtime, never hard-coded.

## 7. Failure behaviour

- Missing or invalid content: no splash; the page is unaffected.
- Fonts slow to load: the timeline starts after `document.fonts.ready` (max 1.5 s).
- Page scroll is locked while the splash is up and restored after it.
