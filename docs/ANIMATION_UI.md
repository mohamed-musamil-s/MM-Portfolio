# Animation and Interactive UI

Version 1.1, 2026-11-23 (hero action, custom cursor, depth stage). This document covers the motion system, the `<MagicIcon />` engine, the `<ActionButton />` architecture, and the shared hooks behind them. It also specifies the portfolio's flagship motion pipelines.

Related documents:

- [STYLE.md](STYLE.md): the public portfolio look.
- [ADMIN_STYLE.md](ADMIN_STYLE.md): the studio look.

---

## 1. Principles

### Two motion personalities, one codebase

| Surface | Theme key | Feel |
| --- | --- | --- |
| Public portfolio | `portfolio` | editorial, kinetic, tactile, gallery-grade |
| Admin studio (`/studio/...`) | `studio` | snappy, deterministic, precision-engineered, state-driven |

### Reuse rule

There is **one** implementation of each behaviour:

- the state machine;
- the motion physics;
- icon state handling;
- the button method logic.

Components read the theme from `<MotionProvider theme>` and change only **tokens** (timing, springs, whether magnetism is on) and **classes** (the `tv()` variant). Never fork a component per surface.

### Where shared code lives

| Kind | Folder |
| --- | --- |
| Reusable components | `src/components/ui/` |
| Reusable hooks | `src/hooks/` |
| Framework-free motion logic and tokens | `src/lib/motion/` |

---

## 2. Library stack and ownership

Each library owns one job. Two libraries must never animate the same property of the same element.

| Library | Version | License | Owns | Loaded |
| --- | --- | --- | --- | --- |
| `motion` | 14.x | MIT | Element transforms (x, y, scale, rotate), springs, gestures (hover, tap), `AnimatePresence`, `MotionConfig` | Every animated client component |
| `animejs` | 4.x | MIT | SVG **geometry**: path `d` morphing and stroke drawing (`createDrawable`). Later: staggered microtext decoding (`scrambleText`, `stagger`) | MagicIcon, kinetic type |
| `gsap` + `@gsap/react` | 3.15 / 2.1 | **GSAP Standard License** (free, including commercial use, but **not** OSI open source) | Scroll choreography (`ScrollTrigger`, `Observer`) **and cinematic timelines**: multi-step, film-like sequences where many elements must stay in sync (e.g. the maintenance film). Inside such a component GSAP owns every element. | Portfolio scroll sections, `MaintenanceIllustration` |
| `lenis` | 1.3.x | MIT | Inertial smooth scroll, driven from GSAP's ticker | Portfolio `MotionProvider` only |
| `three`, `@react-three/fiber`, `@react-three/drei` | 0.187 / 9.8 / 10.7 | MIT | WebGL: halftone and ink-grain shader plane, depth cards | Portfolio hero only, through `next/dynamic` with `ssr: false` |
| `radix-ui` | 1.8.x | MIT | Accessible headless primitives (`VisuallyHidden` now; Dialog, DropdownMenu, Tooltip and others when needed) | Where used |
| `tailwind-variants`, `clsx`, `tailwind-merge` | n/a | MIT | Variant classes (`tv()`) and `cn()` | Everywhere |

**About GSAP.** Since 2025 every GSAP plugin (ScrollTrigger, SplitText, MorphSVG and the rest) is free to use. The license is still GSAP's own, not an open-source one. If a strictly OSI-licensed stack is ever required, motion's `useScroll` plus Lenis can replace ScrollTrigger.

**Bundle discipline:**

- The three/R3F packages are installed but **must only be imported through `next/dynamic`** from a portfolio component.
- Studio routes never load three, GSAP or Lenis.

---

## 3. File map

