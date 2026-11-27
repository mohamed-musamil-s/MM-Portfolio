import { clamp01, expoInOut, progress, spring } from "@/lib/shared/motion/time-easing";
import { MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";
import {
  boxIn,
  center,
  fitFont,
  html,
  percent,
  px,
  rgba,
  rgbOf,
  setBox,
  setReveal,
  setRise,
  setShown,
  styleOf,
  wordIn,
  type Box,
  type Nodes,
  type Point,
  type Rgb,
} from "./splash-kit";
import { DESIGN_BLOCKS } from "./splash-scenes";
import {
  FLOOD_SECONDS,
  T,
  bezier,
  blockAt,
  cameraAt,
  chipAt,
  connectAt,
  connectionOf,
  cursorDesignAt,
  cursorEndAt,
  dotAt,
  dragAt,
  exitFadeAt,
  exitFlightAt,
  growAt,
  hookLogoOf,
  letterAt,
  letterGoneAt,
  linkAt,
  linkCurve,
  loadAt,
  logoAt,
  coreOf,
  matrixAt,
  mixBox,
  morphAt,
  pillAt,
  pulsesAt,
  rand,
  revealAt,
  riseAt,
  spaceGoneAt,
  statementAt,
  tagAt,
  terminalAt,
  toScreen,
  typedAt,
  windowAt,
  type GridDot,
  type NameLayout,
  type SplashLayout,
} from "./splash-timeline";

/*
 * Measuring the static markup once (and on resize), then painting any frame
 * from `t`. Everything here is a function of (layout, t): no state between frames.
 */

const MONO_RATIO = MONOGRAM_VIEWBOX.width / MONOGRAM_VIEWBOX.height;

export type Stage = {
  layout: SplashLayout;
  letters: Path2D;
  ink: Rgb;
  faint: Rgb;
  signal: Rgb;
  connectLength: number;
  linkLengths: number[];
};

/* ---------- Measuring ---------- */

const centred = (width: number, height: number, w: number, cy = 0.5): Box => ({
  x: (width - w) / 2,
  y: height * cy - w / MONO_RATIO / 2,
  w,
  h: w / MONO_RATIO,
});

/** Grid of dots over the whole frame, tagged with whether each one falls inside the secret circle. */
const buildGrid = (width: number, height: number, logo: Box, origin: Point, letters: Path2D) => {
  const spacing = Math.min(44, Math.max(12, Math.min(width, height) / 18));
  const probe = document.createElement("canvas").getContext("2d");
  const period = coreOf(logo);
  const diagonal = Math.hypot(width, height);
  const columns = Math.ceil(width / spacing) + 1;
  const rows = Math.ceil(height / spacing) + 1;
  const left = (width - (columns - 1) * spacing) / 2;
  const top = (height - (rows - 1) * spacing) / 2;
  const dots: GridDot[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = left + column * spacing;
      const y = top + row * spacing;
      dots.push({
        x,
        y,
        inside:
          probe?.isPointInPath(
            letters,
            ((x - logo.x) / logo.w) * MONOGRAM_VIEWBOX.width,
            ((y - logo.y) / logo.h) * MONOGRAM_VIEWBOX.height,
          ) ?? false,
        period: Math.hypot(x - period.x, y - period.y) < period.size * 0.8,
        distance: Math.hypot(x - origin.x, y - origin.y) / diagonal,
        seed: rand(row * columns + column, 4),
      });
    }
  }
  return { spacing, dots };
};

const lightOf = (nodes: Nodes, root: HTMLElement, key: string): Point => center(boxIn(html(nodes, key), root));

/** Natural widths of the name's letters and spaces, the row's centre and its baseline. */
const nameLayoutOf = (nodes: Nodes, root: HTMLElement, words: readonly string[], fs: number): NameLayout => {
  const row = boxIn(html(nodes, "name-row"), root);
  const width = (key: string) => (nodes.get(key) instanceof HTMLElement ? html(nodes, key).offsetWidth : 0);
  return {
    letters: words.map((word, w) => Array.from(word).map((_, i) => width(`nm-${w}-${i}`))),
    space: width("nm-space-1"),
    centerX: row.x + row.w / 2,
    baseline: boxIn(html(nodes, "name-end"), root).y,
    fs,
  };
};

