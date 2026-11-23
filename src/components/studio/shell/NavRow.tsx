"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/studio/ui/tooltip";
import { MagicIcon, type IconName } from "@/components/ui/MagicIcon";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import { useRipple } from "./use-ripple";

type NavRowProps = {
  label: string;
  icon: IconName;
  collapsed: boolean;
  /** Link rows: target route. Omit for a button row (e.g. sign out). */
  href?: string;
  active?: boolean;
  /** Shared id for the sliding edge bar; distinct per navigation instance (desktop vs drawer). */
  barId?: string;
  onSelect?: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
  trailing?: ReactNode;
};

const ROW =
  "group/row relative flex h-12 w-full items-center gap-3 rounded-xl px-1.5 text-left text-[0.9375rem] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60";
const BAR_SPRING = { type: "spring", stiffness: 520, damping: 38 } as const;

/**
 * One sidebar row: a 40px icon well with a 22px icon, then the label.
 *
 * - Active: tinted band, solid accent well with a white icon, and an accent
 *   bar on the sidebar's left edge that slides to the row you click.
 * - Click: a ripple from the pointer, a press, and the well pops when the row
 *   becomes active. Nothing loops.
 * - Hover: colour only (band tint, icon darkens, the icon's small hover pose);
 *   nothing changes size or position.
 */
export const NavRow = ({
  label,
  icon,
  collapsed,
  href,
  active = false,
  barId,
  onSelect,
  disabled,
  tone = "default",
  trailing,
}: NavRowProps) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const [hover, setHover] = useState(false);
  const { onPointerDown, ripples } = useRipple(tone === "danger" ? "bg-destructive/15" : undefined);

  const className = cn(
    ROW,
    "overflow-visible",
    collapsed && "justify-center gap-0 px-0",
    active
      ? "bg-primary/[0.07] font-semibold text-foreground"
      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
    tone === "danger" && "hover:bg-destructive/[0.06] hover:text-destructive",
  );

  const body = (
    <>
      {active && barId ? (
        <motion.span
          layoutId={barId}
          aria-hidden
          className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-linear-to-b from-primary to-aurora-indigo"
          transition={BAR_SPRING}
        />
      ) : null}
      <span className="relative overflow-hidden rounded-xl">
        <motion.span
          key={active ? "active" : "idle"}
          className={cn(
            "grid size-10 place-items-center rounded-xl transition-colors duration-200",
            active
              ? "bg-linear-to-br from-primary to-aurora-indigo text-primary-foreground shadow-md shadow-primary/30"
              : "text-muted-foreground group-hover/row:bg-card group-hover/row:text-foreground group-hover/row:shadow-xs",
            tone === "danger" && "group-hover/row:text-destructive",
          )}
          initial={active && !reducedMotion ? { scale: 0.78 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 16 }}
        >
          <MagicIcon name={icon} size={22} state={active ? "active" : hover ? "hover" : "idle"} />
        </motion.span>
      </span>
      <motion.span
        className={cn("min-w-0 truncate whitespace-nowrap", !collapsed && "flex-1")}
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
        transition={{ duration: tokens.duration.base, ease: tokens.ease }}
        aria-hidden={collapsed || undefined}
      >
        {label}
      </motion.span>
      {!collapsed && trailing}
      {ripples}
    </>
  );

  const shared = {
    className,
    "aria-label": collapsed ? label : undefined,
    onPointerDown,
    onPointerEnter: () => setHover(true),
    onPointerLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
  };
  const tap = reducedMotion ? undefined : { scale: 0.98 };

  const row = href ? (
    <motion.div whileTap={tap} className="relative w-full">
      <Link href={href} aria-current={active ? "page" : undefined} onClick={onSelect} {...shared}>
        {body}
      </Link>
    </motion.div>
  ) : (
    <motion.button type="button" whileTap={tap} onClick={onSelect} disabled={disabled} {...shared}>
      {body}
    </motion.button>
  );

  if (!collapsed) {
    return row;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={14}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
};