```
src/lib/motion/
  tokens.ts           # MOTION_THEMES (portfolio | studio), EASE_PRINT, SHAKE_KEYFRAMES
  motion-context.ts   # React context behind MotionProvider
  action-machine.ts   # pure state machine + ActionError + failure normalisation
  gsap.ts             # single GSAP entry: registers ScrollTrigger, Observer, useGSAP once
  anime.ts            # token -> anime.js easing / ms helpers
src/components/motion/   # reusable editorial motion pieces
  InkReveal.tsx       # masked ink-stamp line reveal (mount or in-view)
  InkRule.tsx         # partial headline rule drawn from the left
  Marquee.tsx         # infinite ticker; scroll velocity speeds it up and reverses it
  VelocitySkew.tsx    # skews large type with scroll velocity (clamped)
  ParallaxLayer.tsx   # scroll (GSAP, outer) + pointer (motion, inner) depth layer
  CalibrationRig.tsx  # counter-rotating rings, vernier draw-in, lock-on reticle, scroll turn
  RegistrationMark.tsx# breathing print crosshair (open / bullseye)
  StatusDot.tsx       # signal-orange live beacon with pulse ring
  HalftoneSphere.tsx  # canvas dot-screen globe, orange meridian, pointer-lit
  XMark.tsx           # hand-drawn X drawn in on view
  CropMarks.tsx       # static L crop marks
src/hooks/
  useCountdown.ts     # second-aligned clock (useSyncExternalStore), SSR-safe, pauses when hidden
  usePointerParallax.ts # viewport-relative pointer depth springs
  useScrollVelocity.ts  # smoothed window scroll velocity (Marquee, VelocitySkew)
  useMotionTheme.ts   # { theme, tokens, reducedMotion } from the provider
  useActionRunner.ts  # runs an async action through the state machine
  useMagnetic.ts      # magnetic cursor pull (portfolio only)
  useParallax.ts      # GSAP ScrollTrigger parallax layer
  useMediaQuery.ts    # live CSS media query (useSyncExternalStore), false on the server
  useRedirectCountdown.ts # frame-driven countdown with pause; skips hidden-tab time
src/components/ui/
  MotionProvider.tsx  # MotionConfig + theme context + Lenis
  MagicIcon.tsx       # public icon component
  magic-icon/         # types, InkPath primitive, icon definitions, orbit hook
  ActionButton.tsx    # public button component
  action-button/      # types, tv() styles, behaviour hook, hold-to-confirm
  HeroActionButton.tsx# the one oversized CTA per screen (§8b); reuses useActionButton
  hero-action/        # tv() slots for the hero action layers
  CustomCursor.tsx    # signal dot + spring ring / reticle (§8c)
src/components/maintenance/
  DepthStage.tsx      # CSS 3D slab + floating props around the film (§8d)
src/lib/shared/
  tw-merge.ts         # tailwind-merge that knows the type scale (text-h3 vs text-paper)
  tv.ts               # tv() bound to that merger; recipes import tv from here
```

---

## 4. Motion tokens

From `src/lib/motion/tokens.ts`. Components never hardcode timing.

| Token | `portfolio` | `studio` |
| --- | --- | --- |
| `duration.fast / base / slow` (s) | 0.24 / 0.48 / 0.9 | 0.12 / 0.18 / 0.28 |
| `ease` | `EASE_PRINT` `[0.2, 0, 0, 1]` (same as `ease-print` in STYLE.md) | same |
| `spring` (stiffness / damping / mass) | 220 / 24 / 0.9 (soft, no overshoot) | 620 / 40 / 0.6 (stiff, settles fast) |
| `pressScale` | 0.98 | 0.97 (tactile detent) |
| `magnetic` | radius 72px, strength 0.28 | off |
| `statusHoldMs` success / error | 1600 / 2000 | 1200 / 1800 |
| `drawStaggerMs` (icon mount draw) | 70 | 40 |
| Smooth scroll (Lenis) | on | off |

Shared:

- `SHAKE_KEYFRAMES` (px) for button errors.
- `ICON_SHAKE` (viewBox units) for icon errors.

---

## 5. `<MotionProvider />`

```tsx
<MotionProvider theme="portfolio">{/* public shell */}</MotionProvider>
<MotionProvider theme="studio">{/* studio layout */}</MotionProvider>
```

What it does:

