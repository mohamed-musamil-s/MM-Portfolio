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

const WIDTH = { expanded: 260, collapsed: 72 } as const;

const LogoTile = ({ className }: { className?: string }) => (
  <motion.span
    aria-hidden
    className={cn(
      "grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary to-aurora-indigo text-primary-foreground shadow-lg shadow-primary/30 transition-opacity duration-150",
      className,
    )}
    initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
    animate={{ scale: 1, rotate: 0, opacity: 1 }}
    whileHover={{ rotate: -8, scale: 1.06 }}
    transition={{ type: "spring", stiffness: 380, damping: 18 }}
  >
    <Monogram dot="letter" className="w-5 text-primary-foreground" />
  </motion.span>
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
    <div className={cn("relative px-3 pt-3 pb-3", collapsed && "px-2.5")}>
      <span
        aria-hidden
        className="absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent"
      />
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
  const { reducedMotion } = useMotionTheme();

  return (
    <>
      <motion.aside
        className="sticky top-3 z-30 my-3 ml-3 hidden h-[calc(100svh-1.5rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-card bg-card/70 shadow-xl shadow-aurora-indigo/10 backdrop-blur-xl lg:flex"
        initial={false}
        animate={{ width: collapsed ? WIDTH.collapsed : WIDTH.expanded }}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
      >
        <div className="group/header relative flex h-16 shrink-0 items-center gap-3 px-4">
          <span
            aria-hidden
            className="absolute inset-x-4 bottom-0 h-px bg-linear-to-r from-transparent via-border to-transparent"
          />
          {collapsed ? (
            <div className="relative mx-auto grid size-9 place-items-center">
              <LogoTile className="group-focus-within/header:opacity-0 group-hover/header:opacity-0" />
              <ToggleButton
                content={content}
                className="absolute inset-0 size-9 opacity-0 group-focus-within/header:opacity-100 group-hover/header:opacity-100"
              />
            </div>
          ) : (
            <>
              <LogoTile />
              <motion.span
                className="truncate text-[0.9375rem] font-semibold tracking-tight"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {content.brand.name}
              </motion.span>
              <ToggleButton content={content} className="ml-auto" />
            </>
          )}
        </div>
        <SidebarBody content={content} collapsed={collapsed} />
      </motion.aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="flex w-72 flex-col gap-0 border-card bg-card/90 p-0 backdrop-blur-xl sm:max-w-72"
        >
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
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
