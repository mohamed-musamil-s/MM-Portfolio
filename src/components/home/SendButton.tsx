"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/shared/cn";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { playCelebration, playImpact } from "@/lib/motion/impact-fx";

/*
 * The contact form's submit button, in the site's own pill style (ink body,
 * signal disc, label that rolls on hover). Its motion borrows the beats of an
 * anime impact frame: it squashes while pressed; when the send starts it
 * flashes signal for a frame, tilts and springs back with a burst behind it;
 * when the server has accepted the message the disc turns to a check and the
 * whole screen celebrates (src/lib/motion/impact-fx.ts). A failure shakes it.
 */

export type SendState = "idle" | "sending" | "done" | "error";

const ICON: Record<SendState, string> = { idle: "→", sending: "", done: "✓", error: "→" };

export const SendButton = ({ state, children }: { state: SendState; children: string }) => {
  const button = useRef<HTMLButtonElement>(null);
  const previous = useRef<SendState>(state);
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const reduce = useReducedMotion();

  useEffect(() => {
    const from = previous.current;
    previous.current = state;
    const element = button.current;
    if (!element || from === state) {
      return;
    }
    if (state === "sending") {
      playImpact(element);
      if (!reduce) {
        void animate("[data-flash]", { opacity: [1, 1, 0] }, { duration: 0.26, times: [0, 0.6, 1] });
        void animate(
          scope.current,
          { scale: [1, 1.16, 0.95, 1], rotate: [0, -4, 1.5, 0] },
          { duration: 0.6, ease: EASE_PRINT },
        );
      }
    }
    if (state === "done") {
      playCelebration(element);
      if (!reduce) {
        void animate(scope.current, { scale: [1, 1.22, 0.97, 1] }, { duration: 0.7, ease: EASE_PRINT });
      }
    }
    if (state === "error" && !reduce) {
      void animate(scope.current, { x: [0, -10, 9, -6, 4, 0] }, { duration: 0.45 });
    }
  }, [state, animate, scope, reduce]);

  const busy = state === "sending" || state === "done";

  return (
    <motion.span ref={scope} className="inline-block">
      <motion.button
        ref={button}
        type="submit"
        disabled={busy}
        aria-busy={state === "sending"}
        whileTap={busy || reduce ? undefined : { scaleY: 0.84, scaleX: 1.06 }}
        transition={{ type: "spring", stiffness: 520, damping: 15 }}
        className="group relative inline-flex min-h-12 items-center gap-3 overflow-hidden rounded-full bg-ink py-1.5 pr-1.5 pl-6 text-label font-bold text-paper uppercase transition-colors duration-300 ease-print hover:bg-ink/88 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal disabled:cursor-default"
      >
        {/* The impact frame: one flash of signal over the whole pill. */}
        <span aria-hidden data-flash className="pointer-events-none absolute inset-0 bg-signal opacity-0" />
        <span className="relative block overflow-hidden">
          <span className="block transition-transform duration-500 ease-print group-enabled:group-hover:-translate-y-full">
            {children}
          </span>
          <span
            aria-hidden
            className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-print group-enabled:group-hover:translate-y-0"
          >
            {children}
          </span>
        </span>
        <span
          aria-hidden
          className={cn(
            "relative grid size-9 place-items-center rounded-full bg-signal text-sm text-paper transition-transform duration-500 ease-print",
            state !== "done" && "group-enabled:group-hover:rotate-[-45deg]",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {state === "sending" ? (
              <motion.span
                key="spin"
                className="block size-4 rounded-full border-2 border-paper/30 border-t-paper"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ rotate: { repeat: Infinity, duration: 0.8, ease: "linear" }, default: { duration: 0.2 } }}
              />
            ) : (
              <motion.span
                key={ICON[state]}
                className="block"
                initial={{ opacity: 0, scale: 0.3, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ type: "spring", stiffness: 480, damping: 18 }}
              >
                {ICON[state]}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>
    </motion.span>
  );
};
