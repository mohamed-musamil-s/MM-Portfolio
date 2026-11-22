"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useId } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";

type StampMarkProps = {
  image: MaintenanceContent["images"]["stamp"];
  available: boolean;
  lines: MaintenanceContent["stamp"]["lines"];
};

const RING_SECONDS = 36;

/**
 * Risograph stamp. Uses the stamp image when present; otherwise draws one:
 * the first line runs around a slowly turning ring, the rest sit in the
 * centre, all through a distressed-edge filter.
 */
export const StampMark = ({ image, available, lines }: StampMarkProps) => {
  const { reducedMotion } = useMotionTheme();
  const id = useId().replace(/:/g, "");
  const [ringText, ...centerLines] = lines;

  if (available) {
    return (
      <div className="relative aspect-square w-full">
        <Image src={image.src} alt={image.alt} fill sizes="128px" className="object-contain grayscale contrast-125" />
      </div>
    );
  }

  return (
    <svg viewBox="0 0 120 120" aria-hidden className="w-full -rotate-12 text-ink">
      <defs>
        <filter id={`${id}-ink`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="2.2" />
        </filter>
        <path id={`${id}-ring`} d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1 -88 0" />
      </defs>
      <g filter={`url(#${id}-ink)`} fill="currentColor" stroke="currentColor">
        <circle cx={60} cy={60} r={56} fill="none" strokeWidth={2.5} />
        <circle cx={60} cy={60} r={34} fill="none" strokeWidth={1} />
        <motion.g
          style={{ originX: 0.5, originY: 0.5 }}
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: RING_SECONDS, repeat: Infinity, ease: "linear" }}
        >
          <text stroke="none" fontSize={9.5} letterSpacing={2.2} className="font-technical">
            <textPath href={`#${id}-ring`}>
              {`${ringText} · ${ringText} · `}
            </textPath>
          </text>
        </motion.g>
        {centerLines.map((line, index) => (
          <text
            key={line}
            x={60}
            y={62 + (index - (centerLines.length - 1) / 2) * 11}
            stroke="none"
            fontSize={9}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-grotesk font-extrabold"
          >
            {line}
          </text>
        ))}
      </g>
    </svg>
  );
};
