"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
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
  /** Shared id for the sliding active pill; distinct per navigation instance (desktop vs drawer). */
  pillId?: string;
  onSelect?: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
  trailing?: ReactNode;
};

const ROW =
  "group/row relative flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-left text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60";

/**
 * One sidebar row: animated icon + label. The active row sits on a grey pill
 * that slides between rows; collapsed rows show only the icon and reveal the
 * label in a tooltip on the right.
 */
export const NavRow = ({
  label,
  icon,
  collapsed,
  href,
  active = false,
  pillId,
  onSelect,
  disabled,
  tone = "default",
  trailing,
}: NavRowProps) => {
  const { tokens } = useMotionTheme();
  const [hover, setHover] = useState(false);
  const engage = {
    onPointerEnter: () => setHover(true),
    onPointerLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
  };
  const className = cn(
    ROW,
    collapsed && "justify-center gap-0 px-0",
    active ? "font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    tone === "danger" && "hover:bg-destructive/8 hover:text-destructive",
  );

  const body = (
    <>
      {active && pillId ? (
        <motion.span
          layoutId={pillId}
          aria-hidden
          className="absolute inset-0 -z-10 rounded-lg bg-muted"
          transition={{ type: "spring", stiffness: 520, damping: 40 }}
        />
      ) : null}
      <MagicIcon
        name={icon}
        size={18}
        state={active ? "active" : hover ? "hover" : "idle"}
        className={cn(active && "text-primary")}
      />
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
    </>
  );

  const row = href ? (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(className, "isolate")}
      onClick={onSelect}
      {...engage}
    >
      {body}
    </Link>
  ) : (
    <button
      type="button"
      aria-label={collapsed ? label : undefined}
      className={cn(className, "isolate")}
      onClick={onSelect}
      disabled={disabled}
      {...engage}
    >
      {body}
    </button>
  );

  if (!collapsed) {
    return row;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
};
