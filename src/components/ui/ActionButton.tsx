"use client";

import { AnimatePresence, animate, motion, useMotionValue, type MotionValue, type Transition } from "motion/react";
import Link from "next/link";
import { VisuallyHidden } from "radix-ui";
import { useEffect, useId, type ReactNode } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { ActionStatus } from "@/lib/motion/action-machine";
import { SHAKE_KEYFRAMES, type ThemeMotion } from "@/lib/motion/tokens";
import { cn } from "@/lib/shared/cn";
import { MagicIcon, type IconName } from "./MagicIcon";
import { actionButton } from "./action-button/action-button.styles";
import type { ActionButtonProps, ActionButtonVariant, ActionMethod } from "./action-button/types";
import { useActionButton } from "./action-button/use-action-button";

export type { ActionButtonProps, ActionButtonTone, ActionButtonVariant, ActionMethod } from "./action-button/types";
export { ActionError } from "@/lib/motion/action-machine";

const MotionLink = motion.create(Link);

const DEFAULT_ICON: Partial<Record<ActionMethod, IconName>> = {
  navigate: "arrow-up-right",
  copy: "copy",
  toggle: "menu",
};

/** Indeterminate progress creeps toward 90% and only completes on success. */
const PROGRESS_CEILING = 0.9;
const PROGRESS_SECONDS = 2.4;
const PROGRESS_EASE = [0.1, 0.6, 0.3, 1] as const;
const NAVIGATE_NUDGE_PX = 3;
const SHAKE_SECONDS = 0.45;

type FillInput = {
  status: ActionStatus;
  method: ActionMethod;
  editorial: boolean;
  lit: boolean;
  holdMs: number;
  tokens: ThemeMotion;
};

/** Where the fill layer (ink wipe / progress bar / hold meter) should be, and how to get there. */
const fillTarget = ({ status, method, editorial, lit, holdMs, tokens }: FillInput): [number, Transition] => {
  const base: Transition = { duration: tokens.duration.base, ease: tokens.ease };
  switch (status) {
    case "arming":
      return [1, { duration: holdMs / 1000, ease: "linear" }];
    case "loading":
      return method === "submit" || method === "destructive"
        ? [PROGRESS_CEILING, { duration: PROGRESS_SECONDS, ease: PROGRESS_EASE }]
        : [editorial ? 1 : 0, base];
    case "success":
      return [1, { duration: tokens.duration.fast, ease: tokens.ease }];
    case "error":
      return [0, base];
    case "idle":
      return [editorial && lit ? 1 : 0, base];
  }
};