- **Context.** Provides `{ theme, tokens, reducedMotion }`. Every hook and component reads it through `useMotionTheme()`, which throws outside a provider, so a missing provider fails loudly.
- **Motion defaults.** Wraps children in `MotionConfig reducedMotion="user"` with the theme's default transition. Under the OS reduced-motion setting, motion skips transform and layout animation and keeps opacity.
- **Smooth scroll** (`smoothScroll`, which defaults to on for `portfolio`):
  - Lenis runs with `autoRaf: false` and is ticked from `gsap.ticker`, with `lagSmoothing(0)`.
  - `lenis.on("scroll", ScrollTrigger.update)` keeps scrubbed parallax on the same frame as the scroll.
  - Everything is cleaned up on unmount.
  - Lenis is skipped entirely under reduced motion.

**Not mounted yet.** It goes into `PublicShell` and the studio layout when those surfaces are styled.

---

## 6. Action state machine

`src/lib/motion/action-machine.ts` is pure TypeScript with no React, so it's trivially testable.

```
idle ──ARM──▶ arming ──DISARM──▶ idle
 │              │
 └──START──▶ loading ◀──START── (arming, error)
                │
       RESOLVE ─┴─ REJECT
          ▼          ▼
       success     error ──RESET──▶ idle
```

- **Double-submit lock.** `loading` and `success` ignore `START`. `useActionRunner` also holds a busy ref, so two clicks in the same tick still start only one run.
- **Outcome normalisation.** An action may:
  - resolve: success;
  - return a non-OK `Response`: error, with its HTTP status as the badge;
  - throw `new ActionError(message, code)`: error with that code;
  - throw anything else: error with no code.
- **Auto reset.** Success and error return to `idle` after `statusHoldMs`.

---

## 7. `<MagicIcon />`

```tsx
<MagicIcon name="lock" state="error" size={16} />
<MagicIcon name="menu" state={open ? "active" : "idle"} label="Menu" />
```

**Hard rule.** No icon fonts and no static SVG files for UI icons. Every UI icon is a `MagicIcon`. Decorative print motifs, such as the registration marks in STYLE.md §5, are not icons.

### API

| Prop | Default | Notes |
| --- | --- | --- |
| `name` | (required) | `arrow-up-right` · `lock` · `copy` · `menu` · `sync` · `status` · `calibrate` |
| `state` | `idle` | `idle` · `hover` · `active` · `loading` · `success` · `error`. The parent control drives it. |
| `size` | 20 | px; the icon is drawn on a 24-unit grid |
| `strokeWidth` | 1.5 | square caps |
| `label` | (none) | Accessible name (`role="img"`). Leave it out next to a visible label; the icon is then `aria-hidden`. |
| `drawOnMount` | `true` | Strokes draw in, staggered by `drawStaggerMs`. |

### How it's built

- **`InkPath`** is the only stroke primitive.
  - anime.js owns its `d` attribute (morph) and its stroke drawing.
  - React renders only the initial `d`, so a re-render can't interrupt a tween.
  - A path that starts hidden renders with `pathLength=1` and `strokeDasharray="0 1"`, so it never flashes before anime.js takes over.
- **`motion.g`** groups own transforms: lift, launch, layer separation, orbit and shake. They never touch `d`.
- **Decorative motifs outside MagicIcon** (registration marks, X marks, the rig) may use motion `pathLength` on their own elements. The rule is per element: no element is ever driven by two libraries.
- **The error state:**
  - the icon shakes (`ICON_SHAKE`);
  - its colour switches to `var(--icon-error)`. That is `--studio-danger` (red) on the studio surface and `currentColor` (unchanged ink) on the public surface, because STYLE.md forbids colour there.

### Icon behaviours

| Icon | hover | active | loading | success | error |
| --- | --- | --- | --- | --- | --- |
| `arrow-up-right` (navigate, external) | retracts, then launches; a registration crosshair draws in at the target | stamps down (scale 0.82) | n/a | n/a | shake |
| `lock` (auth) | shackle rises 1 unit | shackle presses in | shackle ticks | shackle lifts and swings open (pivot on the right leg) | shake + error colour |
| `copy` (copy, export) | layers separate in depth | separated | n/a | squares erase, a hand-drawn check draws in, then settles back on reset | shake |
| `menu` (drawer) | asymmetric rules lengthen | rules morph into the poster's hand-drawn X | n/a | n/a | n/a |
| `sync` (DB, sync) | n/a | n/a | registration mark orbits continuously | decelerates into the next quarter turn and locks (centre dot) | shake |
| `calibrate` (calibration, gear) | teeth extend into a gear | indexes an eighth of a turn | spins | ring and teeth erase, check draws in | shake |
| `status` (inside ActionButton) | n/a | n/a | orbiting arc | check draws in | hand-drawn X draws in + shake |

