"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/studio/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/studio/ui/tooltip";
import { MagicIcon } from "@/components/ui/MagicIcon";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { SidebarNav } from "./SidebarNav";
import { useSidebarState } from "./sidebar-state";
import { SignOutRow } from "./SignOutRow";
import { useRipple } from "./use-ripple";

const WIDTH = { expanded: 288, collapsed: 88 } as const;
/** Right-edge hairline plus a soft shade that falls onto the canvas. */
const EDGE_SHADOW = "shadow-[1px_0_0_var(--studio-border),12px_0_32px_-18px_rgb(30_41_59/0.22)]";

/** The monogram on its own (no tile behind it), in the foreground colour. */
const LogoTile = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={cn("grid h-10 w-14 shrink-0 place-items-center transition-opacity duration-150", className)}
  >
    <Monogram dot="letter" className="w-14 text-foreground" />
  </span>
);

/** Collapse / expand. The panel icon's "active" pose means collapsed (chevron points out). */
const ToggleButton = ({ content, className }: { content: StudioShellContent; className?: string }) => {
  const { collapsed, toggleCollapsed } = useSidebarState();
  const [hover, setHover] = useState(false);
  const { onPointerDown, ripples } = useRipple();
  const label = collapsed ? content.actions.expand : content.actions.collapse;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-expanded={!collapsed}
          onClick={toggleCollapsed}
          onPointerDown={onPointerDown}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          className={cn(
            "relative grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors duration-200 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
            className,
          )}
        >
          <MagicIcon name="panel" size={22} state={collapsed ? "active" : hover ? "hover" : "idle"} />
          {ripples}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={14}>
        {label} <span className="ml-1.5 opacity-60">{content.actions.shortcut}</span>
      </TooltipContent>
    </Tooltip>
  );
};

const Brand = ({ content }: { content: StudioShellContent }) => (
  <span className="flex min-w-0 flex-col leading-tight">
    <span className="truncate text-base font-semibold tracking-tight text-foreground">{content.brand.name}</span>
    <span className="truncate text-xs text-muted-foreground">{content.brand.tagline}</span>
  </span>
);

const SidebarBody = ({
  content,
  collapsed,
  onNavigate,
}: {
  content: StudioShellContent;
  collapsed: boolean;
  onNavigate?: () => void;
}) => (
  <>
    <div className={cn("flex-1 overflow-x-hidden overflow-y-auto px-3 py-6", collapsed && "px-4")}>
      <SidebarNav content={content} collapsed={collapsed} onNavigate={onNavigate} />
    </div>
    <div className={cn("border-t border-border px-3 py-3", collapsed && "px-4")}>
      <SignOutRow label={content.actions.signOut} pendingLabel={content.actions.signingOut} collapsed={collapsed} />
    </div>
  </>
);

/**
 * Studio side navigation (docs/components/STUDIO_SHELL_BUSINESS.md §3):
 * a flush, full-height white column with an edge shade from `lg` (width
 * springs when collapsing), and the same navigation in a left drawer below.
 */
export const StudioSidebar = ({ content }: { content: StudioShellContent }) => {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarState();
  const { reducedMotion } = useMotionTheme();

  return (
    <>
      <motion.aside
        className={cn(
          "sticky top-0 z-30 hidden h-svh shrink-0 animate-in flex-col overflow-hidden bg-card duration-500 ease-out fade-in slide-in-from-left-6 motion-reduce:animate-none lg:flex",
          EDGE_SHADOW,
        )}
        initial={false}
        animate={{ width: collapsed ? WIDTH.collapsed : WIDTH.expanded }}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32 }}
      >
        <div className="group/header relative flex h-[72px] shrink-0 items-center gap-3 border-b border-border px-6">
          {collapsed ? (
            <div className="relative mx-auto grid h-10 w-14 place-items-center">
              <LogoTile className="group-focus-within/header:opacity-0 group-hover/header:opacity-0" />
              <ToggleButton
                content={content}
                className="absolute inset-0 opacity-0 group-focus-within/header:opacity-100 group-hover/header:opacity-100"
              />
            </div>
          ) : (
            <>
              <LogoTile />
              <Brand content={content} />
              <ToggleButton content={content} className="-mr-2 ml-auto" />
            </>
          )}
        </div>
        <SidebarBody content={content} collapsed={collapsed} />
      </motion.aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-[300px] flex-col gap-0 border-0 p-0 shadow-2xl sm:max-w-[300px]">
          <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-border px-6">
            <LogoTile />
            <span className="flex min-w-0 flex-col leading-tight">
              <SheetTitle className="truncate text-base font-semibold tracking-tight">{content.brand.name}</SheetTitle>
              <SheetDescription className="truncate text-xs">{content.brand.tagline}</SheetDescription>
            </span>
          </div>
          <SidebarBody content={content} collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};
