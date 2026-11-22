"use client";

import { animate, createDrawable, set, type JSAnimation } from "animejs";
import { useEffect, useRef, useState, type SVGProps } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { secondsToMs, toAnimeEase } from "@/lib/motion/anime";
import { useIconContext } from "./icon-context";

type InkPathProps = Omit<SVGProps<SVGPathElement>, "ref" | "d"> & {
  /** Target geometry. Changing it morphs from the current shape. */
  d: string;
  /** Whether the stroke is drawn. Toggling it draws in or erases. */
  drawn?: boolean;
  /** Position in the icon's draw-on-mount stagger. */
  order?: number;
};

const SHOWN = "0 1";
const HIDDEN = "0 0";

/**
 * The single stroke primitive behind every MagicIcon. anime.js owns this
 * element's geometry (`d`) and stroke drawing; motion never touches it.
 * React only renders the initial `d`, so re-renders cannot interrupt a tween.
 */
export const InkPath = ({ d, drawn = true, order = 0, ...rest }: InkPathProps) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const { drawOnMount } = useIconContext();
  const pathRef = useRef<SVGPathElement>(null);
  const isFirstDraw = useRef(true);
  const [initial] = useState(() => ({ d, hidden: drawOnMount || !drawn }));

  // Geometry morph.
  useEffect(() => {
    const path = pathRef.current;
    if (!path || path.getAttribute("d") === d) {
      return;
    }
    if (reducedMotion) {
      path.setAttribute("d", d);
      return;
    }
    const morph: JSAnimation = animate(path, {
      d,
      duration: secondsToMs(tokens.duration.base),
      ease: toAnimeEase(tokens.ease),
    });
    return () => {
      morph.pause();
    };
  }, [d, reducedMotion, tokens]);

  // Stroke drawing (mount draw-in and drawn on/off).
  useEffect(() => {
    const path = pathRef.current;
    if (!path) {
      return;
    }
    const drawable = createDrawable(path);
    const target = drawn ? SHOWN : HIDDEN;
    const firstDraw = isFirstDraw.current;
    isFirstDraw.current = false;

    if (reducedMotion || (firstDraw && !drawOnMount)) {
      set(drawable, { draw: target });
      return;
    }

    const draw: JSAnimation = animate(drawable, {
      draw: firstDraw ? [HIDDEN, target] : target,
      duration: secondsToMs(firstDraw ? tokens.duration.slow : tokens.duration.base),
      delay: firstDraw ? order * tokens.drawStaggerMs : 0,
      ease: toAnimeEase(tokens.ease),
    });
    return () => {
      draw.pause();
    };
  }, [drawn, drawOnMount, order, reducedMotion, tokens]);

  return (
    <path
      ref={pathRef}
      d={initial.d}
      // Hidden until anime.js takes over, so a mount draw never flashes the full stroke.
      {...(initial.hidden ? { pathLength: 1, strokeDasharray: "0 1" } : {})}
      {...rest}
    />
  );
};
