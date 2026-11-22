"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

/*
 * Custom cursor in the single accent colour (docs/STYLE.md §7.4): a crisp
 * signal dot that sits exactly on the pointer, and a trailing ring on a
 * spring. Over anything interactive the ring opens into a reticle; a press
 * compresses it and sends out a pulse.
 *
 * Mounted once per surface (PublicShell). Fine pointers only: on touch or
 * coarse pointers nothing renders and the native cursor stays. Reduced
 * motion: the ring follows without lag and the pulse is skipped.
 */

const INTERACTIVE =
  'a[href], button:not(:disabled), [role="button"], input:not(:disabled), select, textarea, label[for], summary, [data-cursor="interactive"]';
const RING_SPRING = { stiffness: 520, damping: 38, mass: 0.6 } as const;
const RING_SIZE = 36;
const BRACKETS = [
  "top-0 left-0 border-t-2 border-l-2",
  "top-0 right-0 border-t-2 border-r-2",
  "bottom-0 left-0 border-b-2 border-l-2",
  "right-0 bottom-0 border-r-2 border-b-2",
] as const;

type CursorState = { visible: boolean; interactive: boolean; pressed: boolean };

const useCursorTracking = (enabled: boolean) => {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const [state, setState] = useState<CursorState>({ visible: false, interactive: false, pressed: false });
  const [pulses, setPulses] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const root = document.documentElement;
    root.dataset.customCursor = "on";

    const update = (patch: Partial<CursorState>) =>
      setState((current) =>
        Object.entries(patch).every(([key, value]) => current[key as keyof CursorState] === value)
          ? current
          : { ...current, ...patch },
      );

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
        return;
      }
      x.set(event.clientX);
      y.set(event.clientY);
      const target = event.target instanceof Element ? event.target : null;
      update({ visible: true, interactive: Boolean(target?.closest(INTERACTIVE)) });
    };
    const handleDown = (event: PointerEvent) => {
      update({ pressed: true });
      setPulses((list) => [...list.slice(-2), { id: event.timeStamp, x: event.clientX, y: event.clientY }]);
    };
    const handleUp = () => update({ pressed: false });
    const handleLeave = (event: PointerEvent) => {
      if (!event.relatedTarget) {
        update({ visible: false, pressed: false });
      }
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleDown, { passive: true });
    window.addEventListener("pointerup", handleUp, { passive: true });
    document.addEventListener("pointerout", handleLeave, { passive: true });
    return () => {
      delete root.dataset.customCursor;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointerout", handleLeave);
    };
  }, [enabled, x, y]);

  const removePulse = (id: number) => setPulses((list) => list.filter((pulse) => pulse.id !== id));

  return { x, y, state, pulses, removePulse };
};

export const CustomCursor = () => {
  const { reducedMotion } = useMotionTheme();
  const finePointer = useMediaQuery("(pointer: fine)");
  const { x, y, state, pulses, removePulse } = useCursorTracking(finePointer);
  const springX = useSpring(x, RING_SPRING);
  const springY = useSpring(y, RING_SPRING);

  if (!finePointer) {
    return null;
  }

  const ringScale = state.pressed ? 0.78 : state.interactive ? 1.55 : 1;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-60 print:hidden">
      {/* Trailing ring → reticle over interactive elements */}
      <motion.div
        className="absolute top-0 left-0"
        style={{ x: reducedMotion ? x : springX, y: reducedMotion ? y : springY }}
      >
        <motion.div
          className="relative -translate-1/2"
          style={{ width: RING_SIZE, height: RING_SIZE }}
          initial={false}
          animate={{ scale: ringScale, opacity: state.visible ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
        >
          <motion.span
            className="absolute inset-0 rounded-full border-[1.5px] border-signal"
            initial={false}
            animate={{ opacity: state.interactive ? 0 : 1, scale: state.interactive ? 0.6 : 1 }}
          />
          {BRACKETS.map((position) => (
            <motion.span
              key={position}
              className={cn("absolute size-2.5 border-signal", position)}
              initial={false}
              animate={{ opacity: state.interactive ? 1 : 0, scale: state.interactive ? 1 : 0.4 }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Exact pointer dot */}
      <motion.div className="absolute top-0 left-0" style={{ x, y }}>
        <motion.span
          className="block size-1.5 -translate-1/2 rounded-full bg-signal"
          initial={false}
          animate={{ opacity: state.visible ? 1 : 0, scale: state.pressed ? 1.6 : 1 }}
        />
      </motion.div>

      {/* Press pulses */}
      <AnimatePresence>
        {reducedMotion
          ? null
          : pulses.map((pulse) => (
              <motion.span
                key={pulse.id}
                className="absolute rounded-full border border-signal"
                style={{
                  left: pulse.x - RING_SIZE / 2,
                  top: pulse.y - RING_SIZE / 2,
                  width: RING_SIZE,
                  height: RING_SIZE,
                }}
                initial={{ scale: 0.6, opacity: 0.9 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
                onAnimationComplete={() => removePulse(pulse.id)}
              />
            ))}
      </AnimatePresence>
    </div>
  );
};
