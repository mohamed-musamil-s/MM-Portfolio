"use client";

import { AnimatePresence, motion, useAnimationFrame, useMotionValue } from "motion/react";
import { VisuallyHidden } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { SHAKE_KEYFRAMES } from "@/lib/motion/tokens";
import { cn } from "@/lib/shared/cn";
import { MagicIcon, type IconName } from "./MagicIcon";
import { heroAction } from "./hero-action/hero-action.styles";
import type { ActionHandler } from "./action-button/types";
import { useActionButton } from "./action-button/use-action-button";

/*
 * The one oversized call to action on a screen (docs/ANIMATION_UI.md §5.3).
 * Same behaviour engine as ActionButton (useActionButton: state machine,
 * double-submit lock, auto reset); its own, much louder choreography:
 *
 *   idle     breathing orange halo, a sheen sweeps the ink surface, reticle
 *            brackets frame the pill, the icon turns slowly
 *   hover    magnetic pull, orange wipe + a second darker layer, brackets
 *            open outward, the icon primes
 *   press    detent (scale + 2px drop), an orange shockwave leaves the pill
 *   loading  label → busy label, a comet traces a ring around the pill, the
 *            icon orbits fast
 *   success  label → done label, icon becomes a check, a burst of rays and a
 *            second shockwave, then everything settles back to idle
 *   error    shake, X icon
 *
 * Labels come from the caller (database content). Reduced motion keeps every
 * state change but drops loops, waves, rays and the magnetic pull.
 */

type HeroActionButtonProps = {
  labels: { idle: string; loading: string; success: string };
  onAction: ActionHandler;
  icon?: IconName;
  className?: string;
};

type LabelKey = keyof HeroActionButtonProps["labels"];
const LABEL_ORDER: LabelKey[] = ["idle", "loading", "success"];

const BRACKETS = [
  { position: "top-0 left-0 border-t-2 border-l-2", out: { x: -1, y: -1 } },
  { position: "top-0 right-0 border-t-2 border-r-2", out: { x: 1, y: -1 } },
  { position: "bottom-0 left-0 border-b-2 border-l-2", out: { x: -1, y: 1 } },
  { position: "right-0 bottom-0 border-r-2 border-b-2", out: { x: 1, y: 1 } },
] as const;
const BRACKET_REST = 8;
const BRACKET_OPEN = 14;
const RAYS = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
const PRESS = { scale: 0.96, y: 2 } as const;
const SHAKE_SECONDS = 0.45;
/** Gap between the pill and the progress ring, px. */
const RING_GAP = 7;
const IDLE_ICON_DEG_PER_SECOND = 24;

const usePillSize = () => {
  const ref = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setSize({ width: entry.borderBoxSize[0]?.inlineSize ?? 0, height: entry.borderBoxSize[0]?.blockSize ?? 0 });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, size };
};

/** Slow continuous turn of the icon while idle (stops on hover / work). */
const useIdleSpin = (active: boolean) => {
  const rotate = useMotionValue(0);
  useAnimationFrame((_, delta) => {
    if (active) {
      rotate.set((rotate.get() + (delta / 1000) * IDLE_ICON_DEG_PER_SECOND) % 360);
    }
  });
  return rotate;
};

