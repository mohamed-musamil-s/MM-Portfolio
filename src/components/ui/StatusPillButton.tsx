"use client";

import { motion } from "motion/react";
import { VisuallyHidden } from "radix-ui";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { SHAKE_KEYFRAMES } from "@/lib/motion/tokens";
import { MagicIcon, type IconName } from "./MagicIcon";
import type { ActionHandler } from "./action-button/types";
import { useActionButton } from "./action-button/use-action-button";
import { statusPill } from "./status-pill/status-pill.styles";

/*
 * Small, clean primary pill whose label follows the action's status
 * (docs/ANIMATION_UI.md §8b), e.g. CHECK AGAIN → CHECKING STATUS... →
 * STILL UPGRADING. Same behaviour engine as ActionButton (useActionButton).
 *
 * Deliberately quiet: no hover movement, no magnetic pull, no corner marks,
 * no halo. Hover dims the fill; press scales to the theme's press scale; the
 * icon orbits while loading and becomes a check on success; errors shake.
 */

type StatusPillButtonProps = {
  labels: { idle: string; loading: string; success: string };
  onAction: ActionHandler;
  icon?: IconName;
  className?: string;
};

type LabelKey = keyof StatusPillButtonProps["labels"];
const LABEL_ORDER: LabelKey[] = ["idle", "loading", "success"];
const SHAKE_SECONDS = 0.45;
const EASE = [0.2, 0, 0, 1] as const;

export const StatusPillButton = ({ labels, onAction, icon = "sync", className }: StatusPillButtonProps) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const behavior = useActionButton({ method: "async-fetch", onAction, children: labels.idle });
  const { status } = behavior;
  const styles = statusPill();
  const outcome = status === "success" || status === "error";
  const current: LabelKey = status === "loading" ? "loading" : status === "success" ? "success" : "idle";

  return (
    <>
      <motion.button
        type="button"
        className={styles.root({ class: className })}
        initial={false}
        animate={{ x: status === "error" ? SHAKE_KEYFRAMES : 0 }}
        transition={{ x: { duration: SHAKE_SECONDS } }}
        whileTap={reducedMotion ? undefined : { scale: tokens.pressScale }}
        aria-busy={status === "loading" || undefined}
        data-status={status}
        {...behavior.handlers}
      >
        <span className={styles.content()}>
          <span className={styles.iconSlot()}>
            <motion.span
              className="absolute inset-0 grid place-items-center"
              initial={false}
              animate={{ opacity: outcome ? 0 : 1 }}
            >
              <MagicIcon name={icon} state={behavior.iconState} size={16} />
            </motion.span>
            <motion.span
              className="absolute inset-0 grid place-items-center text-signal"
              initial={false}
              animate={{ opacity: outcome ? 1 : 0 }}
            >
              <MagicIcon name="status" state={behavior.iconState} size={16} />
            </motion.span>
          </span>
          {/* All labels share one grid cell, so the pill never changes width. */}
          <span className={styles.labels()}>
            {LABEL_ORDER.map((key) => {
              const active = key === current;
              const before = LABEL_ORDER.indexOf(key) < LABEL_ORDER.indexOf(current);
              return (
                <motion.span
                  key={key}
                  aria-hidden={!active}
                  className={styles.label()}
                  initial={false}
                  animate={{ opacity: active ? 1 : 0, y: active ? 0 : before ? "-50%" : "50%" }}
                  transition={{ duration: 0.28, ease: EASE }}
                >
                  {labels[key]}
                </motion.span>
              );
            })}
          </span>
        </span>
      </motion.button>
      <VisuallyHidden.Root aria-live="polite">{status === "idle" ? "" : labels[current]}</VisuallyHidden.Root>
    </>
  );
};
