"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useMotionTheme } from "./useMotionTheme";

type ParallaxOptions = {
  /**
   * Fraction of the element's height it drifts while crossing the viewport.
   * Positive moves up (slower than scroll), negative moves down.
   */
  speed?: number;
};

/**
 * Scroll-linked parallax layer (GSAP ScrollTrigger, scrubbed). Works with the
 * Lenis smooth scroll in MotionProvider. Cleanup is automatic: useGSAP reverts
 * its context on unmount. Disabled under reduced motion.
 */
export const useParallax = <T extends HTMLElement>(ref: RefObject<T | null>, { speed = 0.2 }: ParallaxOptions = {}) => {
  const { reducedMotion } = useMotionTheme();

  useGSAP(
    () => {
      if (reducedMotion || speed === 0 || !ref.current) {
        return;
      }
      gsap.to(ref.current, {
        yPercent: -speed * 100,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
      });
    },
    { dependencies: [speed, reducedMotion], scope: ref, revertOnUpdate: true },
  );
};
