"use client";

import { useSpring, type MotionValue } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { useMotionTheme } from "./useMotionTheme";

type Magnetic<T extends HTMLElement> = {
  /** Attach to a wrapper that does NOT move; it is measured each frame. */
  anchorRef: RefObject<T | null>;
  /** Apply to the element that should be pulled toward the cursor. */
  x: MotionValue<number>;
  y: MotionValue<number>;
};

/**
 * Magnetic cursor pull. Only active for the theme's `magnetic` config, on fine
 * pointers, and when reduced motion is off. Measuring a static anchor (not the
 * moving element) avoids feedback jitter.
 */
export const useMagnetic = <T extends HTMLElement>(enabled = true): Magnetic<T> => {
  const { tokens, reducedMotion } = useMotionTheme();
  const anchorRef = useRef<T>(null);
  const x = useSpring(0, tokens.spring);
  const y = useSpring(0, tokens.spring);
  const config = tokens.magnetic;
  const active = enabled && config !== null && !reducedMotion;

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!active || !anchor || !config || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      const box = anchor.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height / 2);
      const reach = Math.max(box.width, box.height) / 2 + config.radius;
      const inside = Math.hypot(dx, dy) < reach;
      x.set(inside ? dx * config.strength : 0);
      y.set(inside ? dy * config.strength : 0);
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      x.set(0);
      y.set(0);
    };
  }, [active, config, x, y]);

  return { anchorRef, x, y };
};
