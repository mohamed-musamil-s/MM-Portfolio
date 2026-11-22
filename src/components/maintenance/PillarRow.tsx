"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { MagicIcon, type IconName, type IconState } from "@/components/ui/MagicIcon";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";

type Pillar = MaintenanceContent["pillars"][number];

/** Icons whose meaningful "attention" state is motion rather than a hover pose. */
const HOVER_STATE: Partial<Record<IconName, IconState>> = { sync: "loading", status: "loading" };

/**
 * Compact index row. Hover floods it with ink from the left; the content
 * inverts through a difference blend (paper text over a paper base reads as
 * ink, over the ink flood reads as paper) and the icon reacts.
 */
export const PillarRow = ({ pillar, delay }: { pillar: Pillar; delay: number }) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const [hovering, setHovering] = useState(false);
  const iconState: IconState = hovering ? (HOVER_STATE[pillar.icon] ?? "hover") : "idle";

  return (
    <motion.li
      className="relative isolate overflow-hidden border-b border-rule bg-paper"
      initial={reducedMotion ? false : { opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: tokens.duration.slow, ease: tokens.ease, delay }}
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
      <div className="relative z-10 grid grid-cols-[auto_auto_1fr] items-center gap-x-4 px-1 py-2 text-paper lg:py-2.5 mix-blend-difference [@media(max-height:820px)]:py-1.5">
        <MagicIcon name={pillar.icon} state={iconState} size={20} />
        <h3 className="text-label font-bold whitespace-nowrap uppercase">
          <span className="mr-2 font-technical text-micro font-normal">{pillar.index} /</span>
          {pillar.title}
        </h3>
        <p className="hidden truncate text-right font-technical text-micro sm:block">{pillar.description}</p>
      </div>
    </motion.li>
  );
};
