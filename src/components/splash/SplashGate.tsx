"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { SplashContent } from "@/lib/shared/content/splash-schema";
import { ROUTES } from "@/lib/shared/routes";
import { NameSplash } from "./NameSplash";
import { SPLASH_COOKIE } from "./splash-cookie";

/**
 * Decides whether the name splash plays over this page
 * (docs/screens/SPLASH_BUSINESS.md §2): once per browser session, never in
 * the studio preview frame, never for reduced motion. While it plays the page
 * underneath can't scroll.
 */
export const SplashGate = ({ content, seen }: { content: SplashContent | null; seen: boolean }) => {
  const pathname = usePathname();
  const { reducedMotion } = useMotionTheme();
  const [done, setDone] = useState(false);
  const show = Boolean(content?.enabled) && !seen && !done && !reducedMotion && !pathname.startsWith(ROUTES.preview);

  useEffect(() => {
    if (!show) {
      return;
    }
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${SPLASH_COOKIE}=1; path=/; samesite=lax${secure}`;
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
  return <NameSplash content={content} variant="overlay" onFinished={() => setDone(true)} />;
};
