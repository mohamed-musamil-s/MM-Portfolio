# Screen: Name splash (intro on `/`), Business Spec

Version 4.0, 2026-11-25. **A 33-second showreel, cut to a 120 BPM beat, that plays every time a visitor opens `/`, and hands over to the page by flying the logo into its navbar.** Paper surface, the site's three typefaces, signal orange as the only accent. Modelled on the reference videos in `docs/reference/`. One through-line object, the orange full stop of the "MM." monogram, carries every scene.

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

| Field                                             | Use                                                    | Seed default                                                         |
| ------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| `enabled`                                         | Master switch                                          | `true`                                                               |
| `intro.lead`, `intro.key`                         | Opening caption beside the dot (`key` in orange)       | `Let's talk`, `craft.`                                               |
| `hello`                                           | First giant word                                       | `Hello`                                                              |
| `bracket`                                         | `[ … ]` caption over the name                          | `You found the portfolio of`                                         |
| `loading`                                         | `[ … ]` caption over the 0–100% counter                | `Loading the good stuff`                                             |
| `moments.lead`, `.first`, `.second`, `.third`     | "I DESIGN. / I BUILD. / I ANIMATE."                    | `I`, `Design`, `Build`, `Animate`                                    |
| `design.lead`, `design.key`                       | Caption of the browser-window scene                    | `Interfaces,`, `pixel-perfect.`                                      |
| `code.caption`, `code.lines` (1–3), `code.status` | Terminal scene: caption, typed lines, live site status | `Code that ships.`, three commands, `Deployed`                       |
| `detail.lead`, `detail.key`                       | Caption under the dot-matrix monogram                  | `Every detail,`, `on purpose.`                                       |
| `stack.title`, `stack.skills` (2–6), `stack.note` | Node graph: title, chips around the hub, note pill     | `Built with the tools I trust.`, six tools, `Design · Code · Motion` |
| `statements` (2–4)                                | Stacked lines on ink                                   | `Big ideas.` … `Real results.`                                       |
| `tags` (0–8)                                      | Tags drifting behind the statements                    | `wireframes`, `prototypes`, …                                        |
| `name.first`, `name.last`                         | Giant first name; full name on the end card            | `Your`, `Name` (set the real name in Content Forge)                  |
| `tagline.lead`, `tagline.key`                     | Line under the name                                    | `Designer & developer crafting`, `interfaces that feel alive.`       |
| `cta`, `label`                                    | The button the cursor clicks, the note beside it       | `Enter portfolio`, `Est. 2026`                                       |
| `skip`, `srLabel`                                 | Skip button, accessible name                           | `Skip intro`, `Intro animation`                                      |

Seeds stay generic: no personal details in code or seed files.

## 4. Storyboard (120 BPM, one beat = 0.5 s)

Through-line object: **the orange dot** (the monogram's period, `--signal`).

| Time        | Scene      | What happens                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0–6 s       | Hook       | The dot beside "Let's talk **craft.**"; it becomes the full stop of a giant "Hello.", which rolls out as the full name rolls in under "[ You found the portfolio of ]". Then one letter leaves the end of each word every half-beat (Mohamed Musamil → Mohame Musami → … → M M → MM), the space closes, the "MM" becomes the monogram and the dot lands as its period: **MM.** It holds a beat, then leaves. |
| 6–8 s       | Loading    | A giant 0→100% counter and a progress bar; the dot rides the bar's tip.                                                                                                                                                                                                                                                                                                                                      |
| 8–9.5 s     | Floods     | "I DESIGN." on orange, "I BUILD." on ink, "I ANIMATE." on paper, each flood grown from the previous full stop.                                                                                                                                                                                                                                                                                               |
| 9.5–13 s    | Design     | A browser window unfolds from the dot (now its first window control); the wireframe, type specimen and swatches assemble; the camera zooms while a cursor drags a card into a dashed slot.                                                                                                                                                                                                                   |
| 13–16.5 s   | Code       | A terminal unfolds and types its lines; a line draws to a live site card and the dot rides it to become the "Deployed" status light.                                                                                                                                                                                                                                                                         |
| 16.5–20.5 s | Motion     | The dot ripples out into a dot grid that waves, becomes a lit halftone sphere, lights up as "MM." and condenses into the solid mark.                                                                                                                                                                                                                                                                         |
| 20.5–24 s   | Stack      | The mark shrinks to a hub; skill chips pop in around it, curved links draw, orange pulses run into the hub.                                                                                                                                                                                                                                                                                                  |
| 24–27.5 s   | Statements | An ink flood; the statements stack up one per beat beside an orange rule, the dot as their bullet; tags drift behind.                                                                                                                                                                                                                                                                                        |
| 27.5–31.5 s | End card   | A paper flood; the mark grows with an orbit of dots that spiral into its period, then sits beside the full name; tagline, the orange-on-click "Enter portfolio →" pill (clicked by a cursor) and a small note.                                                                                                                                                                                               |
| 31.5–33 s   | Exit       | The splash fades and blurs away while the mark flies to the navbar logo of the page beneath (`[data-brand-mark]`, top left when none) and lands on it.                                                                                                                                                                                                                                                       |

## 5. Motion

- Every style is computed from time in one `paint(t)` (`src/components/splash/`: timeline, scenes, paint): no CSS animations, no timers, no state carried between frames. A `requestAnimationFrame` loop only supplies `t`; the dot matrix, stack pulses and orbit are drawn on one canvas from the same `t`.
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
