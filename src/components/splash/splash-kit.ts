/*
 * Shared pieces of the name splash: geometry types, the element registry,
 * measuring helpers (layout only, transforms ignored) and small style
 * writers used by every scene's paint function.
 */

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };
/** A word as laid out, in stage pixels. `end`: baseline point after its last letter. */
export type WordLayout = { box: Box; end: Point; fs: number };

export type Node = HTMLElement | SVGElement;
export type Nodes = Map<string, Node>;
export type Bind = (key: string) => (node: Node | null) => void;

/** Element registry filled by ref callbacks; paint functions look elements up by key. */
export const createRegistry = (): { nodes: Nodes; bind: Bind } => {
  const nodes: Nodes = new Map();
  const bind: Bind = (key) => (node) => {
    if (node) {
      nodes.set(key, node);
    } else {
      nodes.delete(key);
    }
  };
  return { nodes, bind };
};

export const html = (nodes: Nodes, key: string): HTMLElement => {
  const node = nodes.get(key);
  if (!(node instanceof HTMLElement)) {
    throw new Error(`splash: missing element ${key}`);
  }
  return node;
};

/** Box of `element` relative to `root`, from offsets, so the camera's transform never skews it. */
export const boxIn = (element: HTMLElement, root: HTMLElement): Box => {
  let x = 0;
  let y = 0;
  let node: Element | null = element;
  while (node instanceof HTMLElement && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return { x, y, w: element.offsetWidth, h: element.offsetHeight };
};

/** Sets the font size, shrinking it when the widest of `measured` would be wider than `maxWidth`. */
export const fitFont = (sized: HTMLElement, measured: HTMLElement[], fs: number, maxWidth: number): number => {
  sized.style.fontSize = `${fs}px`;
  const widest = Math.max(...measured.map((element) => element.offsetWidth));
  const fitted = widest > maxWidth ? (fs * maxWidth) / widest : fs;
  sized.style.fontSize = `${fitted}px`;
  return fitted;
};

export const wordIn = (nodes: Nodes, root: HTMLElement, key: string, fs: number): WordLayout => {
  const end = boxIn(html(nodes, `${key}-end`), root);
  return { box: boxIn(html(nodes, key), root), end: { x: end.x, y: end.y }, fs };
};

export const center = (box: Box): Point => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 });

/* ---------- Style writers ---------- */

export const px = (value: number) => `${value}px`;

/** A 0..1 share as a CSS percentage; springs overshoot, and color-mix() rejects anything past 100%. */
export const percent = (share: number) => `${Math.round(Math.min(1, Math.max(0, share)) * 100)}%`;

export const styleOf = (nodes: Nodes, key: string): CSSStyleDeclaration | undefined => nodes.get(key)?.style;

/** Moves an element through its mask: `offset` in % of its own height. */
export const setRise = (nodes: Nodes, key: string, offset: number) => {
  const style = styleOf(nodes, key);
  if (style) {
    style.transform = `translate3d(0, ${offset.toFixed(2)}%, 0)`;
  }
};

export type Reveal = { opacity: number; blur: number; y: number };

/** Blur-in reveal: opacity, blur (px) and a small rise (`y` in em). */
export const setReveal = (nodes: Nodes, key: string, reveal: Reveal, extra = "") => {
  const style = styleOf(nodes, key);
  if (!style) {
    return;
  }
  style.opacity = reveal.opacity.toFixed(3);
  style.filter = reveal.blur > 0.3 ? `blur(${reveal.blur.toFixed(1)}px)` : "none";
  style.transform = `translateY(${reveal.y.toFixed(3)}em)${extra}`;
};

/** Places an absolutely positioned element (top-left at 0,0) on a box. */
export const setBox = (nodes: Nodes, key: string, box: Box, extra = "") => {
  const style = styleOf(nodes, key);
  if (style) {
    style.width = px(box.w);
    style.height = px(box.h);
    style.transform = `translate(${box.x}px, ${box.y}px)${extra}`;
  }
};

export const setShown = (nodes: Nodes, key: string, shown: boolean) => {
  const style = styleOf(nodes, key);
  if (style) {
    style.visibility = shown ? "visible" : "hidden";
  }
};

export type Rgb = readonly [number, number, number];

export const rgbOf = (color: string): Rgb => {
  const hex = color.trim().replace("#", "");
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const value = Number.parseInt(full, 16);
  return Number.isNaN(value) ? [0, 0, 0] : [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

export const rgba = ([r, g, b]: Rgb, alpha: number) => `rgb(${r} ${g} ${b} / ${alpha.toFixed(3)})`;
