"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { MagicIcon, type IconName, type IconState } from "@/components/ui/MagicIcon";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";

type Pillar = MaintenanceContent["pillars"][number];

/** Icons whose meaningful "attention" state is motion rather than a hover pose. */
const HOVER_STATE: Partial<Record<IconName, IconState>> = { sync: "loading", status: "loading" };

/** One upgrade pillar. Hover draws a signal-orange rule across the top and wakes the icon. */
export const PillarColumn = ({ pillar, delay }: { pillar: Pillar; delay: number }) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const [hovering, setHovering] = useState(false);
  const iconState: IconState = hovering ? (HOVER_STATE[pillar.icon] ?? "hover") : "idle";

  return (
    <motion.li
      className="relative flex flex-col gap-1.5 pt-4 lg:gap-2 lg:pt-5"
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: tokens.duration.slow, ease: tokens.ease, delay }}
      onHoverStart={() => setHovering(true)}
      onHoverEnd={() => setHovering(false)}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ink/15" />
      <motion.span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 origin-left bg-signal"
        initial={false}
        animate={{ scaleX: hovering ? 1 : 0 }}
        transition={{ duration: tokens.duration.base, ease: tokens.ease }}
      />
      <div className="flex items-center gap-3">
        <MagicIcon name={pillar.icon} state={iconState} size={18} />
        <span className="font-technical text-micro text-graphite">{pillar.index}</span>
        <h3 className="text-label font-bold uppercase">{pillar.title}</h3>
      </div>
      <p className="hidden max-w-[40ch] text-body leading-snug text-graphite sm:block [@media(max-height:820px)]:hidden">
        {pillar.description}
      </p>
    </motion.li>
  );
};
