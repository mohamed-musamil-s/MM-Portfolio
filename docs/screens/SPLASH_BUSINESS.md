# Screen: Name splash (intro before the portfolio), Business Spec

Version 1.0, 2026-11-23. **An 8.5-second kinetic-type intro, cut to a 120 BPM beat, that plays once per visit before the portfolio appears.** One through-line object, the orange full stop of the "MM." monogram, carries every scene and lands as the logo's period on the end card. Public surface. Look: [STYLE.md](../STYLE.md).

---

## 1. Business purpose

| Goal               | How the splash delivers it                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| First impression   | A short, designed sequence instead of a page that just loads.                                            |
| Say who and what   | The owner's name, role and the three things they do, in big type.                                        |
| Brand recall       | Every scene is the same orange dot changing role; it ends as the period of "MM.".                        |
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

| Field                                            | Use                                                                                                           | Seed default                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `enabled`                                        | Master switch                                                                                                 | `true`                                              |
| `hook.first`, `hook.second`, `hook.keyWord`      | The three hook words, one per beat. The key word gets the orange underline.                                   | `IDEAS`, `NEED`, `CRAFT`                            |
| `moments.select`, `moments.type`, `moments.move` | The three "what I do" words: shown in a selection frame, typed behind a caret, and drawn along an ease curve. | `DESIGN`, `CODE`, `MOTION`                          |
| `name.first`, `name.last`                        | The name on the payoff and the end card (two lines).                                                          | `YOUR`, `NAME` (set the real name in Content Forge) |
| `role`                                           | Line under the name on the end card.                                                                          | `DESIGNER & DEVELOPER`                              |
| `label`                                          | Small label on the end card.                                                                                  | `PORTFOLIO`                                         |
| `skip`                                           | Skip button text.                                                                                             | `Skip intro`                                        |
| `srLabel`                                        | Accessible name of the intro.                                                                                 | `Intro animation`                                   |

Seeds stay generic: no personal details in code or seed files.

## 4. Storyboard (120 BPM, one beat = 0.5 s)

Through-line object: **the orange dot** (the monogram's full stop, `--signal`). The accent colour is used on nothing else.

| Beat | Time     | Scene    | What happens                                                                                                                         |
| ---- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | 0.0      | Hook     | The dot grows from a point at the centre.                                                                                            |
| 1    | 0.5      | Hook     | `IDEAS` rises through a mask; the dot slides in as its full stop.                                                                    |
| 2    | 1.0      | Hook     | `IDEAS` leaves upward, `NEED` rises; the dot hops to the new full stop.                                                              |
| 3    | 1.5      | Hook     | `CRAFT` (key word) rises; the dot lands and stretches into its underline.                                                            |
| 4    | 2.0      | Design   | The underline pulls back into the dot, which slides to a corner and unfolds a selection frame; it becomes the frame's corner handle. |
| 5    | 2.5      | Design   | `DESIGN` rises inside the frame; the other handles grow out.                                                                         |
| 6    | 3.0      | Design   | The frame snaps tight around the word.                                                                                               |
| 7    | 3.5      | Code     | The frame folds into its far corner; the dot stretches into a text caret.                                                            |
| 8    | 4.0      | Code     | `CODE` types in letter by letter behind the caret.                                                                                   |
| 9    | 4.5      | Code     | The caret blinks on the beat.                                                                                                        |
| 10   | 5.0      | Motion   | The caret shrinks back to the dot at the start of an ease-in-out curve; `MOTION` rises above it.                                     |
| 11   | 5.5      | Motion   | The dot rides the curve, drawing it behind itself.                                                                                   |
| 12   | 6.0      | Payoff   | Biggest beat: the name rises letter by letter, huge; the dot lands as its full stop; the camera kicks in.                            |
| 13   | 6.5      | Payoff   | The name springs down to end-card size; the monogram's letters rise above it.                                                        |
| 14   | 7.0      | End card | The dot jumps from the name into the monogram and becomes its period. The role line rises.                                           |
| 15   | 7.5      | End card | The label rises.                                                                                                                     |
| —    | 8.0–8.55 | Exit     | The whole splash wipes upward, revealing the page.                                                                                   |

## 5. Motion rules

- Every style is computed from time in one `seek(t)` function: no CSS animations, no timers, no state carried between frames. A `requestAnimationFrame` loop only supplies `t`.
- Springs with a small overshoot (under 3%), exponential ease-outs. No bouncy easing.
- Nothing appears from nothing: things grow, unfold, or rise through a mask.
- Fast moves blur along their direction: the dot smears along its velocity; text blurs vertically while it moves through a mask.
- The camera never sits still: it pushes in about 4% per scene, starting each scene where the last one ended, and leans towards the dot.
- Outgoing and incoming words have separate timing, so letters never overlap.
- Banned: particles, glows, flares, shake, RGB split, crossfades, gradients, holds over half a second.
- One typeface (Inter Tight); one accent (signal orange) on the dot only; lots of empty paper.

## 6. Layout

- Full viewport, paper background, above the page and below the custom cursor and grain.
- Word sizes follow the viewport (`vw`/`vh`); a long word is shrunk at measure time so it always fits, with no horizontal scroll at phone width.
- Positions for match cuts (full stops, frame corners, caret, monogram period) are measured from the layout at runtime, never hard-coded.

## 7. Failure behaviour

- Missing or invalid content: no splash; the page is unaffected.
- Fonts slow to load: the timeline starts after `document.fonts.ready`, so measurements use the real typeface.
- Page scroll is locked while the splash is up and restored after it.