export const HeroActionButton = ({ labels, onAction, icon = "sync", className }: HeroActionButtonProps) => {
  const { reducedMotion } = useMotionTheme();
  const [waves, setWaves] = useState<number[]>([]);
  // A shockwave leaves the pill when work starts and again when it lands.
  const sendWave = () => {
    if (!reducedMotion) {
      setWaves((list) => [...list.slice(-2), performance.now()]);
    }
  };
  const runWithWaves = async () => {
    sendWave();
    const result = await onAction();
    sendWave();
    return result;
  };
  const behavior = useActionButton({ method: "async-fetch", onAction: runWithWaves, children: labels.idle });
  const { status, hovering } = behavior;
  const { anchorRef, x, y } = useMagnetic<HTMLSpanElement>(true);
  const { ref: pillRef, size } = usePillSize();
  const styles = heroAction();

  const loading = status === "loading";
  const success = status === "success";
  const idle = status === "idle";
  const lit = loading || (hovering && idle);
  const label: LabelKey = loading ? "loading" : success ? "success" : "idle";
  const ambient = idle && !hovering && !reducedMotion;
  const iconRotate = useIdleSpin(ambient);


  const bracketOffset = loading ? 4 : lit ? BRACKET_OPEN : BRACKET_REST;
  const ringWidth = size.width + RING_GAP * 2;
  const ringHeight = size.height + RING_GAP * 2;

  return (
    <span ref={anchorRef} className={cn(styles.anchor(), className)}>
      <motion.span
        className={styles.shaker()}
        initial={false}
        animate={{ x: status === "error" ? SHAKE_KEYFRAMES : 0 }}
        transition={{ duration: SHAKE_SECONDS }}
      >
        <motion.span className={styles.magnet()} style={{ x, y }}>
          {/* Idle: breathing halo */}
          <motion.span
            aria-hidden
            className={styles.halo()}
            initial={false}
            animate={ambient ? { scale: [1, 1.09], opacity: [0.6, 0] } : { scale: 1, opacity: 0 }}
            transition={ambient ? { duration: 2.4, repeat: Infinity, ease: "easeOut" } : { duration: 0.2 }}
          />

          {/* Reticle brackets framing the pill */}
          {BRACKETS.map(({ position, out }) => (
            <motion.span
              key={position}
              aria-hidden
              className={cn(styles.bracket(), position)}
              initial={false}
              animate={{
                x: out.x * bracketOffset,
                y: out.y * bracketOffset,
                opacity: success ? 0 : 1,
                rotate: loading ? out.x * out.y * 90 : 0,
              }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            />
          ))}

          {/* Loading: a comet orbits the pill */}
          {size.width > 0 ? (
            <svg
              aria-hidden
              className={styles.ring()}
              style={{ inset: -RING_GAP, width: ringWidth, height: ringHeight }}
              viewBox={`0 0 ${ringWidth} ${ringHeight}`}
            >
              <motion.rect
                x={1}
                y={1}
                width={ringWidth - 2}
                height={ringHeight - 2}
                rx={(ringHeight - 2) / 2}
                pathLength={1}
                strokeDasharray="0.22 0.78"
                initial={false}
                animate={
                  loading
                    ? { opacity: 1, strokeDashoffset: reducedMotion ? 0 : [0, -1] }
                    : { opacity: 0, strokeDashoffset: 0 }
                }
                transition={
                  loading && !reducedMotion
                    ? {
                        strokeDashoffset: { duration: 0.9, ease: "linear", repeat: Infinity },
                        opacity: { duration: 0.2 },
                      }
                    : { duration: 0.25 }
                }
              />
            </svg>
          ) : null}

          <motion.button
            ref={pillRef}
            type="button"
            className={styles.root()}
            whileTap={reducedMotion ? undefined : PRESS}
            transition={{ type: "spring", stiffness: 600, damping: 30 }}
            aria-busy={loading || undefined}
            data-status={status}
            {...behavior.handlers}
          >
            {/* Idle sheen sweeping the ink surface */}
            <motion.span
              aria-hidden
              className={styles.sheen()}
              initial={false}
              animate={ambient ? { x: ["-120%", "420%"] } : { x: "-120%" }}
              transition={
                ambient ? { duration: 1.3, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.6 } : { duration: 0 }
              }
            />
            {/* Hover / loading: two-layer wipe (signal, then a deeper pass) */}
            <motion.span
              aria-hidden
              className={styles.wipe()}
              initial={false}
              animate={{ scaleX: lit ? 1 : 0 }}
              transition={{ duration: 0.42, ease: [0.2, 0, 0, 1] }}
            />
            <motion.span
              aria-hidden
              className={styles.wipeDeep()}
              initial={false}
              animate={{ scaleX: lit ? 1 : 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0, 0, 1], delay: lit ? 0.12 : 0 }}
            />

            <span className={styles.content()}>
              <span className={styles.iconSlot()}>
                <motion.span
                  className="absolute inset-0 grid place-items-center"
                  style={{ rotate: iconRotate }}
                  initial={false}
                  animate={{ opacity: success || status === "error" ? 0 : 1, scale: success ? 0.4 : 1 }}
                >
                  <MagicIcon name={icon} state={behavior.iconState} size={28} />
                </motion.span>
                <motion.span
                  className="absolute inset-0 grid place-items-center text-signal"
                  initial={false}
                  animate={{ opacity: success || status === "error" ? 1 : 0, scale: success ? 1 : 0.6 }}
                >
                  <MagicIcon name="status" state={behavior.iconState} size={28} />
                </motion.span>
              </span>

              {/* All labels share one grid cell, so the pill never changes width. */}
              <span className="grid">
                {LABEL_ORDER.map((key) => {
                  const active = key === label;
                  const before = LABEL_ORDER.indexOf(key) < LABEL_ORDER.indexOf(label);
                  return (
                    <motion.span
                      key={key}
                      aria-hidden={!active}
                      className="whitespace-nowrap [grid-area:1/1]"
                      initial={false}
                      animate={{ opacity: active ? 1 : 0, y: active ? 0 : before ? "-60%" : "60%" }}
                      transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
                    >
                      {labels[key]}
                    </motion.span>
                  );
                })}
              </span>
            </span>
          </motion.button>

          {/* Shockwaves */}
          <AnimatePresence>
            {waves.map((id) => (
              <motion.span
                key={id}
                aria-hidden
                className={styles.wave()}
                initial={{ scale: 1, opacity: 0.9 }}
                animate={{ scale: [1, 1.28], opacity: [0.9, 0] }}
                transition={{ duration: 0.85, ease: [0.2, 0, 0, 1] }}
                onAnimationComplete={() => setWaves((list) => list.filter((wave) => wave !== id))}
              />
            ))}
          </AnimatePresence>

          {/* Success: burst of rays around the pill */}
          <AnimatePresence>
            {success && !reducedMotion ? (
              <motion.span key="burst" aria-hidden className={styles.burst()} exit={{ opacity: 0 }}>
                {RAYS.map((angle) => (
                  <motion.span
                    key={angle}
                    className={styles.ray()}
                    style={{
                      left: `${50 + Math.cos(angle) * 52}%`,
                      top: `${50 + Math.sin(angle) * 78}%`,
                      rotate: `${(angle * 180) / Math.PI}deg`,
                    }}
                    initial={{ opacity: 0, x: 0, y: 0, scaleX: 0.2 }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: Math.cos(angle) * 26,
                      y: Math.sin(angle) * 26,
                      scaleX: [0.2, 1, 0.4],
                    }}
                    transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
                  />
                ))}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.span>
      </motion.span>
      <VisuallyHidden.Root aria-live="polite">{loading || success ? labels[label] : ""}</VisuallyHidden.Root>
    </span>
  );
};
