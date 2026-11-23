"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useId, useState } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { StudioModule, StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { MODULE_ICONS, MODULE_ROUTES } from "./nav";
import { NavRow } from "./NavRow";
import { useActiveModule } from "./use-active-module";

type SidebarNavProps = {
  content: StudioShellContent;
  collapsed: boolean;
  /** Called after choosing a page (the mobile drawer closes itself). */
  onNavigate?: () => void;
};

const EASE = [0.2, 0, 0, 1] as const;

/**
 * The grouped module links. Rows cascade in on mount; one hover highlight
 * glides between rows; the active pill springs to the current page. Group
 * labels turn into hairlines when the sidebar is collapsed.
 */
export const SidebarNav = ({ content, collapsed, onNavigate }: SidebarNavProps) => {
  const active = useActiveModule();
  const { reducedMotion } = useMotionTheme();
  const [hovered, setHovered] = useState<StudioModule | null>(null);
  const id = useId();
  let order = 0;

  return (
    <LayoutGroup id={`studio-nav-${id}`}>
      <nav
        aria-label={content.actions.navigation}
        className="flex flex-col gap-5"
        onPointerLeave={() => setHovered(null)}
      >
        {content.groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <div className={cn("flex h-6 items-center px-3", collapsed && "justify-center px-0")}>
              <AnimatePresence mode="wait" initial={false}>
                {collapsed ? (
                  <motion.span
                    key="rule"
                    aria-hidden
                    className="h-px w-6 bg-border"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                  />
                ) : (
                  <motion.span
                    key="label"
                    className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {group.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <ul className="flex flex-col gap-1">
              {group.items.map((key) => {
                const index = order++;
                return (
                  <motion.li
                    key={key}
                    initial={reducedMotion ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.08 + index * 0.05 }}
                  >
                    <NavRow
                      href={MODULE_ROUTES[key]}
                      label={content.modules[key].label}
                      icon={MODULE_ICONS[key]}
                      active={active === key}
                      hovered={hovered === key}
                      pillId={`${id}-active`}
                      hoverId={`${id}-hover`}
                      onHoverChange={(on) => setHovered(on ? key : null)}
                      collapsed={collapsed}
                      onSelect={onNavigate}
                    />
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </LayoutGroup>
  );
};
