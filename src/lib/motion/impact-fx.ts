/*
 * Impact effects for the portfolio's buttons: a full-screen, click-through
 * canvas that draws short-lived marks (a burst star, flying chips, speed
 * lines, focus lines, shockwave rings, glints) in the site's own colours.
 * The beats follow an anime "impact frame"; the drawing is our own.
 *
 * The canvas is created on first use and its loop runs only while marks are
 * alive. With prefers-reduced-motion nothing is drawn at all.
 */

type Mark = { born: number; life: number; draw: (g: CanvasRenderingContext2D, k: number, t: number) => void };
type Palette = { ink: string; paper: string; signal: string };
type Point = { x: number; y: number };
type Box = { left: number; top: number; width: number; height: number };

const TAU = Math.PI * 2;
const MAX_DPR = 2;
/** Extra room around the button's cutout, as a share of its size on each side. */
const HOLE_PAD = 0.12;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (k: number) => 1 - (1 - k) ** 3;
const easeIn = (k: number) => k ** 3;
const random = (min: number, max: number) => min + Math.random() * (max - min);

let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;
let marks: Mark[] = [];
let running = false;
let palette: Palette = { ink: "#0a0a0a", paper: "#f4f3ee", signal: "#e8480f" };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const readPalette = (): Palette => {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    ink: token("--text-primary", palette.ink),
    paper: token("--bg-primary", palette.paper),
    signal: token("--signal", palette.signal),
  };
};

const resize = () => {
  if (!canvas || !context) {
    return;
  }
  const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
};

const ensureCanvas = (): CanvasRenderingContext2D | null => {
  if (context) {
    return context;
  }
  canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60";
  document.body.append(canvas);
  context = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
  return context;
};

const frame = (now: number) => {
  const g = context;
  if (!g) {
    running = false;
    return;
  }
  g.clearRect(0, 0, window.innerWidth, window.innerHeight);
  marks = marks.filter((mark) => now - mark.born < mark.life * 1000);
  for (const mark of marks) {
    const t = (now - mark.born) / 1000;
    g.save();
    mark.draw(g, clamp(t / mark.life), t);
    g.restore();
  }
  if (marks.length > 0) {
    requestAnimationFrame(frame);
  } else {
    running = false;
  }
};

/** The box marks drawn "behind" the button leave clear, so the button stays on top of them. */
let hole: Box | null = null;

const clipOutHole = (g: CanvasRenderingContext2D, box: Box) => {
  g.beginPath();
  g.rect(0, 0, window.innerWidth, window.innerHeight);
  g.roundRect(box.left, box.top, box.width, box.height, box.height / 2);
  g.clip("evenodd");
};

/** Queue a mark; `delay` in seconds. Marks queued while `hole` is set are drawn behind the button. */
const add = (life: number, draw: Mark["draw"], delay = 0): boolean => {
  if (prefersReducedMotion() || !ensureCanvas()) {
    return false;
  }
  const behind = hole;
  marks.push({
    born: performance.now() + delay * 1000,
    life,
    draw: (g, k, t) => {
      if (t < 0) {
        return;
      }
      if (behind) {
        clipOutHole(g, behind);
      }
      draw(g, k, t);
    },
  });
  if (!running) {
    running = true;
    requestAnimationFrame(frame);
  }
  return true;
};

/** A jagged star that snaps open behind the point and hollows out from the middle as it leaves. */
const burst = ({ x, y }: Point, radius: number, spikes = 16, life = 0.46) => {
  const jitter = Array.from({ length: spikes * 2 }, (_, i) => (i % 2 ? random(0.36, 0.5) : random(0.8, 1.15)));
  const turn = random(0, TAU);
  const star = (r: number, offset: number) => {
    const path = new Path2D();
    jitter.forEach((m, i) => {
      const a = turn + offset + (i / jitter.length) * TAU;
      path[i ? "lineTo" : "moveTo"](x + Math.cos(a) * r * m, y + Math.sin(a) * r * m);
    });
    path.closePath();
    return path;
  };
  add(life, (g, k) => {
    const r = radius * easeOut(clamp(k / 0.28));
    const hole = radius * 1.3 * easeIn(clamp((k - 0.3) / 0.7));
    g.beginPath();
    g.rect(0, 0, window.innerWidth, window.innerHeight);
    g.arc(x, y, hole, 0, TAU, true);
    g.clip("evenodd");
    g.fillStyle = palette.signal;
    g.fill(star(r * 1.15, 0.2));
    g.fillStyle = palette.ink;
    g.fill(star(r * 0.82, 0));
  });
};

