"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { MagicIcon, type IconName, type IconState } from "@/components/ui/MagicIcon";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";

type Pillar = MaintenanceContent["pillars"][number];

/** Icons whose meaningful "attention" state is motion rather than a hover pose. */
const HOVER_STATE: Partial<Record<IconName, IconState>> = { sync: "loading", status: "loading" };

/**
 * Editorial index row. Hover floods it with ink from the left; the content
 * inverts through a difference blend (paper text over a paper base reads as
 * ink, over the ink flood reads as paper).
 */
export const PillarRow = ({ pillar, order }: { pillar: Pillar; order: number }) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [hovering, setHovering] = useState(false);
  const iconState: IconState = hovering ? (HOVER_STATE[pillar.icon] ?? "hover") : "idle";

  return (
    <motion.li
      ref={ref}
      className="relative isolate overflow-hidden border-b border-rule bg-paper"
      initial={reducedMotion ? false : { opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: tokens.duration.slow, ease: tokens.ease, delay: order * 0.12 }}
      onHoverStart={() => setHovering(true)}
      onHoverEnd={() => setHovering(false)}
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 origin-left bg-ink"
        initial={false}
        animate={{ scaleX: hovering ? 1 : 0 }}
        transition={{ duration: tokens.duration.base, ease: tokens.ease }}
      />
      <div className="relative z-10 grid grid-cols-[auto_1fr_auto] items-baseline gap-x-6 gap-y-3 px-1 py-8 text-paper mix-blend-difference md:grid-cols-12 md:py-12">
        <span className="font-technical text-micro md:col-span-1">{pillar.index} /</span>
        <h3 className="text-h2 font-extrabold uppercase md:col-span-5">{pillar.title}</h3>
        <span className="self-center justify-self-end md:order-last md:col-span-1">
          {/* Mounted once visible, so the draw-on-mount plays where the reader can see it. */}
          <span className="block size-9">{inView ? <MagicIcon name={pillar.icon} state={iconState} size={36} /> : null}</span>
        </span>
        <p className="col-start-2 col-end-4 max-w-[48ch] text-body md:col-span-5 md:col-start-auto">{pillar.description}</p>
      </div>
    </motion.li>
  );
};
