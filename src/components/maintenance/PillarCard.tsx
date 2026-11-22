"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { MagicIcon, type IconName, type IconState } from "@/components/ui/MagicIcon";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";

type Pillar = MaintenanceContent["pillars"][number];

/** Icons whose meaningful "attention" state is motion rather than a hover pose. */
const HOVER_STATE: Partial<Record<IconName, IconState>> = { sync: "loading", status: "loading" };

export const PillarCard = ({ pillar, order }: { pillar: Pillar; order: number }) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [hovering, setHovering] = useState(false);
  const iconState: IconState = hovering ? (HOVER_STATE[pillar.icon] ?? "hover") : "idle";

  return (
    <motion.li
      ref={ref}
      className="flex flex-col gap-6 border-b border-rule py-10 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
      initial={reducedMotion ? false : { opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: tokens.duration.slow, ease: tokens.ease, delay: order * 0.12 }}
      onHoverStart={() => setHovering(true)}
      onHoverEnd={() => setHovering(false)}
    >
      <div className="flex items-center justify-between">
        <span className="font-technical text-micro text-graphite">{pillar.index} /</span>
        {/* Mounted once visible, so the icon's draw-on-mount plays where the reader can see it. */}
        <span className="size-8">{inView ? <MagicIcon name={pillar.icon} state={iconState} size={32} /> : null}</span>
      </div>
      <h3 className="text-h3 font-bold uppercase">{pillar.title}</h3>
      <p className="max-w-[40ch] text-body text-graphite">{pillar.description}</p>
    </motion.li>
  );
};