const curvePath = ({ from, c1, c2, to }: { from: Point; c1: Point; c2: Point; to: Point }) =>
  `M${from.x} ${from.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;

/** Sets a path's `d` and returns its length. */
const setPath = (nodes: Nodes, key: string, d: string): number => {
  const path = nodes.get(key);
  if (!(path instanceof SVGPathElement)) {
    return 0;
  }
  path.setAttribute("d", d);
  return path.getTotalLength();
};

export const measure = (nodes: Nodes, chipCount: number, statementCount: number, words: readonly string[]): Stage => {
  const root = html(nodes, "camera");
  const width = root.offsetWidth;
  const height = root.offsetHeight;
  const phone = width < 640;
  root.style.fontSize = `${Math.min(20, Math.max(13, 0.014 * width))}px`;

  // Natural letter widths: clear the shrink before measuring anything in the name row.
  nodes.forEach((node, key) => {
    if (/^nm-/.test(key) && node instanceof HTMLElement) {
      node.style.maxWidth = "";
    }
  });
  // The call to action under the name splash is sized like the opening card (both set before the name is measured).
  fitFont(html(nodes, "end"), [html(nodes, "end-row")], Math.min(0.075 * width, 0.11 * height), 0.9 * width);
  html(nodes, "cta-row").style.fontSize = html(nodes, "end").style.fontSize;
  const bigFs = fitFont(
    html(nodes, "stack"),
    [html(nodes, "hello"), html(nodes, "name-row")],
    Math.min(0.2 * width, 0.28 * height),
    0.84 * width,
  );
  const counter = html(nodes, "counter");
  fitFont(counter, [counter], Math.min(0.22 * width, 0.3 * height), 0.8 * width);
  const momentFs = [0, 1, 2].map((index) =>
    fitFont(
      html(nodes, `moment-${index}-slot`),
      [html(nodes, `moment-${index}`)],
      Math.min(0.12 * width, 0.17 * height),
      0.88 * width,
    ),
  );
  const statementsBox = html(nodes, "statements");
  const statementFs = fitFont(
    statementsBox,
    Array.from({ length: statementCount }, (_, index) => html(nodes, `statement-${index}`)),
    Math.min(0.1 * width, 0.11 * height),
    0.78 * width,
  );

  const designWindow = boxIn(html(nodes, "window"), root);
  const windowLight = lightOf(nodes, root, "window-light");
  html(nodes, "window").style.transformOrigin =
    `${windowLight.x - designWindow.x}px ${windowLight.y - designWindow.y}px`;
  const terminal = boxIn(html(nodes, "terminal"), root);
  const terminalLight = lightOf(nodes, root, "terminal-light");
  html(nodes, "terminal").style.transformOrigin = `${terminalLight.x - terminal.x}px ${terminalLight.y - terminal.y}px`;
  const live = boxIn(html(nodes, "live"), root);
  const slotElement = html(nodes, "slot");
  const dragCard = boxIn(html(nodes, "block-6"), root);
  const slot =
    slotElement.offsetWidth > 0 ? boxIn(slotElement, root) : { ...dragCard, y: dragCard.y - dragCard.h * 1.3 };

  const logo = centred(width, height, Math.min(0.62 * width, 0.42 * height * MONO_RATIO));
  const hub = centred(width, height, Math.min(0.2 * width, 0.11 * height * MONO_RATIO));
  const liveLight = lightOf(nodes, root, "live-light");

  const ring = {
    x: phone ? 0.3 * width : Math.min(0.36 * width, 440),
    y: phone ? 0.3 * height : Math.min(0.3 * height, 270),
  };
  const chips = Array.from({ length: chipCount }, (_, index) => {
    const element = html(nodes, `chip-${index}`);
    const angle = -Math.PI / 2 + Math.PI / chipCount + (index / chipCount) * Math.PI * 2;
    const x = width / 2 + Math.cos(angle) * ring.x;
    const y = height / 2 + Math.sin(angle) * ring.y;
    return {
      x: x - element.offsetWidth / 2,
      y: y - element.offsetHeight / 2,
      w: element.offsetWidth,
      h: element.offsetHeight,
    };
  });

  html(nodes, "detail").style.top = `${logo.y + logo.h + Math.max(24, 0.05 * height)}px`;

  // The matrix lights up a circle, not the logo (kept secret until the end): a disc as tall as the box.
  const letters = new Path2D();
  letters.arc(MONOGRAM_VIEWBOX.width / 2, MONOGRAM_VIEWBOX.height / 2, MONOGRAM_VIEWBOX.height / 2, 0, Math.PI * 2);
  const canvas = nodes.get("canvas");
  if (canvas instanceof HTMLCanvasElement) {
    const ratio = Math.min(2, globalThis.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }

  const layout: SplashLayout = {
    width,
    height,
    intro: wordIn(nodes, root, "intro", Number.parseFloat(root.style.fontSize)),
    hello: wordIn(nodes, root, "hello", bigFs),
    name: nameLayoutOf(nodes, root, words, bigFs),
    bar: boxIn(html(nodes, "bar"), root),
    moments: [0, 1, 2].map((index) => wordIn(nodes, root, `moment-${index}`, momentFs[index])),
    window: designWindow,
    windowLight,
    dragCard,
    slot,
    terminal,
    terminalLight,
    live,
    liveLight,
    logo,
    grid: buildGrid(width, height, logo, liveLight, letters),
    hub,
    chips,
    statements: Array.from({ length: statementCount }, (_, index) =>
      wordIn(nodes, root, `statement-${index}`, statementFs),
    ),
    endName: wordIn(nodes, root, "end-name", Number.parseFloat(html(nodes, "end").style.fontSize)),
    pill: boxIn(html(nodes, "pill"), root),
  };

  const tokens = getComputedStyle(html(nodes, "root"));
  return {
    layout,
    letters,
    ink: rgbOf(tokens.getPropertyValue("--text-primary")),
    faint: rgbOf(tokens.getPropertyValue("--text-secondary")),
    signal: rgbOf(tokens.getPropertyValue("--signal")),
    connectLength: setPath(nodes, "connect", curvePath(connectionOf(layout))),
    linkLengths: chips.map((chip, index) => setPath(nodes, `link-${index}`, curvePath(linkCurve(layout, chip)))),
  };
};

/** Null while the markup is not (or no longer) mounted, e.g. a resize callback after unmount. */
export const measureIfMounted = (
  nodes: Nodes,
  chipCount: number,
  statementCount: number,
  words: readonly string[],
): Stage | null => (nodes.get("camera")?.isConnected ? measure(nodes, chipCount, statementCount, words) : null);

/* ---------- Canvas: dot matrix, stack pulses, orbit ---------- */

const drawCanvas = (canvas: HTMLCanvasElement, stage: Stage, t: number) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  const { layout } = stage;
  const ratio = canvas.width / layout.width;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, layout.width, layout.height);
  const dot = (x: number, y: number, r: number, color: string) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  };

  const { dots, clipToLetters } = matrixAt(t, layout);
  if (dots.length > 0) {
    context.save();
    if (clipToLetters) {
      // Swelling dots merge into the circle exactly, so the solid disc can take over unnoticed.
      const { logo } = layout;
      context.setTransform(
        (ratio * logo.w) / MONOGRAM_VIEWBOX.width,
        0,
        0,
        (ratio * logo.h) / MONOGRAM_VIEWBOX.height,
        ratio * logo.x,
        ratio * logo.y,
      );
      context.clip(stage.letters);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    for (const point of dots) {
      dot(point.x, point.y, point.r, point.tone === "ink" ? rgba(stage.ink, 1) : rgba(stage.faint, 0.3));
    }
    context.restore();
  }

  layout.chips.forEach((chip, index) => {
    const curve = linkCurve(layout, chip);
    for (const along of pulsesAt(t, index)) {
      const point = bezier(curve.from, curve.c1, curve.c2, curve.to, along);
      dot(point.x, point.y, 3.2, rgba(stage.signal, Math.sin(Math.PI * along)));
    }
  });
};

/* ---------- Painting ---------- */

const setScale = (nodes: Nodes, key: string, scale: number, extra = "") => {
  const style = styleOf(nodes, key);
  if (style) {
    style.visibility = scale > 0.002 ? "visible" : "hidden";
    style.transform = `${extra}scale(${scale.toFixed(4)})`;
  }
};

const setDrawn = (nodes: Nodes, key: string, length: number, drawn: number) => {
  const style = styleOf(nodes, key);
  if (style) {
    style.visibility = drawn * length > 0.5 ? "visible" : "hidden";
    style.strokeDasharray = `${drawn * length} ${length}`;
  }
};

export type ExitState = { start: number; from: Box; target: Box };

/** The name splash: the full name shrinks letter by letter into "MM.", which stays until the exit flight takes over. */
const paintHook = (nodes: Nodes, stage: Stage, t: number, exiting: boolean) => {
  const { name } = stage.layout;
  setRise(nodes, "intro", riseAt(t, T.introIn, T.introOut));
  setRise(nodes, "bracket", riseAt(t, T.bracketIn, T.bracketOut));
  nodes.forEach((node, key) => {
    const hello = /^hello-(\d+)$/.exec(key);
    if (hello) {
      node.style.transform = `translate3d(0, ${letterAt(t, Number(hello[1]), T.helloIn, T.helloOut).toFixed(2)}%, 0)`;
    }
  });

  // The full name rolls in, then loses one letter from the end of each word per half-beat.
  const morph = morphAt(t);
  let flat = 0;
  name.letters.forEach((word, w) => {
    word.forEach((natural, i) => {
      const gone = letterGoneAt(t, name, w, i);
      const box = styleOf(nodes, `nm-${w}-${i}`);
      if (box) {
        box.maxWidth = px(natural * (1 - gone));
      }
      const letter = styleOf(nodes, `nml-${w}-${i}`);
      if (letter) {
        // A leaving letter fades and blurs out as its box closes, rather than sliding out of the mask.
        letter.transform = `translate3d(0, ${(letterAt(t, flat, T.nameIn) - gone * 20).toFixed(2)}%, 0)`;
        letter.opacity = ((1 - morph) * (1 - Math.min(1, gone * 1.8))).toFixed(3);
        letter.filter = gone > 0.01 ? `blur(${(gone * 8).toFixed(1)}px)` : "none";
      }
      flat += 1;
    });
    const space = styleOf(nodes, `nm-space-${w + 1}`);
    if (space) {
      space.maxWidth = px(name.space * (1 - spaceGoneAt(t, name)));
    }
  });

  // "MM" becomes the monogram; the dot lands as its period. It stays; on the way out the exit mark takes its place.
  const logo = styleOf(nodes, "hook-logo");
  if (logo) {
    const box = hookLogoOf(name);
    logo.visibility = morph > 0.001 && !exiting ? "visible" : "hidden";
    logo.opacity = morph.toFixed(3);
    logo.width = px(box.w);
    logo.height = px(box.h);
    logo.transformOrigin = "50% 100%";
    logo.transform = `translate(${box.x}px, ${box.y}px) scale(${(1.08 - 0.08 * morph).toFixed(4)})`;
  }
};

const paintLoading = (nodes: Nodes, t: number) => {
  const load = loadAt(t);
  setRise(nodes, "load-caption", riseAt(t, T.loadIn, T.loadOut));
  setRise(nodes, "counter", riseAt(t, T.loadIn + 0.05, T.loadOut));
  const counter = nodes.get("counter");
  if (counter) {
    counter.textContent = `${Math.round(load * 100)}%`;
  }
  const bar = styleOf(nodes, "bar");
  if (bar) {
    bar.opacity = (clamp01(progress(t, T.loadIn, 0.2)) * (1 - clamp01(progress(t, T.loadOut, 0.2)))).toFixed(3);
  }
  const fill = styleOf(nodes, "bar-fill");
  if (fill) {
    fill.transform = `scaleX(${load.toFixed(4)})`;
  }
};

const paintFloods = (nodes: Nodes, stage: Stage, t: number, camera: ReturnType<typeof cameraAt>) => {
  const { layout } = stage;
  T.floods.forEach((start, index) => {
    const style = styleOf(nodes, `flood-${index}`);
    if (!style) {
      return;
    }
    const origin = toScreen(dotAt(start, layout), camera, layout);
    const reach =
      Math.max(
        Math.hypot(origin.x, origin.y),
        Math.hypot(layout.width - origin.x, origin.y),
        Math.hypot(origin.x, layout.height - origin.y),
        Math.hypot(layout.width - origin.x, layout.height - origin.y),
      ) * 1.15;
    const radius = reach * expoInOut(progress(t, start, FLOOD_SECONDS));
    style.visibility = radius < 0.5 ? "hidden" : "visible";
    style.width = px(radius * 2);
    style.height = px(radius * 2);
    style.transform = `translate(${origin.x - radius}px, ${origin.y - radius}px)`;
  });
  [0, 1, 2].forEach((index) => setRise(nodes, `moment-${index}`, riseAt(t, T.momentsIn[index], T.momentsOut[index])));
};

const paintDesign = (nodes: Nodes, stage: Stage, t: number) => {
  const { layout } = stage;
  setRise(nodes, "design-caption", riseAt(t, T.designCaption, T.designOut));
  const window = windowAt(t);
  const style = styleOf(nodes, "window");
  if (style) {
    const scale = window.scale * (1 - window.out);
    style.visibility = scale > 0.002 ? "visible" : "hidden";
    style.transform = `scale(${scale.toFixed(4)})`;
  }
  for (let index = 0; index < DESIGN_BLOCKS; index += 1) {
    if (index === 6) {
      continue;
    }
    setScale(nodes, `block-${index}`, blockAt(t, index));
  }
  const drag = dragAt(t, layout);
  const card = styleOf(nodes, "block-6");
  if (card) {
    card.transform = `translate(${drag.x}px, ${drag.y}px) scale(${(blockAt(t, 6) * (1 + 0.06 * drag.lift)).toFixed(4)})`;
    card.boxShadow =
      drag.lift > 0.01 ? `0 ${24 * drag.lift}px ${48 * drag.lift}px -16px rgb(0 0 0 / ${0.35 * drag.lift})` : "none";
    card.zIndex = "1";
  }
  setScale(nodes, "slot", growAt(t, T.cursorDesign, T.drop + 0.1, 0.35));
};

const paintCode = (nodes: Nodes, stage: Stage, t: number, lines: readonly string[]) => {
  setRise(nodes, "code-caption", riseAt(t, T.codeCaption, T.codeOut));
  const terminal = terminalAt(t);
  setScale(nodes, "terminal", terminal.scale * (1 - terminal.out));
  const live = growAt(t, T.liveIn, T.codeOut, 0.45);
  setScale(nodes, "live", live);
  lines.forEach((line, index) => {
    const typed = typedAt(t, index, line.length);
    const text = styleOf(nodes, `code-${index}`);
    if (text) {
      text.width = `${Math.round(typed * line.length)}ch`;
    }
    const next = T.lines[index + 1] ?? T.codeOut;
    const active = t >= T.lines[index] && t < next && terminal.out < 0.5;
    const blink = typed < 1 || Math.floor(t * 4) % 2 === 0;
    setShown(nodes, `caret-${index}`, active && blink);
  });
  setDrawn(nodes, "connect", stage.connectLength, connectAt(t) * (1 - terminal.out));
  setRise(nodes, "live-status", riseAt(t, T.deployed, T.codeOut));
};

const paintMatrix = (nodes: Nodes, stage: Stage, t: number) => {
  const logo = logoAt(t, stage.layout);
  setShown(nodes, "logo", logo.shown);
  setBox(nodes, "logo", logo.box);
  setRise(nodes, "detail-text", riseAt(t, T.detailIn, T.detailOut));
};

const paintStack = (nodes: Nodes, stage: Stage, t: number) => {
  const { layout } = stage;
  const ring = growAt(t, T.hubIn + 0.1, T.stackOut, 0.55);
  const size = layout.hub.h * 1.7;
  const hub = center(layout.hub);
  setBox(
    nodes,
    "hub-ring",
    { x: hub.x - size / 2, y: hub.y - size / 2, w: size, h: size },
    ` scale(${ring.toFixed(4)})`,
  );
  setShown(nodes, "hub-ring", ring > 0.002);
  layout.chips.forEach((chip, index) => {
    setScale(nodes, `chip-${index}`, chipAt(t, index), `translate(${chip.x}px, ${chip.y}px) `);
    setDrawn(nodes, `link-${index}`, stage.linkLengths[index] ?? 0, linkAt(t, index));
  });
  setRise(nodes, "stack-title", riseAt(t, T.stackTitle, T.stackOut));
  setScale(nodes, "stack-pill", growAt(t, T.stackPill, T.stackOut, 0.45));
};

const paintStatements = (nodes: Nodes, stage: Stage, t: number, statementCount: number, tagCount: number) => {
  const rule = styleOf(nodes, "rule");
  if (rule) {
    rule.transform = `scaleY(${(spring(progress(t, T.ruleIn, 0.5)) * (1 - expoInOut(progress(t, T.statementsOut, 0.3)))).toFixed(4)})`;
  }
  for (let index = 0; index < statementCount; index += 1) {
    setRise(nodes, `statement-${index}`, riseAt(t, statementAt(index), T.statementsOut + index * 0.04));
  }
  for (let index = 0; index < tagCount; index += 1) {
    const tag = tagAt(t, index, stage.layout);
    const style = styleOf(nodes, `tag-${index}`);
    if (style) {
      style.opacity = tag.reveal.opacity.toFixed(3);
      style.filter = tag.reveal.blur > 0.3 ? `blur(${tag.reveal.blur.toFixed(1)}px)` : "none";
      style.transform = `translate(${tag.x}px, ${tag.y}px) translateY(${tag.reveal.y.toFixed(3)}em) rotate(${((rand(index, 14) - 0.5) * 10).toFixed(2)}deg)`;
    }
  }
};

/**
 * The opening card (the full name and the tagline, no logo), which leaves before the loading
 * scene; and the call to action that shows under "MM." at the end.
 */
const paintEnd = (nodes: Nodes, t: number) => {
  setRise(nodes, "end-name", riseAt(t, T.nameRowIn, T.openOut));
  setReveal(nodes, "tagline", revealAt(t, T.taglineIn, T.openOut));
  setReveal(nodes, "label", revealAt(t, T.labelIn));
  const pill = pillAt(t);
  const pillStyle = styleOf(nodes, "pill");
  if (pillStyle) {
    pillStyle.visibility = t >= T.ctaIn ? "visible" : "hidden";
    pillStyle.transform = `scale(${pill.scale.toFixed(4)})`;
    pillStyle.backgroundColor = `color-mix(in srgb, var(--signal) ${percent(pill.lit)}, var(--text-primary))`;
  }
};

const paintCursor = (nodes: Nodes, stage: Stage, t: number) => {
  const style = styleOf(nodes, "cursor");
  if (!style) {
    return;
  }
  const design = cursorDesignAt(t, stage.layout);
  const end = cursorEndAt(t, stage.layout);
  const cursor =
    t >= T.cursorEnd
      ? { x: end.x, y: end.y, shown: end.shown, scale: end.scale }
      : { x: design.x, y: design.y, shown: design.shown, scale: 1 - 0.15 * design.press };
  style.visibility = cursor.shown > 0.01 ? "visible" : "hidden";
  style.opacity = cursor.shown.toFixed(3);
  style.transform = `translate(${cursor.x}px, ${cursor.y}px) scale(${cursor.scale.toFixed(3)})`;
};

const paintDot = (nodes: Nodes, stage: Stage, t: number, exiting: boolean) => {
  const dot = dotAt(t, stage.layout);
  const style = styleOf(nodes, "dot");
  if (style) {
    style.visibility = exiting ? "hidden" : "visible";
    style.width = px(dot.size);
    style.height = px(dot.size);
    style.transform = `translate(${dot.x - dot.size / 2}px, ${dot.y - dot.size / 2}px)`;
    style.backgroundColor = `color-mix(in srgb, var(--text-primary) ${percent(dot.ink)}, var(--signal))`;
  }
};

/** The exit: the splash fades while the end-card mark flies to the navbar logo of the page beneath. */
const paintExit = (nodes: Nodes, t: number, exit: ExitState | null) => {
  const stage = styleOf(nodes, "stage");
  const mark = styleOf(nodes, "exit-mark");
  if (!stage || !mark) {
    return;
  }
  if (!exit || t < exit.start) {
    stage.opacity = "1";
    stage.filter = "none";
    stage.transform = "none";
    mark.visibility = "hidden";
    const skip = styleOf(nodes, "skip");
    if (skip) {
      skip.opacity = "1";
    }
    return;
  }
  const fade = exitFadeAt(t, exit.start);
  stage.opacity = (1 - fade).toFixed(3);
  const skip = styleOf(nodes, "skip");
  if (skip) {
    skip.opacity = (1 - fade).toFixed(3);
  }
  stage.filter = fade > 0.01 ? `blur(${(fade * 8).toFixed(1)}px)` : "none";
  stage.transform = `scale(${(1 - 0.03 * fade).toFixed(4)})`;
  const box = mixBox(exit.from, exit.target, exitFlightAt(t, exit.start));
  mark.visibility = "visible";
  mark.width = px(box.w);
  mark.height = px(box.h);
  mark.transform = `translate(${box.x}px, ${box.y}px)`;
};

export const paint = (
  nodes: Nodes,
  stage: Stage,
  t: number,
  content: { lines: readonly string[]; statements: number; tags: number },
  exit: ExitState | null,
) => {
  const { layout } = stage;
  const exiting = exit !== null && t >= exit.start + 0.05;
  const camera = cameraAt(t, layout);
  const cameraStyle = styleOf(nodes, "camera");
  if (cameraStyle) {
    // Screen = centre + (point - focus) × scale, with the origin at the top-left corner.
    cameraStyle.transformOrigin = "0 0";
    cameraStyle.transform = `translate(${layout.width / 2 - camera.focus.x * camera.scale}px, ${layout.height / 2 - camera.focus.y * camera.scale}px) scale(${camera.scale.toFixed(4)})`;
  }
  paintFloods(nodes, stage, t, camera);
  paintHook(nodes, stage, t, exiting);
  paintLoading(nodes, t);
  paintDesign(nodes, stage, t);
  paintCode(nodes, stage, t, content.lines);
  paintMatrix(nodes, stage, t);
  paintStack(nodes, stage, t);
  paintStatements(nodes, stage, t, content.statements, content.tags);
  paintEnd(nodes, t);
  paintCursor(nodes, stage, t);
  paintDot(nodes, stage, t, exiting);
  const canvas = nodes.get("canvas");
  if (canvas instanceof HTMLCanvasElement) {
    drawCanvas(canvas, stage, t);
  }
  paintExit(nodes, t, exit);
};

/** Where "MM." (the name splash's monogram) is on screen now: the exit flight starts there. */
export const markOnScreen = (stage: Stage, t: number): Box => {
  const { layout } = stage;
  const camera = cameraAt(t, layout);
  const box = hookLogoOf(layout.name);
  const middle = toScreen(center(box), camera, layout);
  return {
    x: middle.x - (box.w * camera.scale) / 2,
    y: middle.y - (box.h * camera.scale) / 2,
    w: box.w * camera.scale,
    h: box.h * camera.scale,
  };
};

/** The page's navbar logo (any element marked `data-brand-mark` outside the splash), or a top-left default. */
export const navbarTarget = (splash: Element | undefined, width: number): Box => {
  const candidates = [...document.querySelectorAll("[data-brand-mark]")].filter(
    (element) => !splash?.contains(element),
  );
  const rect = candidates
    .map((element) => element.getBoundingClientRect())
    .find((box) => box.width > 0 && box.height > 0);
  if (rect) {
    return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
  }
  const h = width < 640 ? 32 : 40;
  return { x: width < 640 ? 24 : 40, y: width < 640 ? 24 : 32, w: h * MONO_RATIO, h };
};
