"use client";

import { motion } from "motion/react";
import { MagicIcon } from "@/components/ui/MagicIcon";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { StudioModule, StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { MODULE_ICONS } from "./nav";

type ModulePlaceholderProps = { module: StudioModule; content: StudioShellContent };

const EASE = [0.2, 0, 0, 1] as const;
const SKELETON_ROWS = ["w-3/4", "w-1/2", "w-2/3"] as const;

/**
 * Body of a module page that isn't built yet. Everything moves: the header
 * rises in, the card's gradient border flows, the icon tile floats inside an
 * orbiting ring, the badge shimmers and three placeholder rows pulse.
 */
export const ModulePlaceholder = ({ module, content }: ModulePlaceholderProps) => {
  const { reducedMotion: still } = useMotionTheme();
  const copy = content.modules[module];
  const rise = (delay: number) => ({
    initial: still ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: EASE, delay },
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <motion.h1 className="text-3xl font-semibold tracking-tight text-balance" {...rise(0.05)}>
          {copy.title}
        </motion.h1>
        <motion.p className="max-w-2xl text-sm leading-relaxed text-muted-foreground" {...rise(0.12)}>
          {copy.description}
        </motion.p>
      </header>

      <motion.section
        className="relative animate-border-flow rounded-3xl bg-linear-to-r from-primary/40 via-aurora-cyan/40 to-aurora-indigo/40 bg-size-[200%_100%] p-px shadow-xl shadow-aurora-indigo/10 motion-reduce:animate-none"
        initial={still ? false : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
      >
        <div className="relative flex flex-col items-center overflow-hidden rounded-[calc(1.5rem-1px)] bg-card/85 px-6 py-16 text-center backdrop-blur-xl">
          {/* Icon tile floating inside an orbiting dashed ring */}
          <div className="relative grid size-28 place-items-center">
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full border border-dashed border-primary/30"
              animate={still ? undefined : { rotate: 360 }}
              transition={{ duration: 18, ease: "linear", repeat: Infinity }}
            >
              <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-aurora-cyan shadow-[0_0_12px] shadow-aurora-cyan" />
            </motion.span>
            <motion.span
              aria-hidden
              className="absolute inset-4 rounded-full bg-primary/10 blur-md"
              animate={still ? undefined : { scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
            />
            <motion.span
              className="relative grid size-14 place-items-center rounded-2xl bg-linear-to-br from-primary to-aurora-indigo text-primary-foreground shadow-xl shadow-primary/30"
              initial={still ? false : { scale: 0.4, rotate: -30, opacity: 0 }}
              animate={still ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1, y: [0, -6, 0] }}
              transition={
                still
                  ? undefined
                  : {
                      scale: { type: "spring", stiffness: 260, damping: 14, delay: 0.35 },
                      rotate: { type: "spring", stiffness: 260, damping: 14, delay: 0.35 },
                      opacity: { duration: 0.3, delay: 0.35 },
                      y: { duration: 4, ease: "easeInOut", repeat: Infinity, delay: 1 },
                    }
              }
            >
              <MagicIcon name={MODULE_ICONS[module]} size={24} state="active" />
            </motion.span>
          </div>

          <motion.span
            className="relative mt-6 overflow-hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            {...rise(0.5)}
          >
            <span className="absolute inset-y-0 left-0 w-1/2 animate-shimmer bg-linear-to-r from-transparent via-card/70 to-transparent motion-reduce:hidden" />
            <span className="relative">{content.placeholder.badge}</span>
          </motion.span>
          <motion.p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground" {...rise(0.58)}>
            {content.placeholder.body}
          </motion.p>

          {/* Placeholder rows hinting at the module to come */}
          <div aria-hidden className="mt-10 flex w-full max-w-md flex-col gap-3">
            {SKELETON_ROWS.map((width, index) => (
              <motion.div
                key={width}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
                initial={still ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: EASE, delay: 0.65 + index * 0.1 }}
              >
                <span className="size-8 shrink-0 animate-pulse rounded-lg bg-aurora-lavender/70" />
                <span className="flex flex-1 flex-col gap-2">
                  <span className={cn("h-2 animate-pulse rounded-full bg-aurora-lavender/80", width)} />
                  <span className="h-2 w-1/3 animate-pulse rounded-full bg-aurora-mist" />
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
};
