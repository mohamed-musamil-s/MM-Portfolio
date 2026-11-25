"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { SplashContent } from "@/lib/shared/content/splash-schema";
import { ROUTES } from "@/lib/shared/routes";
import { NameSplash } from "./NameSplash";

/**
 * Plays the name splash over the home page (`/`), on every visit
 * (docs/screens/SPLASH_BUSINESS.md §2). It lives in the public layout, so
 * it stays on screen while the home page moves on underneath it (to
 * `/maintenance` while maintenance mode is on), and its exit reveals that
 * page. Skipped for reduced motion. While it plays the page can't scroll.
 */
export const SplashGate = ({ content }: { content: SplashContent | null }) => {
  const pathname = usePathname();
  const { reducedMotion } = useMotionTheme();
  // Decided on arrival only: navigating underneath it must not cut it short.
  const [arrivedHome] = useState(pathname === ROUTES.home);
  const [done, setDone] = useState(false);
  const show = Boolean(content?.enabled) && arrivedHome && !done && !reducedMotion;

  useEffect(() => {
    if (!show) {
      return;
    }
    const { style } = document.documentElement;
    const overflow = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = overflow;
    };
  }, [show]);

  if (!show || !content) {
    return null;
  }
  return <NameSplash content={content} onFinished={() => setDone(true)} />;
};
