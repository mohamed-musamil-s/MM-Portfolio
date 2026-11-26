# Screen: Home (`/`) — the full portfolio page, Business Spec

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

- **Top of the page:** an open, transparent row. On the left, the monogram (smaller: 24px, 28px from `sm`) and the name on two lines; the splash lands its logo on the monogram. In the middle, numbered links (`01 About` …) whose letters roll up on hover. On the right, the live status (from `xl`) and the magnetic "Let's talk" pill.
- **Active section:** the section under the middle of the viewport is marked by an ink pill that slides from link to link (`aria-current="location"`).
- **Scrolling:** scrolling down hides the bar. Scrolling back up brings it back as a floating island (max 1120px, rounded, blurred paper), with the reading progress drawn in signal along its lower edge. The status moves out of the island to keep it compact.
- **Phones:** monogram and a "Menu" pill with two lines open a full-screen sheet. Its links rise in turn; it holds focus inside and Escape closes it.
- **Reduced motion:** the bar never hides.

## 5. Hero

- **Left:** the status chip; the name massive in the wide display face (Archivo expanded, every capital M in the logo's Zen Dots M), the second line in outline; the role line; the intro; two pill buttons (ink with an orange arrow circle, and outline). Labels roll on hover; **buttons never move**.
- **Right (≥ lg):** the ink portrait bleeding off the right edge and fading into the paper at the bottom.
- **Bottom:** the stats rail: mono labels, big numbers that count up, split by hairlines.
- **Phone and tablet:** one column; the portrait sits in the flow under the buttons; no pinning.
- **Motion (≥ lg):** a 180 svh section with a sticky stage. Entrance: the name rises through masks, the portrait wipes up from the bottom, the rest fades up, the numbers count. Scroll: from the first scroll the stage shrinks into a rounded box (to 80% by the middle) over a stone backdrop, a shade off the box so nothing flashes; the name lines slide apart sideways, the portrait rises and swells slowly, the text and rail fade. Around the box the backdrop has its own design: a fine grid, a signal glow, the role labels in the top corners, and the name huge (first line outlined in a mid grey, second in signal) sliding apart across the bottom. In the second half the box tips back and lifts away while the stone deepens gradually to ink, so it meets the ink marquee band without a jump. Pointer: the portrait moves with depth.
- Under the hero, an ink marquee band moves with the scroll speed.

## 6. Sections under the hero

Content for each lives in `site_screens/home` (`about`, `experience`, `skills`, `work`, `recognition`, `contact`, `footer`; schema in `src/lib/shared/content/home-sections-schema.ts`), first filled from the previous portfolio and the owner's profile. Every section opens with the same header (number, eyebrow on a hairline, the title massive in the wide face rising through its mask, a count). Elements reveal once as they enter the viewport. Sections clip sideways so sliding cards never widen the page. Icons, logos and project illustrations live in `public/portfolio/`.

| #   | Section (`id`)              | Layout                                                                                                                                                                                                                                                                                                                                                                                                                 | Motion                                                                                                                                                                                                                                                                                                        |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | About (`about`)             | Statement left, story and two pills right; a facts strip; "the road so far" timeline.                                                                                                                                                                                                                                                                                                                                  | The statement inks in word by word with the scroll; the timeline's signal line draws with the scroll.                                                                                                                                                                                                         |
| 6.2 | Experience (`experience`)   | A horizontal accordion of tall panels, one per role. The open role fills the row in ink: period (live dot if current), length, place, logo and company, the title massive, highlights (`**bold**` key phrases) in two columns, stack chips, the number giant and outlined. The others fold to slim strips with the company and title running up the side and the start year at the foot. The current role starts open. | The panels wipe up one after another on the way in; hover (short intent delay), click or focus opens a strip, its width springing open and the story rising in. Phones: a vertical accordion with the same story.                                                                                             |
| 6.3 | Skills (`skills`)           | The groups as cards on a 3D ring (index, tool count, title, note, compact chips; the dark group in ink). Under it: the front group's number and title, 01–07 jump buttons, the legend.                                                                                                                                                                                                                                 | Large screens: the section pins and the ring turns one group to the front per stretch of scroll. On the way in it rises from flat, spinning, with the cards bursting out of the centre over a perspective grid floor; the pointer tilts it. Phones and reduced motion: the cards flip up into place in turn.  |
| 6.4 | Work (`work`)               | A deck of case cards, alternating ink and newsprint: category and n / total, the number giant and outlined, title, summary, tags, period; the illustration on the right.                                                                                                                                                                                                                                               | Large screens: each card pins and the next slides up over it; covered cards settle back (smaller) and dim, and each image zooms out of a close crop as its card arrives. Phones and reduced motion: the cards follow each other.                                                                              |
| 6.5 | Recognition (`recognition`) | Awards as medals on ribbons (badge struck on a disc with a notched signal ring; title and org below). Education as diploma cards with a seal whose ring carries the school and years. Kind words as an ink panel showing one quote at a time, with a counter, a progress line and prev / next.                                                                                                                         | Medals drop in and swing to rest like pendulums, one after another; hover, focus or tap flips a medal like a coin to show what it was for. Diplomas tip up into place; the seal rings turn slowly. Quotes rise in word by word and move on every 7 s, paused on hover or focus and never with reduced motion. |
| 6.6 | Contact (`contact`)         | Headline, note, the email big (mailto, a signal line traces under it on hover), details as label / value rows; on the right the contact form (name, email, topic pills, message) whose messages land in the studio's chat module ([feature](../features/CONTACT_MESSAGES.md)).                                                                                                                                         | Headline rises; rows reveal in turn. The send button squashes on press, plays an impact while sending, then a check and a full-screen celebration once the server accepts the message; the thank-you card follows.                                                                                            |
| 6.7 | Footer (`footer`, ink)      | Eyebrow with a live local clock (`clock.timeZone`), the quote massive (second line outlined), the closing line in brush and a call to action, Navigate / Elsewhere / manifesto columns, the name as a full-width wordmark ending in the signal dot, copyright, round back to top.                                                                                                                                      | The content rises from behind the page as the footer scrolls in; quote lines rise through their masks; links roll on hover; wordmark letters rise one by one and the dot springs in last.                                                                                                                     |

The navbar's links jump to these anchors with Lenis smooth scrolling (offset for the bar).

**Parallax across the page.** Every section header carries its number giant and outlined on a slower layer behind the title. Supporting columns drift against the main ones: the About story and the Contact details (`Parallax` / `useParallax` in `section-kit.tsx`). The hero keeps its own scroll and pointer parallax. Masked lines are always watched through their mask (`MaskRise`), never the clipped line itself.

## 6. Accessibility and reduced motion

- Real text in the DOM; decorative layers are `aria-hidden`. The statement is one `h1`.
- Reduced motion: no entrances, no parallax, no skew, no smooth scroll; the layout is the final frame.
- Keyboard: every link and button is reachable in order; visible focus rings.

## 7. Failure behaviour

- Missing or invalid `home` content: the page shows the 404 screen (logged), as before the home existed.
