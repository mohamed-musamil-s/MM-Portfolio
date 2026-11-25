"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/shared/cn";
import type { SplashContent } from "@/lib/shared/content/splash-schema";
import { MONOGRAM_LETTERS, MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";
import { createRegistry } from "./splash-kit";
import { markOnScreen, measureIfMounted, navbarTarget, paint, type ExitState, type Stage } from "./splash-paint";
import { FLOOD_COLORS, HIDDEN, Scenes } from "./splash-scenes";
import { EXIT_AT, EXIT_SECONDS } from "./splash-timeline";

/*
 * The name splash on `/` (docs/screens/SPLASH_BUSINESS.md): about 31 seconds
 * at 120 BPM. The markup is static (splash-scenes.tsx); `paint(t)`
 * (splash-paint.ts) writes every moving style from the timeline functions
 * (splash-timeline.ts). A requestAnimationFrame loop only supplies `t`.
 *
 * It ends with the logo flying to the navbar logo of the page beneath while
 * the splash fades. Skip, Esc and the clicked call to action start that exit
 * straight away.
 */

type NameSplashProps = {
  content: SplashContent;
  /** Called once the exit has finished. */
  onFinished?: () => void;
};

export const NameSplash = ({ content, onFinished }: NameSplashProps) => {
  const [{ nodes, bind }] = useState(createRegistry);
  const stage = useRef<Stage | null>(null);
  const start = useRef(0);
  const exitStart = useRef<number>(EXIT_AT);
  const exit = useRef<ExitState | null>(null);
  const paused = useRef(false);
  const lastT = useRef(0);
  const finished = useRef(onFinished);
  const chipCount = content.stack.skills.length;
  const statementCount = content.statements.length;
  const words = useRef([content.name.first, content.name.last]);
  const counts = useRef({ lines: content.code.lines, statements: statementCount, tags: content.tags.length });

  useEffect(() => {
    finished.current = onFinished;
    counts.current = { lines: content.code.lines, statements: statementCount, tags: content.tags.length };
    words.current = [content.name.first, content.name.last];
  }, [onFinished, content, statementCount]);

  // Re-measure if the words change.
  useLayoutEffect(() => {
    if (stage.current) {
      stage.current = measureIfMounted(nodes, chipCount, statementCount, words.current);
    }
  }, [content, nodes, chipCount, statementCount]);

  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    const root = nodes.get("root");

    /** Freezes where the exit flight starts and ends, the first time a frame reaches it. */
    const exitFor = (t: number): ExitState | null => {
      if (t < exitStart.current || !stage.current) {
        return null;
      }
      if (exit.current?.start !== exitStart.current) {
        exit.current = {
          start: exitStart.current,
          from: markOnScreen(stage.current, exitStart.current),
          target: navbarTarget(root, stage.current.layout.width),
        };
      }
      return exit.current;
    };

    const resize = new ResizeObserver(() => {
      if (stage.current) {
        stage.current = measureIfMounted(nodes, chipCount, statementCount, words.current);
      }
    });
    const tick = (now: number) => {
      const t = (now - start.current) / 1000;
      if (!paused.current && stage.current) {
        lastT.current = t;
        paint(nodes, stage.current, t, counts.current, exitFor(t));
        if (t >= exitStart.current + EXIT_SECONDS) {
          finished.current?.();
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    // Development only: window.__splash.seek(t) freezes on a frame, play() resumes.
    const target = window as Window & { __splash?: { seek: (t: number) => void; play: () => void } };
    if (process.env.NODE_ENV !== "production") {
      target.__splash = {
        seek: (t) => {
          paused.current = true;
          if (stage.current) {
            paint(nodes, stage.current, t, counts.current, exitFor(t));
          }
        },
        play: () => {
          paused.current = false;
          start.current = performance.now();
        },
      };
    }

    // Measure with the real typefaces; don't wait forever for them.
    const fonts = Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
    void fonts.then(() => {
      if (cancelled) {
        return;
      }
      stage.current = measureIfMounted(nodes, chipCount, statementCount, words.current);
      if (root instanceof HTMLElement) {
        resize.observe(root);
      }
      start.current = performance.now();
      frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      delete target.__splash;
    };
  }, [nodes, chipCount, statementCount]);

  /** Skip, the clicked call to action and Esc all start the exit now (or keep the one already under way). */
  const enter = () => {
    exitStart.current = Math.min(lastT.current, exitStart.current);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        exitStart.current = Math.min(lastT.current, exitStart.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section
      ref={bind("root")}
      aria-label={content.srLabel}
      className="fixed inset-0 z-55 overflow-hidden font-grotesk text-ink"
    >
      <p className="sr-only">
        {content.name.first} {content.name.last}. {content.tagline.lead} {content.tagline.key}
      </p>

      <div ref={bind("stage")} className="absolute inset-0 origin-center">
        <div aria-hidden className="absolute inset-0 bg-paper" />
        {FLOOD_COLORS.map((color, index) => (
          <div
            key={`flood-${index}`}
            ref={bind(`flood-${index}`)}
            style={HIDDEN}
            aria-hidden
            className={cn("absolute top-0 left-0 rounded-full", color)}
          />
        ))}

        <div ref={bind("camera")} aria-hidden className="absolute inset-0">
          <canvas ref={bind("canvas")} className="absolute inset-0 size-full" />
          <Scenes content={content} bind={bind} onEnter={enter} />
          <div ref={bind("dot")} className="absolute top-0 left-0 size-0 rounded-full bg-signal" />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[url(/textures/grain.svg)] bg-size-[256px] opacity-4 mix-blend-multiply"
        />

        <button
          type="button"
          onClick={enter}
          className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/90 px-4 py-2 font-technical text-xs tracking-[0.16em] text-ink uppercase shadow-sm backdrop-blur-sm transition-colors duration-200 ease-print hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:right-8 sm:bottom-8"
        >
          {content.skip}
          <span aria-hidden>→</span>
        </button>
      </div>

      {/* The mark that flies to the navbar on the way out (screen space, never faded). */}
      <div ref={bind("exit-mark")} style={HIDDEN} aria-hidden className="pointer-events-none absolute top-0 left-0">
        <svg
          viewBox={`0 0 ${MONOGRAM_VIEWBOX.width} ${MONOGRAM_VIEWBOX.height}`}
          className="block size-full overflow-visible"
        >
          <path d={MONOGRAM_LETTERS} className="fill-ink" />
          <circle cx="398" cy="154" r="16" className="fill-signal" />
        </svg>
      </div>
    </section>
  );
};