/** Chips that fly out, tumble and fall: ink, signal, and paper ones with an ink edge. */
const chips = ({ x, y }: Point, count: number, speed: number, size: number, life = 1) => {
  for (let i = 0; i < count; i++) {
    const angle = random(0, TAU);
    const velocity = speed * random(0.45, 1.15);
    const scale = size * random(0.6, 1.4);
    const spin = random(-8, 8);
    const tone = i % 3;
    const shape = [
      [-1.4, 0.1],
      [-0.5, -0.7],
      [1.2, -0.4],
      [1.4, 0.2],
      [0.3, 0.75],
    ].map(([px = 0, py = 0]) => [px * random(0.8, 1.2), py * random(0.8, 1.2)] as const);
    add(life * random(0.7, 1), (g, k, t) => {
      const s = scale * (1 - easeIn(clamp((k - 0.6) / 0.4)));
      g.translate(x + Math.cos(angle) * velocity * t, y + Math.sin(angle) * velocity * t + 520 * t * t);
      g.rotate(spin * t + angle);
      const path = new Path2D();
      shape.forEach(([px, py], q) => path[q ? "lineTo" : "moveTo"](px * s, py * s));
      path.closePath();
      g.fillStyle = tone === 0 ? palette.signal : tone === 1 ? palette.ink : palette.paper;
      g.fill(path);
      if (tone === 2) {
        g.strokeStyle = palette.ink;
        g.lineWidth = 1.2;
        g.stroke(path);
      }
    });
  }
};

/** Short strokes that shoot outward from around the point and thin away. */
const speedLines = ({ x, y }: Point, count: number, inner: number, length: number, life = 0.42, delay = 0) => {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * TAU + random(-0.12, 0.12);
    const reach = length * random(0.6, 1.3);
    const width = random(1.2, 3);
    const lag = random(0, 0.2);
    add(
      life,
      (g, k) => {
        const kk = clamp((k - lag) / (1 - lag));
        const head = inner + reach * easeOut(kk);
        const tail = inner + reach * easeIn(kk);
        g.strokeStyle = i % 4 === 0 ? palette.signal : palette.ink;
        g.lineWidth = width * (1 - kk);
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(x + Math.cos(angle) * tail, y + Math.sin(angle) * tail);
        g.lineTo(x + Math.cos(angle) * head, y + Math.sin(angle) * head);
        g.stroke();
      },
      delay,
    );
  }
};

/** Manga focus lines: thin wedges from the screen edges pointing at the point, for a beat. */
const focusLines = ({ x, y }: Point, count = 72, life = 0.6) => {
  const far = Math.hypot(window.innerWidth, window.innerHeight);
  const wedges = Array.from({ length: count }, () => ({
    angle: random(0, TAU),
    reach: random(0.55, 0.85),
    width: random(0.004, 0.012),
  }));
  add(life, (g, k) => {
    const grow = easeOut(clamp(k / 0.25));
    const fade = 1 - easeIn(clamp((k - 0.35) / 0.65));
    g.globalAlpha = 0.85 * fade;
    g.fillStyle = palette.ink;
    g.beginPath();
    for (const wedge of wedges) {
      const tip = far * (1 - wedge.reach * grow);
      g.moveTo(x + Math.cos(wedge.angle - wedge.width) * far, y + Math.sin(wedge.angle - wedge.width) * far);
      g.lineTo(x + Math.cos(wedge.angle) * tip, y + Math.sin(wedge.angle) * tip);
      g.lineTo(x + Math.cos(wedge.angle + wedge.width) * far, y + Math.sin(wedge.angle + wedge.width) * far);
    }
    g.fill();
  });
};

