# Screen: Name splash (intro on `/`), Business Spec

Version 3.0, 2026-11-25. **An 8.5-second editorial intro, cut to a 120 BPM beat, that plays every time a visitor opens `/`.** Paper surface, the site's three typefaces, signal orange as the only accent. Modelled on the reference videos in `docs/reference/` (giant words with an orange full stop, bracketed mono captions, dot matrices, colour floods, brush lettering, a clicked call to action). One through-line object, the orange full stop of the "MM." monogram, carries every scene and lands as the logo's period on the end card.

---

## 1. Business purpose

| Goal               | How the splash delivers it                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| First impression   | A designed, beat-cut sequence instead of a page that just loads.                                                           |
| Say who and what   | The name twice (giant, then signed), three disciplines, the role, a call to action.                                        |
| Brand recall       | The orange dot links every scene and ends as the monogram's period.                                                        |
| Never in the way   | A **Skip intro** button (bottom right), Esc, and the clicked call to action all open the page; skipped for reduced motion. |
| No content in code | Every word lives in MongoDB (`site_screens`, `_id: "splash"`), edited in Content Forge.                                    |

## 2. When it shows

| Situation                                       | Result                                                                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Visitor opens `/`                               | Splash plays over the page, every time.                                                                                                       |
| Maintenance mode is on                          | `/` moves on to `/maintenance` underneath the splash, so the splash's exit reveals the maintenance page. (The proxy no longer redirects `/`.) |
| Maintenance mode is off                         | `/` is the home page (the portfolio is not built yet, so it is empty under the splash).                                                       |
| Any other page (`/maintenance`, `/404`, studio) | No splash.                                                                                                                                    |
| `enabled` is off in the database                | No splash.                                                                                                                                    |
| The visitor prefers reduced motion              | No splash.                                                                                                                                    |
| The splash record is missing or invalid         | No splash; the page renders normally (logged as an error).                                                                                    |

The splash has no live preview in Content Forge; its words are edited there and seen on `/`.

## 3. Content model (`site_screens/splash`)

| Field                                         | Use                                                  | Seed default                                        |
| --------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `enabled`                                     | Master switch                                        | `true`                                              |
| `intro.lead`, `intro.key`                     | Opening mono caption beside the dot; `key` in orange | `Let's talk`, `craft.`                              |
| `hello`                                       | First giant word (the dot is its full stop)          | `Hello`                                             |
| `bracket`                                     | `[ … ]` caption over the name                        | `You found the portfolio of`                        |
| `moments.lead`, `.first`, `.second`, `.third` | "I DESIGN. / I BUILD. / I ANIMATE."                  | `I`, `Design`, `Build`, `Animate`                   |
| `detail.lead`, `detail.key`                   | `[ … ]` caption under the dot-matrix monogram        | `Every detail,`, `on purpose.`                      |
| `name.first`, `name.last`                     | Giant first name; full name as the brush signature   | `Your`, `Name` (set the real name in Content Forge) |
| `role`                                        | On the orange banner                                 | `Designer & Developer`                              |
| `cta`                                         | The button the cursor clicks                         | `Enter portfolio`                                   |
| `skip`                                        | Skip button text                                     | `Skip intro`                                        |
| `srLabel`                                     | Accessible name of the intro                         | `Intro animation`                                   |

Seeds stay generic: no personal details in code or seed files.

## 4. Storyboard (120 BPM, one beat = 0.5 s)

Through-line object: **the orange dot** (the monogram's period, `--signal`).

| Beats | Time    | What happens                                                                                                                             |
| ----- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | 0.0     | The dot grows beside a small mono caption, "Let's talk **craft.**"                                                                       |
| 1     | 0.5     | The caption leaves; "Hello" rolls up letter by letter and the dot hops in as its full stop.                                              |
| 2     | 1.0     | "[ You found the portfolio of ]" rises above it.                                                                                         |
| 3–4   | 1.5–2.5 | "Hello." rolls out; the first name rolls in, the dot hops to its full stop.                                                              |
| 5     | 2.5     | An orange flood grows from the dot past every corner; "I DESIGN." rises in ink, the dot (now ink) is its full stop.                      |
| 6     | 3.0     | An ink flood grows from that full stop; "I BUILD." in paper, the dot orange again.                                                       |
| 7     | 3.5     | A paper flood; "I ANIMATE." in ink.                                                                                                      |
| 8     | 4.0     | The dot ripples out into a dot grid covering the frame.                                                                                  |
| 9     | 4.5     | The grid rides a wave.                                                                                                                   |
| 10    | 5.0     | The dots inside "MM" swell and darken, the rest fade; the dot takes the period's place. "[ Every detail, **on purpose.** ]" rises below. |
| 11    | 5.5     | The letter dots swell until they merge into the solid monogram.                                                                          |
| 13    | 6.5     | Biggest beat (camera kick): the mark moves up; the full name writes in as a brush signature.                                             |
| 14    | 7.0     | An orange banner sweeps across with the role.                                                                                            |
| 15    | 7.5     | The "Enter portfolio →" pill grows; a cursor glides in.                                                                                  |
| 16    | 8.0     | The cursor clicks; the pill turns orange.                                                                                                |
| —     | 8.5–9.1 | A circle opens from the pill, revealing the page.                                                                                        |

## 5. Motion

- Every style is computed from time in one `paint(t)` (`src/components/splash/`): no CSS animations, no timers, no state carried between frames. A `requestAnimationFrame` loop only supplies `t`; the dot matrix is drawn on one canvas from the same `t`.
- Springs with a small overshoot, exponential ease-in-out. Text rises through masks; giant words roll letter by letter; outgoing and incoming words have separate timing.
- The camera pushes in about 3% per scene and kicks on the payoff beat. Floods are drawn in screen space and scaled past all four corners.
- Typefaces: Inter Tight (giant words), JetBrains Mono (captions, Skip), Permanent Marker (signature).

## 6. Layout

- Full viewport, above the page and below the custom cursor.
- Sizes follow the viewport; giant words shrink to fit, with no horizontal scroll at phone width.
- Positions for match cuts (full stops, end-card mark, pill) are measured from the layout at runtime, never hard-coded.

## 7. Failure behaviour

- Missing or invalid content: no splash; the page is unaffected.
- Fonts slow to load: the timeline starts after `document.fonts.ready` (max 1.5 s).
- Page scroll is locked while the splash is up and restored after it.