const useFill = (fill: MotionValue<number>, input: FillInput, reducedMotion: boolean) => {
  const [value, transition] = fillTarget(input);
  useEffect(() => {
    if (reducedMotion) {
      fill.set(value);
      return;
    }
    const controls = animate(fill, value, transition);
    return () => controls.stop();
    // `transition` is derived from the same inputs as `value`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fill, value, input.status, reducedMotion]);
};

const CORNERS = [
  { position: "-top-1.5 -left-1.5", offset: { x: -4, y: -4 } },
  { position: "-top-1.5 -right-1.5", offset: { x: 4, y: -4 } },
  { position: "-bottom-1.5 -left-1.5", offset: { x: -4, y: 4 } },
  { position: "-bottom-1.5 -right-1.5", offset: { x: 4, y: 4 } },
] as const;

/** Editorial registration marks that slide in and lock onto the corners. */
const CornerMarks = ({ engaged, className }: { engaged: boolean; className: string }) => (
  <>
    {CORNERS.map(({ position, offset }) => (
      <motion.svg
        key={position}
        aria-hidden
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        className={cn(className, position)}
        initial={false}
        animate={engaged ? { opacity: 1, x: 0, y: 0, scale: 1 } : { opacity: 0, ...offset, scale: 0.6 }}
      >
        <circle cx={5} cy={5} r={2.5} />
        <path d="M5 0V10M0 5H10" />
      </motion.svg>
    ))}
  </>
);

/**
 * One button for the whole app. It knows its action `method` and runs that
 * method's choreography; `variant` only changes the look:
 * `editorial-ink` (portfolio) or `studio-action` (studio). The default variant
 * follows the surrounding <MotionProvider theme>.
 */
export const ActionButton = (props: ActionButtonProps) => {
  const { theme, tokens, reducedMotion } = useMotionTheme();
  const variant: ActionButtonVariant = props.variant ?? (theme === "portfolio" ? "editorial-ink" : "studio-action");
  const editorial = variant === "editorial-ink";
  const behavior = useActionButton(props);
  // Solid pills stay put on hover: magnetism is only for the outline editorial button.
  const { anchorRef, x, y } = useMagnetic<HTMLSpanElement>(editorial && props.tone !== "solid" && !props.disabled);
  const fill = useMotionValue(0);
  const hintId = useId();
  const styles = actionButton({ variant, tone: props.tone ?? "outline", method: props.method });

  const { status, errorCode, pressed, hovering } = behavior;
  const icon = props.icon ?? DEFAULT_ICON[props.method];
  const lit = (hovering || pressed) && props.tone !== "solid";
  const showStatusIcon = !icon && (status === "loading" || status === "success" || status === "error");

  useFill(fill, { status, method: props.method, editorial, lit, holdMs: behavior.holdMs, tokens }, reducedMotion);

  const body: ReactNode = (
    <>
      <motion.span aria-hidden className={styles.fill()} style={{ scaleX: fill }} />
      <motion.span
        className={styles.content()}
        initial={false}
        animate={{ x: props.method === "navigate" && hovering ? NAVIGATE_NUDGE_PX : 0 }}
      >
        {icon ? <MagicIcon name={icon} state={behavior.iconState} size={16} /> : null}
        <span>{props.children}</span>
        <AnimatePresence initial={false}>
          {showStatusIcon ? (
            <motion.span
              key="status"
              className="inline-flex overflow-hidden"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
            >
              <MagicIcon name="status" state={behavior.iconState} size={16} />
            </motion.span>
          ) : null}
        </AnimatePresence>
        {status === "error" && errorCode !== undefined ? (
          <span aria-hidden className={styles.badge()}>
            {errorCode}
          </span>
        ) : null}
      </motion.span>
      {props.method === "navigate" && props.external ? <VisuallyHidden.Root> (opens in a new tab)</VisuallyHidden.Root> : null}
    </>
  );

  const rootProps = {
    className: styles.root({ class: props.className }),
    whileTap: props.disabled || reducedMotion ? undefined : { scale: tokens.pressScale },
    "data-method": props.method,
    "data-status": status,
    "data-pressed": pressed,
    ...behavior.handlers,
  };

  const root =
    props.method === "navigate" ? (
      props.external ? (
        <motion.a
          href={props.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={props.disabled || undefined}
          {...rootProps}
        >
          {body}
        </motion.a>
      ) : (
        <MotionLink href={props.href} aria-disabled={props.disabled || undefined} {...rootProps}>
          {body}
        </MotionLink>
      )
    ) : (
      <motion.button
        type={props.method === "submit" && !props.onAction ? "submit" : "button"}
        disabled={props.disabled}
        aria-pressed={props.method === "toggle" ? pressed : undefined}
        aria-busy={status === "loading" || undefined}
        aria-describedby={props.method === "destructive" ? hintId : undefined}
        {...rootProps}
        {...behavior.holdHandlers}
      >
        {body}
      </motion.button>
    );

  return (
    <span ref={anchorRef} className={styles.anchor()}>
      <motion.span
        className={cn(styles.shaker(), "relative")}
        initial={false}
        animate={{ x: status === "error" ? SHAKE_KEYFRAMES : 0 }}
        transition={{ duration: SHAKE_SECONDS }}
      >
        <motion.span className="relative inline-flex" style={{ x, y }}>
          {root}
          {editorial ? <CornerMarks engaged={lit || status !== "idle"} className={styles.corner()} /> : null}
          <AnimatePresence>
            {status === "success" && !editorial ? (
              <motion.span
                key="pulse"
                aria-hidden
                className={styles.pulse()}
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ opacity: 0, scale: 1.08 }}
                exit={{ opacity: 0 }}
                transition={{ duration: tokens.duration.slow * 2, ease: tokens.ease }}
              />
            ) : null}
          </AnimatePresence>
        </motion.span>
      </motion.span>
      {props.method === "destructive" ? (
        <VisuallyHidden.Root id={hintId}>Press and hold to confirm</VisuallyHidden.Root>
      ) : null}
      <VisuallyHidden.Root aria-live="polite">{behavior.liveMessage}</VisuallyHidden.Root>
    </span>
  );
};
