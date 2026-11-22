"use client";

import { useEffect } from "react";

type BodyScopeProps = {
  /** Design surface for portalled overlays (tooltips, popovers, dialogs). */
  surface?: "studio";
  /** Pins portalled overlays to a theme, matching a pinned page. */
  theme?: "light";
  /** Extra classes for <body>, e.g. the next/font variable the surface's font refers to. */
  className?: string;
};

/**
 * shadcn/Radix overlays render in a portal at the end of <body>, outside the
 * page's [data-surface] wrapper, so they'd miss the studio tokens. While a
 * studio page is mounted this mirrors its surface (and pinned theme) onto
 * <body>, and removes it again on unmount.
 */
export const BodyScope = ({ surface, theme, className }: BodyScopeProps) => {
  useEffect(() => {
    const { body } = document;
    if (surface) {
      body.dataset.surface = surface;
    }
    if (theme) {
      body.dataset.studioTheme = theme;
    }
    const classes = className?.split(" ").filter(Boolean) ?? [];
    body.classList.add(...classes);
    return () => {
      body.classList.remove(...classes);
      if (surface) {
        delete body.dataset.surface;
      }
      if (theme) {
        delete body.dataset.studioTheme;
      }
    };
  }, [surface, theme, className]);
  return null;
};