### Adding an icon

1. Add the name to `ICON_NAMES` in `magic-icon/types.ts`.
2. Write a component in `magic-icon/icons.tsx` that reads `useIconContext().state`:
   - morph targets must share the same path command structure (`M x yL x y`, and so on);
   - drawn and erased strokes use the `drawn` prop.
3. Register it in `ICONS`. The `Record<IconName, FC>` type makes a forgotten registration a compile error.

---

## 8. `<ActionButton />`

One button for the whole app. **`method`** decides the behaviour; **`variant`** decides only the look.

```tsx
<ActionButton method="submit" onAction={() => fetch("/api/x", { method: "POST" })}>Save</ActionButton>
<ActionButton method="submit" icon="lock" status={pending ? "loading" : "idle"}>Sign in</ActionButton>
<ActionButton method="navigate" href="/work">Selected work</ActionButton>
<ActionButton method="destructive" holdMs={1200} onAction={deleteRelease}>Delete</ActionButton>
<ActionButton method="copy" copyText={url}>Copy link</ActionButton>
<ActionButton method="toggle" pressed={open} onPressedChange={setOpen}>Menu</ActionButton>
```

The props are a discriminated union on `method`, so each method only accepts its own props (`href` for `navigate`, `copyText` for `copy`, and so on).

### Method matrix

