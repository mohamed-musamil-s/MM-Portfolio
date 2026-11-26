# Screen: Home (`/`) — navbar and hero, Business Spec

Version 1.1, 2026-11-26. The first two pieces of the portfolio home: a floating navbar and a pinned, multi-layer hero. Public surface, poster language from [STYLE.md](../STYLE.md) (paper, ink, signal orange on marks only), motion from [ANIMATION_UI.md](../ANIMATION_UI.md). The name splash ([SPLASH_BUSINESS.md](SPLASH_BUSINESS.md)) plays over this page first and lands its logo on the navbar's monogram.

---

## 1. Business purpose

| Goal                           | How the screen delivers it                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Say who and what in one glance | A massive three-line statement, the owner's name as brush lettering, one intro paragraph.                           |
| Make the craft visible         | Everything is in motion but readable: masked line reveals, scroll-driven drifts, pointer depth, a velocity marquee. |
| Get the visitor moving         | Two calls to action (see the work, get in touch) and a navbar that stays reachable.                                 |
| No content in code             | Every word, link and label lives in MongoDB (`site_screens`, `_id: "home"`).                                        |

## 2. Routing

| Situation            | Result                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| Maintenance mode on  | `/` moves on to `/maintenance` underneath the splash (unchanged).       |
| Maintenance mode off | `/` renders the navbar and the hero (the splash plays over them first). |

## 3. Content model (`site_screens/home`)

| Field                                              | Use                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------- |
| `meta.title`, `meta.description`                   | Page metadata.                                                                |
| `nav.links[]` (`label`, `href`)                    | 2–6 links in the floating pill (in-page anchors for sections still to come).  |
| `nav.status`                                       | Availability chip beside the call to action.                                  |
| `nav.cta` (`label`, `href`)                        | Navbar call to action.                                                        |
| `nav.menu`, `nav.close`                            | Phone menu button labels.                                                     |
| `hero.eyebrow`                                     | Mono label at the top left.                                                   |
| `hero.lines[]`                                     | 2–4 statement lines, set massive (`CREATE.` …).                               |
| `hero.signature`                                   | Brush lettering across the statement (the owner's name; generic in the seed). |
| `hero.intro`                                       | One paragraph under the statement.                                            |
| `hero.primary`, `hero.secondary` (`label`, `href`) | The two calls to action.                                                      |
| `hero.meta[]` (`label`, `value`)                   | 0–4 small facts (role, focus, status).                                        |
| `hero.chips[]`                                     | 0–6 floating tags around the sphere.                                          |
| `hero.marquee[]`                                   | 2–8 words in the band under the hero.                                         |
| `hero.scroll`                                      | The scroll cue.                                                               |

Seeds stay generic: no personal details in code or seed files.

## 4. Navbar

- Fixed at the top. **Left:** the animated monogram (links to `/`; `data-brand-mark`, where the splash logo lands). **Centre (≥ md):** poster-style labels separated by slashes (`WORK / ABOUT / SERVICES / CONTACT`); on hover the letters roll up one after another and an orange dot slides under the link. **Right:** a status line with a pulsing dot and the call-to-action pill (magnetic on fine pointers).
- At the top of the page the row is transparent. Scrolling down hides it; scrolling back up brings it back as a **blurred paper bar** (backdrop blur, hairline border, soft shadow) with tighter padding.
- **Phone:** monogram + `MENU`. The menu is a full-screen paper overlay: links stacked massive, rising one by one through masks, crosshairs in the corners. `Esc` closes it and focus returns to the button.
- Entrance (after the splash): items drop in one by one.

## 5. Hero

A clean two-column stage where **nothing overlaps**, inside a 200 svh section with a sticky 100 svh stage, so scrolling plays a sequence before the page moves on.

- **Left (7 of 11 columns):** eyebrow; the statement (massive, the middle line in outline); the name in brush lettering on its own line with an orange stroke; the intro; the two calls to action.
- **Right (4 of 11, ≥ lg):** a framed card (crop marks) holding the halftone sphere; the tags in a neat row under it.
- **Bottom:** the facts on a hairline rule, in three columns.
- **Phone:** one column (eyebrow, statement, signature, intro, calls to action); the sphere, tags and facts are left out.

| Layer                         | Entrance                          | Scroll (0 → 1 through the section)            | Pointer                   |
| ----------------------------- | --------------------------------- | --------------------------------------------- | ------------------------- |
| Statement lines               | rise through masks, staggered     | each line rises at its own speed              | —                         |
| Signature                     | wipes in; the orange stroke draws | moves with the left column                    | —                         |
| Intro, calls to action, facts | fade up                           | fade out by the middle                        | —                         |
| Sphere card                   | grows from 0.92                   | rises; the sphere inside swells and turns     | +18 px (inside its frame) |
| Tags                          | rise one by one                   | move with the card                            | —                         |
| Whole stage                   | —                                 | shrinks into a rounded card on ink at the end | —                         |

Under the hero, an ink marquee band moves with the scroll speed (skews with velocity). Large type also skews slightly with scroll speed. Entrances wait for the splash to start leaving (or start at once when it doesn't play).

## 6. Accessibility and reduced motion

- Real text in the DOM; decorative layers are `aria-hidden`. The statement is one `h1`.
- Reduced motion: no entrances, no parallax, no skew, no smooth scroll; the layout is the final frame.
- Keyboard: every link and button is reachable in order; visible focus rings.

## 7. Failure behaviour

- Missing or invalid `home` content: the page shows the 404 screen (logged), as before the home existed.