/** A ring that races out from the point; `to` is its final radius. */
const shockwave = ({ x, y }: Point, to: number, width: number, color: string, life = 0.8, delay = 0) => {
  add(
    life,
    (g, k) => {
      const w = width * (1 - easeOut(k));
      if (w < 0.3) {
        return;
      }
      g.strokeStyle = color;
      g.lineWidth = w;
      g.beginPath();
      g.arc(x, y, 8 + to * easeOut(k), 0, TAU);
      g.stroke();
    },
    delay,
  );
};

/** A four-pointed glint that opens and closes. */
const glint = ({ x, y }: Point, radius: number, life = 0.7, delay = 0) => {
  add(
    life,
    (g, k, t) => {
      const s = radius * Math.sin(k * Math.PI) ** 0.6;
      const q = s * 0.16;
      g.translate(x, y);
      g.rotate(Math.sin(t * 3) * 0.25);
      const path = new Path2D();
      path.moveTo(0, -s);
      path.quadraticCurveTo(q, -q, s * 0.7, 0);
      path.quadraticCurveTo(q, q, 0, s);
      path.quadraticCurveTo(-q, q, -s * 0.7, 0);
      path.quadraticCurveTo(-q, -q, 0, -s);
      g.fillStyle = palette.paper;
      g.fill(path);
      g.strokeStyle = palette.signal;
      g.lineWidth = 2;
      g.stroke(path);
    },
    delay,
  );
};

const centreOf = (element: Element): Point & { width: number; height: number } => {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2, width: box.width, height: box.height };
};

/** Run `queue` with the element's box as the hole, so its marks sit behind the element. */
const behindElement = (element: Element, queue: () => void) => {
  // Padded so the button's spring overshoot (up to ~1.22x) stays clear of the marks.
  const box = element.getBoundingClientRect();
  const padX = box.width * HOLE_PAD + 6;
  const padY = box.height * HOLE_PAD + 6;
  hole = { left: box.left - padX, top: box.top - padY, width: box.width + padX * 2, height: box.height + padY * 2 };
  try {
    queue();
  } finally {
    hole = null;
  }
};

/** The press: a burst behind the button, chips and speed lines. */
export const playImpact = (element: Element) => {
  if (prefersReducedMotion()) {
    return;
  }
  palette = readPalette();
  const c = centreOf(element);
  behindElement(element, () => {
    burst(c, Math.max(70, c.width * 0.55));
    speedLines(c, 14, c.width * 0.45, 70);
  });
  chips(c, 12, 280, 8);
};

/** Success: focus lines on the whole screen, two shockwaves, a wide spray of chips and glints. */
export const playCelebration = (element: Element) => {
  if (prefersReducedMotion()) {
    return;
  }
  palette = readPalette();
  const c = centreOf(element);
  const far = Math.hypot(window.innerWidth, window.innerHeight);
  behindElement(element, () => {
    focusLines(c);
    burst(c, Math.max(110, c.width * 0.8), 20, 0.6);
    shockwave(c, far, 26, palette.signal, 1.05);
    shockwave(c, far * 0.8, 12, palette.ink, 0.95, 0.12);
    speedLines(c, 28, c.width * 0.6, 220, 0.6, 0.05);
  });
  chips(c, 46, 620, 11, 1.5);
  glint({ x: c.x + c.width / 2 - 18, y: c.y - 6 }, 18, 0.9, 0.1);
  glint({ x: c.x - c.width * 0.7, y: c.y - c.height * 1.4 }, 12, 0.7, 0.25);
  glint({ x: c.x + c.width * 0.8, y: c.y - c.height * 1.1 }, 10, 0.7, 0.35);
};
