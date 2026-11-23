"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState, type PointerEvent } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

type Ripple = { id: number; x: number; y: number; size: number };

/**
 * Click feedback: a soft circle grows from the pointer and fades. Only on
 * press, never on hover. Attach `onPointerDown` to the control (which must be
 * `relative overflow-hidden`) and render `ripples` inside it.
 */
export const useRipple = (className?: string) => {
  const { reducedMotion } = useMotionTheme();
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (reducedMotion) {
        return;
      }
      const box = event.currentTarget.getBoundingClientRect();
      const size = Math.max(box.width, box.height) * 2;
      setRipples((list) => [
        ...list.slice(-2),
        { id: event.timeStamp, x: event.clientX - box.left - size / 2, y: event.clientY - box.top - size / 2, size },
      ]);
    },
    [reducedMotion],
  );

  const ripples_ = (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className={cn("absolute rounded-full bg-primary/15", className)}
            style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
            onAnimationComplete={() => setRipples((list) => list.filter((item) => item.id !== ripple.id))}
          />
        ))}
      </AnimatePresence>
    </span>
  );

  return { onPointerDown, ripples: ripples_ };
};
