"use client";

import { motion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useParallax } from "@/hooks/useParallax";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { cn } from "@/lib/shared/cn";

type ParallaxLayerProps = {
  /** Scroll drift (GSAP ScrollTrigger), as a fraction of the layer height. */
  speed?: number;
  /** Pointer depth in px (motion springs). Negative moves against the cursor. */
  depth?: number;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
};

/**
 * A depth layer. Scroll parallax (GSAP) moves the outer element; pointer
 * parallax (motion) moves the inner one, so the two libraries never write the
 * same transform.
 */
export const ParallaxLayer = ({ speed = 0, depth = 0, className, innerClassName, children }: ParallaxLayerProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  useParallax(outerRef, { speed });
  const { x, y } = usePointerParallax(depth);

  return (
    <div ref={outerRef} className={className}>
      <motion.div className={cn("size-full", innerClassName)} style={{ x, y }}>
        {children}
      </motion.div>
    </div>
  );
};