| `method` | HTTP intent | Element | Choreography | Default icon |
| --- | --- | --- | --- | --- |
| `submit` | POST | `<button>` (`type=submit` when there's no `onAction`) | Progress fill creeps to 90%, completes to 100% on success (lock-in), drains on error | status icon |
| `async-fetch` | GET | `<button>` | Inline status icon: orbit, then check or X. Editorial variant inverts while loading. | status icon |
| `navigate` | GET (route) | `next/link`, or `<a target=_blank>` when `external` | Label shifts forward 3px (directional momentum); arrow launches on hover and stamps on press | `arrow-up-right` |
| `destructive` | DELETE | `<button>` | **Press and hold** (pointer, or Space/Enter) arms a fill meter for `holdMs` (default 1200). Releasing early cancels. A plain click does nothing. Then runs like `submit`. | status icon |
| `copy` | n/a | `<button>` | Writes `copyText` to the clipboard; the copy icon morphs into a check | `copy` |
| `toggle` | n/a | `<button aria-pressed>` | On/off. Editorial: stays ink-filled. Studio: accent fill. Icon `active` while on (menu becomes X). | `menu` |

### Variant matrix

| | `editorial-ink` (portfolio default) | `studio-action` (studio default) |
| --- | --- | --- |
| Base | `border-ink bg-paper`, uppercase `text-label` grotesk, `min-h-11` | `rounded-md border-line bg-panel`, `text-sm`, `h-9` |
| Hover | Liquid **ink wipe**: the fill layer scales in from the left; the label inverts through `mix-blend-difference`; four registration crosshairs slide in and **lock onto the corners** | Crisp **border illumination** (`border-accent`) |
| Cursor | **Magnetic pull** (spring) within 72px | none |
| Press | scale 0.98 | **Detent** scale 0.97 |
| `tone="solid"` | Ink-filled pill, no wipe or corner marks, **no magnetic pull** (one primary action per screen) | n/a |
| Focus | `outline-2 outline-offset-3 outline-ink` | `border-accent ring-3 ring-glow` |
| Loading | ink fill (submit: progress) + status orbit | 2px accent progress bar (submit) or inline status orbit |
| Success | fill completes + check | check + green **pulse ring** + `border-success` |
| Error | fill drains, spring **shake**, mono error badge (ink only) | shake, `border-danger`, red badge (`401`, `500`), icon turns red |
| Destructive | hold fills with ink | hold fills `bg-danger/12`, red text and border |

### Layer structure

Each layer exists so that two animations never fight over the same transform:

```
anchor  (static: measured by the magnetic hook; holds the live region)
└─ shaker  (error shake, x)
   └─ magnet  (magnetic x / y)
      ├─ root  <button> / <a>  (press scale, overflow hidden)
      │   ├─ fill     (scaleX 0..1: wipe / progress / hold meter)
      │   └─ content  (icon, label, status icon, badge)
      ├─ corner marks  (editorial)
      └─ success pulse (studio)
```

### Accessibility

- **Live region.** A `VisuallyHidden` live region next to the button announces "Working", "Done" or "Copied", and "Failed, 401".
- **Hold instruction.** Destructive buttons carry `aria-describedby` pointing at "Press and hold to confirm".
- **Busy state.** `aria-busy` is set while loading. The button stays focusable; the state machine blocks repeat submits.
- **Toggles** expose `aria-pressed`. **External links** get " (opens in a new tab)" for screen readers.
- **Hover equivalent.** Keyboard focus (`:focus-visible`) triggers the same visual state as hover.

### Using it with a form

Leave out `onAction` and drive `status` from the form's pending state. The button then submits the form natively and only shows the state.

---

## 8b. `<HeroActionButton />`

The single oversized call to action on a screen. It reuses ActionButton's behaviour engine (`useActionButton`: state machine, double-submit lock, auto reset after `statusHoldMs`) with its own choreography. Today it backs **CHECK AGAIN** on `/maintenance`.

```tsx
<HeroActionButton
  labels={{ idle: "CHECK AGAIN", loading: "CHECKING STATUS...", success: "STILL UPGRADING" }}
  onAction={checkNow}
/>
```

| State | Choreography |
| --- | --- |
| Idle | Signal halo breathes (scale 1 → 1.09, fades, 2.4s loop). A signal sheen sweeps the ink surface (1.3s, every ~4s). Four reticle brackets frame the pill. The sync icon turns slowly (24°/s). |
| Hover / focus | Magnetic pull (portfolio tokens). Two-layer wipe: signal from the left (0.42s), then a deeper ink gradient (0.5s, 0.12s later). Brackets open from 8px to 14px. The icon primes. |
| Press | Detent: scale 0.96 and a 2px drop on a stiff spring. A signal shockwave leaves the pill. |
| Loading | The label slides to the busy label. A comet (22% of the perimeter) orbits a ring 7px outside the pill. Brackets lock in and rotate. The icon orbits. |
| Success | The label slides to the done label. The icon becomes an orange check. A burst of 12 rays and a second shockwave, then it settles back to idle. |
| Error | Shake (`SHAKE_KEYFRAMES`) and an X icon. |

- All labels sit in one grid cell, so the pill keeps the width of the longest label.
- Effects draw outside the pill: don't put it inside an overflow mask (e.g. `InkReveal`). CheckAgain fades it in on its own.
- `CheckAgain` holds the busy state for at least 900ms so it can be read even when the API answers instantly.
- Reduced motion: every state change stays; loops, waves, rays and the magnetic pull are dropped.

## 8c. `<CustomCursor />`

Signal dot (exact) and a trailing ring (spring: stiffness 520, damping 38). Interactive targets turn the ring into a reticle (×1.55); a press compresses it (×0.78) and sends a pulse from the click point. Mounted once in `PublicShell`; renders nothing on coarse pointers (`useMediaQuery("(pointer: fine)")`). The native cursor is hidden by an unlayered rule on `:root[data-custom-cursor="on"]`, so it beats `cursor-*` utilities. Mark extra targets with `data-cursor="interactive"`.

## 8d. `<DepthStage />` (3D-look maintenance stage)

Pure CSS 3D (`perspective` + `preserve-3d`), no WebGL. The film SVG is the front face of a slab extruded 34px (top face newsprint, right face graphite with a signal edge strip). Around it, at different depths: a cube with a signal top (z 110, spins), an extruded six-layer signal gear (z 70, spins), a lit orb (z 140) and a version chip (z 90). A blurred floor shadow drifts against the lean.

| Layer | Owner | Motion |
| --- | --- | --- |
| tilt | motion springs | Rests at a three-quarter view (rotateX -10°, rotateY -19°), leans up to 9° with the pointer. |
| sway | GSAP | Slow idle drift (±4°, 6s yoyo). |
| lift | GSAP | On every status check (manual or the minute poll): rises 46px toward the camera and turns frontal, a signal scan beam sweeps the screen, the outline pulses, props hop, spins speed up ×6, then everything settles. |

Reduced motion: a still three-quarter view; no loops or check sequence.

## 9. Shared hooks

| Hook | Purpose |
| --- | --- |
| `useMotionTheme()` | Theme, tokens and reduced-motion flag. |
| `useActionRunner()` | `run(action)`, `arm()`, `disarm()`, plus `state`. Used by ActionButton; reuse it for any async control (forms, menu items). |
| `useMagnetic(enabled)` | Returns `anchorRef`, which you attach to a static wrapper, and the `x`/`y` springs for the moving element. Only active on fine pointers, with motion allowed, when the theme has `magnetic`. |
| `useParallax(ref, { speed })` | Scrubbed ScrollTrigger drift. Cleanup comes from `useGSAP` context revert. Off under reduced motion. |
| `useScrollVelocity()` | Smoothed, signed window scroll velocity (px/s) as a motion value. It drives `Marquee` and `VelocitySkew`. |
| `usePointerParallax(depth)` | `x`/`y` springs that move up to `depth` px with the cursor (negative depth moves against it). Fine pointers only. |
| `useMediaQuery(query)` | Live boolean for a CSS media query, `false` on the server. |
| `useRedirectCountdown(seconds, onDone)` | `{ secondsLeft, progress, paused, togglePaused }`. Frame-driven; never counts time while the tab is hidden. Drives the 404 redirect. |
| `useCountdown(targetAt, windowStart)` | `{ parts, overdue, progress }`, or `null` during SSR. Ticks on the second boundary and pauses while the tab is hidden. |

---

## 10. Portfolio flagship pipelines

**Status: specified here, not built yet.** There's no public page to mount them on, so they'll be built when the portfolio is unlocked. `useParallax` already exists.

### 10.1 Editorial halftone and ink canvas (three + R3F)

- **Location:** `src/components/portfolio/HalftoneCanvas.tsx`, loaded with `next/dynamic(..., { ssr: false })`, and only in the hero.
- **The scene:** one full-bleed plane with a custom `ShaderMaterial`.
  - It samples the grayscale hero portrait and outputs **halftone dots** (a rotated grid, with dot radius taken from luminance).
  - It adds a **risograph grain** (static blue-noise texture), plus slight ink spread at the dot edges.
  - Colours come from uniforms bound to the STYLE.md tokens: paper `#F4F3EE` and ink `#0A0A0A`. No other colours.
- **Interaction:**
  - The pointer moves a displacement uniform (damped), giving a subtle depth parallax of at most 6px.
  - Scroll progress (from ScrollTrigger) fades the dot density.
- **Readability guard:** the canvas sits behind text with zero opacity effect on the text plates. Text never overlaps active halftone.
- **Performance:**
  - `dpr={[1, 1.5]}` and `frameloop="demand"`, invalidated only on pointer or scroll changes.
  - The canvas pauses when off-screen (IntersectionObserver) and when the tab is hidden.
  - Geometry, material and textures are disposed on unmount.
- **Fallbacks:**
  - Under reduced motion, without WebGL, or with `saveData`: a static pre-rendered halftone image.
  - The STYLE.md CSS grain overlay stays static either way.

### 10.2 Multi-layer scroll parallax (GSAP ScrollTrigger + Lenis)

Each layer gets its own `useParallax` speed:

| Layer | `speed` |
| --- | --- |
| Condensed type ("Mohamed") | 0.15 |
| Brush wordmark ("Musamil") | -0.1 (counter-drift) |
| Registration crosshairs | 0.05 |
| Photography | 0.25 |

- **Pinning:** ScrollTrigger pins the hero for one viewport.
- **Mobile:** below `md`, only two layers move, at half speed.
- **Reduced motion:** layers are static.

### 10.3 Kinetic typography (motion + anime.js)

- **Ink-stamp line reveal (motion):** each headline line is masked (`overflow-hidden`), slides up from 100%, and clips in left to right. Lines are staggered by 80ms, run once, on first view.
- **Microtext decoding (anime.js `scrambleText`):** slash labels such as `MINDSET / AMBITION / FREEDOM` resolve character by character, using mono glyphs, over 600ms.
- **Scroll-velocity skew (motion, built as `VelocitySkew`):** large type skews in proportion to scroll velocity, clamped to ±4° and springing back to 0. Motion owns transforms, so `useScroll` + `useVelocity` is used here instead of GSAP `Observer`.
- **Accessibility:**
  - real text stays in the DOM; split spans are `aria-hidden`, with the original text kept in an `aria-label` or a visually hidden copy;
  - under reduced motion there's no decoding and no skew.

---

## 11. Dual-theme token bindings

| Concern | Portfolio (STYLE.md) | Studio (ADMIN_STYLE.md, provisional) |
| --- | --- | --- |
| Surface attribute | `data-surface="public"` | `data-surface="studio"` |
| Motion provider | `<MotionProvider theme="portfolio">` | `<MotionProvider theme="studio">` |
| Button variant | `editorial-ink` | `studio-action` |
| Colours used by components | `paper`, `newsprint`, `ink`, `graphite`, `rule`, and `signal` (accent marks only, STYLE.md §2.5) | `canvas`, `panel`, `fg`, `fg-muted`, `line`, `accent`, `on-accent`, `glow`, `danger`, `success` |
| Icon error colour (`--icon-error`) | `currentColor` (no colour) | `--studio-danger` |
| Fonts | `font-grotesk`, `font-technical` | system sans, `font-mono` (until ADMIN_STYLE defines fonts) |

---

## 12. Performance and accessibility guardrails

1. **Animate only compositor properties:** `transform`, `opacity` and `clip-path`. Two documented exceptions:
   - SVG `d` and stroke dash on icons, which are tiny elements;
   - the studio border and ring colour transition (CSS, 150ms).
2. **Every imperative animation is cleaned up.**
   - anime.js tweens are paused in effect cleanup.
   - motion controls are `.stop()`-ed.
   - GSAP runs inside `useGSAP` (context revert).
   - Lenis is destroyed and removed from the ticker.
   - three objects are disposed.
3. **Reduced motion is honoured everywhere:**
   - `MotionConfig reducedMotion="user"`;
   - anime.js jumps straight to the end state;
   - Lenis, magnetism, parallax, orbit, shake and canvas are all off.
4. **No animation blocks input.** Navigation fires immediately (the motion plays alongside it), and state changes are interruptible.
5. **Each library loads only where it's used:**
   - GSAP and Lenis: portfolio routes only;
   - three/R3F: dynamic import in the hero only;
   - motion and anime.js: wherever `MagicIcon` or `ActionButton` render.
6. **Touch:** no hover-only information. Magnetism is off on coarse pointers, and touch targets are at least 44px (editorial).

---

## 13. Verification (2026-11-22)

The components were exercised on a temporary page (since removed) with both themes, in the in-app browser.

**Verified working:**

- Every icon in every state:
  - the arrow stamps down;
  - the menu morphs into the X;
  - the lock opens on success;
  - copy turns into a check;
  - the sync and status marks orbit while loading;
  - error shakes.
- Studio buttons:
  - submit: progress bar, then check, success border and pulse;
  - submit with lock icon: a 401 shows the red lock shake, the danger border and the `401` badge;
  - async-fetch: a `500` response shows the `500` badge.
- Destructive:
  - a plain click does nothing;
  - releasing early cancels;
  - a full hold (pointer, and keyboard Space) fires.
- Double-click lock: two quick clicks start one run.
- Toggle: `aria-pressed`, icon morphs into the X.
- Navigate: renders an `<a>` with the right `href`.
- Editorial:
  - hover gives the ink wipe, inverted label and corner crosshair lock-on;
  - errors stay ink-only (no red) with the badge.
- Magnetic pull: about 15px toward a nearby cursor on the portfolio variant, nothing on the studio variant.
- Lenis active under the portfolio provider.

**Not verified:**

- Copy *success*: the in-app browser denies the `clipboard-write` permission. The error path was verified and the success path shares the same runner.
- The reduced-motion behaviour: the code paths are in place, but OS-level emulation wasn't available.
