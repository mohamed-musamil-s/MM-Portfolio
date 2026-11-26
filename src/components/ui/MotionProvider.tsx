"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, useMemo, type ReactNode } from "react";
import { MotionContext, type MotionContextValue } from "@/lib/motion/motion-context";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { MOTION_THEMES, type MotionTheme } from "@/lib/motion/tokens";

type MotionProviderProps = {
  theme: MotionTheme;
  /** Lenis inertial scroll. Defaults to on for the portfolio, off for the studio. */
  smoothScroll?: boolean;
  children: ReactNode;
};

/**
 * Lenis drives scrolling from GSAP's ticker so ScrollTrigger and Lenis share
 * one animation frame; otherwise scrubbed parallax lags a frame behind.
 */
const useSmoothScroll = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true, anchors: { offset: -72 } });
    const tick = (seconds: number) => lenis.raf(seconds * 1000);

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [enabled]);
};

/**
 * Root of every animated subtree. Supplies the theme's motion tokens, makes
 * `motion` honour the OS reduced-motion setting, and runs smooth scroll.
 * Mount one per surface: `theme="portfolio"` in the public shell,
 * `theme="studio"` in the studio layout.
 */
export const MotionProvider = ({ theme, smoothScroll = theme === "portfolio", children }: MotionProviderProps) => {
  const reducedMotion = useReducedMotion() ?? false;
  const tokens = MOTION_THEMES[theme];

  useSmoothScroll(smoothScroll && !reducedMotion);

  const value = useMemo<MotionContextValue>(() => ({ theme, tokens, reducedMotion }), [theme, tokens, reducedMotion]);

  return (
    <MotionContext value={value}>
      <MotionConfig reducedMotion="user" transition={{ duration: tokens.duration.base, ease: tokens.ease }}>
        {children}
      </MotionConfig>
    </MotionContext>
  );
};
