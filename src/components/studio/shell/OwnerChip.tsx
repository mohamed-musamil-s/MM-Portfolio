"use client";

import { motion } from "motion/react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

/**
 * Signed-in owner in the topbar: name and role, and an initials avatar inside
 * a slowly rotating gradient ring with a live status dot. Lifts on hover.
 * On phones only the avatar shows; the name stays available to assistive tech.
 */
export const OwnerChip = ({ owner }: { owner: StudioShellContent["owner"] }) => {
  const { reducedMotion } = useMotionTheme();
  return (
    <motion.div
      className="flex items-center gap-3 rounded-xl py-1 pr-1 pl-3"
      initial={reducedMotion ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reducedMotion ? undefined : { y: -1 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <span className="hidden flex-col items-end leading-tight sm:flex">
        <span className="text-sm font-semibold text-foreground">{owner.name}</span>
        <span className="text-xs text-muted-foreground">{owner.role}</span>
      </span>
      <span className="sr-only sm:hidden">{owner.name}</span>
      <span aria-hidden className="relative grid size-10 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,var(--studio-aurora-cyan),var(--studio-primary),var(--studio-aurora-indigo),var(--studio-aurora-cyan))]"
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 6, ease: "linear", repeat: Infinity }}
        />
        <span className="relative grid size-[34px] place-items-center rounded-full bg-linear-to-br from-primary to-aurora-indigo text-xs font-semibold text-primary-foreground ring-2 ring-card">
          {initials(owner.name)}
        </span>
        <span className="absolute right-0 bottom-0 grid size-3 place-items-center rounded-full bg-card">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
            <span className="relative size-2 rounded-full bg-success" />
          </span>
        </span>
      </span>
    </motion.div>
  );
};
