"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { Button } from "@/components/studio/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/studio/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/studio/ui/tooltip";
import { MagicIcon } from "@/components/ui/MagicIcon";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { SidebarNav } from "./SidebarNav";
import { useSidebarState } from "./sidebar-state";
import { SignOutRow } from "./SignOutRow";

const WIDTH = { expanded: 256, collapsed: 68 } as const;

const LogoTile = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={cn(
      "grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-card shadow-sm transition-opacity duration-150",
      className,
    )}
  >
    <Monogram dot="letter" className="w-5 text-card" />
  </span>
);

/** Collapse / expand button; the icon's "active" pose means collapsed (chevron points out). */
const ToggleButton = ({ content, className }: { content: StudioShellContent; className?: string }) => {
  const { collapsed, toggleCollapsed } = useSidebarState();
  const [hover, setHover] = useState(false);
  const label = collapsed ? content.actions.expand : content.actions.collapse;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-expanded={!collapsed}
          onClick={toggleCollapsed}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          className={cn("rounded-lg text-muted-foreground hover:text-foreground", className)}
        >
          <MagicIcon name="panel" size={18} state={collapsed ? "active" : hover ? "hover" : "idle"} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label} <span className="ml-1.5 opacity-60">{content.actions.shortcut}</span>
      </TooltipContent>
    </Tooltip>
  );
};

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
    <div className={cn("flex-1 overflow-x-hidden overflow-y-auto px-3 py-4", collapsed && "px-2.5")}>
      <SidebarNav content={content} collapsed={collapsed} onNavigate={onNavigate} />
    </div>
    <div className={cn("border-t border-border px-3 py-3", collapsed && "px-2.5")}>
      <SignOutRow label={content.actions.signOut} pendingLabel={content.actions.signingOut} collapsed={collapsed} />
    </div>
  </>
);

/**
 * Studio side navigation (docs/components/STUDIO_SHELL_BUSINESS.md §3):
 * a collapsible column from `lg`, and the same navigation in a left drawer
 * below it.
 */
export const StudioSidebar = ({ content }: { content: StudioShellContent }) => {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarState();
  const { tokens, reducedMotion } = useMotionTheme();

  return (
    <>
      <motion.aside
        className="sticky top-0 z-30 hidden h-svh shrink-0 flex-col overflow-hidden border-r border-border bg-card lg:flex"
        initial={false}
        animate={{ width: collapsed ? WIDTH.collapsed : WIDTH.expanded }}
        transition={reducedMotion ? { duration: 0 } : { duration: tokens.duration.slow, ease: tokens.ease }}
      >
        <div className="group/header relative flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-3.5">
          {collapsed ? (
            <div className="relative mx-auto grid size-8 place-items-center">
              <LogoTile className="group-focus-within/header:opacity-0 group-hover/header:opacity-0" />
              <ToggleButton
                content={content}
                className="absolute inset-0 size-8 opacity-0 group-focus-within/header:opacity-100 group-hover/header:opacity-100"
              />
            </div>
          ) : (
            <>
              <LogoTile />
              <span className="truncate text-sm font-semibold tracking-tight">{content.brand.name}</span>
              <ToggleButton content={content} className="ml-auto" />
            </>
          )}
        </div>
        <SidebarBody content={content} collapsed={collapsed} />
      </motion.aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0 sm:max-w-72">
          <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
            <LogoTile />
            <SheetTitle className="text-sm font-semibold tracking-tight">{content.brand.name}</SheetTitle>
            <SheetDescription className="sr-only">{content.actions.navigation}</SheetDescription>
          </div>
          <SidebarBody content={content} collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};
