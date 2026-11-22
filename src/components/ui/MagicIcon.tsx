"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { cn } from "@/lib/shared/cn";
import { ICON_SHAKE } from "./magic-icon/geometry";
import { IconContext } from "./magic-icon/icon-context";
import { ICONS } from "./magic-icon/icons";
import type { IconName, IconState } from "./magic-icon/types";

export type { IconName, IconState } from "./magic-icon/types";
export { ICON_NAMES } from "./magic-icon/types";

type MagicIconProps = {
  name: IconName;
  /** Driven by the parent control; see IconState. */
  state?: IconState;
  /** Rendered size in px (the icon is drawn on a 24-unit grid). */
  size?: number;
  strokeWidth?: number;
  /** Accessible name. Omit for decorative icons next to a visible label. */
  label?: string;
  /** Strokes draw themselves in on mount. */
  drawOnMount?: boolean;
  className?: string;
};

const SHAKE_SECONDS = 0.45;

/**
 * The only icon component in the app. Inline SVG in currentColor, so it
 * follows the surrounding text colour on either surface. On `error` it shakes
 * and switches to `--icon-error` (studio: danger red; portfolio: unchanged ink).
 */
export const MagicIcon = ({
  name,
  state = "idle",
  size = 20,
  strokeWidth = 1.5,
  label,
  drawOnMount = true,
  className,
}: MagicIconProps) => {
  const Icon = ICONS[name];
  const context = useMemo(() => ({ state, drawOnMount }), [state, drawOnMount]);

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-icon={name}
      data-state={state}
      className={cn(
        "shrink-0 overflow-visible transition-colors duration-150 data-[state=error]:text-(--icon-error)",
        className,
      )}
    >
      <IconContext value={context}>
        <motion.g
          initial={false}
          animate={{ x: state === "error" ? ICON_SHAKE : 0 }}
          transition={{ duration: SHAKE_SECONDS }}
        >
          <Icon />
        </motion.g>
      </IconContext>
    </svg>
  );
};
