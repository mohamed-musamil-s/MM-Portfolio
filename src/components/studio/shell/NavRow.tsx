"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/studio/ui/tooltip";
import { MagicIcon, type IconName } from "@/components/ui/MagicIcon";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

type NavRowProps = {
  label: string;
  icon: IconName;
  collapsed: boolean;
  /** Link rows: target route. Omit for a button row (e.g. sign out). */
  href?: string;
  active?: boolean;
  /** This row currently owns the gliding hover highlight. */
  hovered?: boolean;
  /** Ids for the shared pills; distinct per navigation instance (desktop vs drawer). */
  pillId?: string;
  hoverId?: string;
  onHoverChange?: (hovered: boolean) => void;
  onSelect?: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
  trailing?: ReactNode;
};

const ROW =
  "group/row relative isolate flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60";
const PILL_SPRING = { type: "spring", stiffness: 460, damping: 34 } as const;

/**
 * One sidebar row. The active row sits on a gradient pill that springs
 * between rows; a soft glass highlight glides to whichever row the pointer is
 * on; the icon plays its hover / active pose; the row presses in on tap.
 * Collapsed rows show only the icon and reveal the label in a tooltip.
 */
export const NavRow = ({
  label,
  icon,
  collapsed,
  href,
  active = false,
  hovered = false,
  pillId,
  hoverId,
  onHoverChange,
  onSelect,
  disabled,
  tone = "default",
  trailing,
}: NavRowProps) => {
  const { tokens, reducedMotion } = useMotionTheme();
  const engage = {
    onPointerEnter: () => onHoverChange?.(true),
    onPointerLeave: () => onHoverChange?.(false),
    onFocus: () => onHoverChange?.(true),
    onBlur: () => onHoverChange?.(false),
  };
  const className = cn(
    ROW,
    collapsed && "justify-center gap-0 px-0",
    active ? "font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground",
    tone === "danger" && !active && "hover:text-destructive",
  );

  const body = (
    <>
      {active && pillId ? (
        <motion.span
          layoutId={pillId}
          aria-hidden
          className="absolute inset-0 -z-10 rounded-xl bg-linear-to-r from-primary to-aurora-indigo shadow-lg shadow-primary/30"
          transition={PILL_SPRING}
        >
          {/* A light sweep across the active pill */}
          <span className="absolute inset-0 overflow-hidden rounded-xl">
            <span className="absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-linear-to-r from-transparent via-card/25 to-transparent motion-reduce:hidden" />
          </span>
        </motion.span>
      ) : null}
      <AnimatePresence>
        {hovered && !active ? (
          <motion.span
            layoutId={hoverId}
            aria-hidden
            className={cn(
              "absolute inset-0 -z-20 rounded-xl border border-card bg-card/80 shadow-sm",
              tone === "danger" && "border-destructive/15 bg-destructive-surface",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={PILL_SPRING}
          />
        ) : null}
      </AnimatePresence>
      <motion.span
        className="grid shrink-0 place-items-center"
        animate={
          reducedMotion ? undefined : { scale: hovered && !active ? 1.12 : 1, rotate: hovered && !active ? -4 : 0 }
        }
        transition={PILL_SPRING}
      >
        <MagicIcon name={icon} size={18} state={active ? "active" : hovered ? "hover" : "idle"} />
      </motion.span>
      <motion.span
        className={cn("min-w-0 truncate whitespace-nowrap", !collapsed && "flex-1")}
        initial={false}
        animate={{
          opacity: collapsed ? 0 : 1,
          width: collapsed ? 0 : "auto",
          x: collapsed ? -6 : hovered && !active ? 2 : 0,
        }}
        transition={{ duration: tokens.duration.base, ease: tokens.ease }}
        aria-hidden={collapsed || undefined}
      >
        {label}
      </motion.span>
      {!collapsed && trailing}
    </>
  );

  const tap = reducedMotion ? undefined : { scale: 0.97 };
  const row = href ? (
    <motion.div whileTap={tap} className="w-full">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? label : undefined}
        className={className}
        onClick={onSelect}
        {...engage}
      >
        {body}
      </Link>
    </motion.div>
  ) : (
    <motion.button
      type="button"
      whileTap={tap}
      aria-label={collapsed ? label : undefined}
      className={className}
      onClick={onSelect}
      disabled={disabled}
      {...engage}
    >
      {body}
    </motion.button>
  );

  if (!collapsed) {
    return row;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
};
