# Screen: Home (`/`) — navbar and hero, Business Spec

Version 2.0, 2026-11-26. Redesigned after the previous portfolio (`mm.s-portfolio`, "MM·2050 Signal"): wide display name, ink portrait, stats rail, glass capsule navbar. The first two pieces of the portfolio home: a floating navbar and a pinned, multi-layer hero. Public surface, poster language from [STYLE.md](../STYLE.md) (paper, ink, signal orange on marks only), motion from [ANIMATION_UI.md](../ANIMATION_UI.md). The name splash ([SPLASH_BUSINESS.md](SPLASH_BUSINESS.md)) plays over this page first and lands its logo on the navbar's monogram.

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

| Field                                              | Use                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| `meta.title`, `meta.description`                   | Page metadata.                                                              |
| `nav.name`                                         | Name beside the monogram (two lines when it has a space).                   |
| `nav.links[]` (`label`, `href`)                    | 2–6 links in the glass capsule.                                             |
| `nav.status`                                       | Status line in the phone menu.                                              |
| `nav.cta` (`label`, `href`)                        | "Let's talk" pill.                                                          |
| `nav.menu`, `nav.close`                            | Phone menu button labels.                                                   |
| `hero.status`                                      | Chip above the name, with a pulsing dot.                                    |
| `hero.lines[]`                                     | The name, 1–3 massive lines; the second is set in outline.                  |
| `hero.role`, `hero.roleMeta`                       | Role line: `FULL-STACK DEVELOPER —— MEAN · MERN`.                           |
| `hero.intro`                                       | One paragraph.                                                              |
| `hero.primary`, `hero.secondary` (`label`, `href`) | The two pill buttons.                                                       |
| `hero.stats[]` (`value`, `label`)                  | 0–4 numbers on the rail; the number counts up, prefix/suffix in the accent. |
| `hero.portrait` (`src`, `alt`, `caption`)          | The ink portrait (`/portraits/hero-portrait.svg`).                          |
| `hero.marquee[]`                                   | 2–8 words in the band under the hero.                                       |

Seeds stay generic: no personal details in code or seed files.

## 4. Navbar

- Fixed at the top. **Left:** the animated monogram (`data-brand-mark`, where the splash logo lands) with the name beside it on two lines. **Centre (≥ md):** the links in a glass capsule; on hover the letters roll up one after another and an orange dot slides under the link. **Right:** the "Let's talk" ink pill with an orange arrow circle (magnetic on fine pointers).
- At the top of the page the row is transparent. Scrolling down hides it; scrolling back up brings it back as a **blurred paper bar**.
- **Phone:** monogram + `MENU`; a full-screen paper overlay with massive stacked links (Esc closes, focus returns).
- Entrance (after the splash): items drop in one by one.

## 5. Hero

- **Left:** the status chip; the name massive in the wide display face (Archivo expanded, every capital M in the logo's Zen Dots M), the second line in outline; the role line; the intro; two pill buttons (ink with an orange arrow circle, and outline). Labels roll on hover; **buttons never move**.
- **Right (≥ lg):** the ink portrait bleeding off the right edge and fading into the paper at the bottom.
- **Bottom:** the stats rail: mono labels, big numbers that count up, split by hairlines.
- **Phone and tablet:** one column; the portrait sits in the flow under the buttons; no pinning.
- **Motion (≥ lg):** a 180 svh section with a sticky stage. Entrance: the name rises through masks, the portrait wipes up from the bottom, the rest fades up, the numbers count. Scroll: the name lines slide apart sideways, the portrait rises and swells slowly, the text and rail fade by the middle, the stage shrinks into a card on ink. Pointer: the portrait moves with depth.
- Under the hero, an ink marquee band moves with the scroll speed.

## 6. Accessibility and reduced motion

- Real text in the DOM; decorative layers are `aria-hidden`. The statement is one `h1`.
- Reduced motion: no entrances, no parallax, no skew, no smooth scroll; the layout is the final frame.
- Keyboard: every link and button is reachable in order; visible focus rings.

## 7. Failure behaviour

- Missing or invalid `home` content: the page shows the 404 screen (logged), as before the home existed.
