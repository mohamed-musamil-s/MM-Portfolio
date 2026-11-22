"use client";

import { LayoutGroup } from "motion/react";
import { useId } from "react";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
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

/** The grouped module links. Group labels turn into hairlines when the sidebar is collapsed. */
export const SidebarNav = ({ content, collapsed, onNavigate }: SidebarNavProps) => {
  const active = useActiveModule();
  const pillId = `studio-nav-pill-${useId()}`;

  return (
    <LayoutGroup id={pillId}>
      <nav aria-label={content.actions.navigation} className="flex flex-col gap-5">
        {content.groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <div className={cn("flex h-6 items-center px-2.5", collapsed && "justify-center px-0")}>
              {collapsed ? (
                <span aria-hidden className="h-px w-6 bg-border" />
              ) : (
                <span className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </span>
              )}
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((key) => (
                <li key={key}>
                  <NavRow
                    href={MODULE_ROUTES[key]}
                    label={content.modules[key].label}
                    icon={MODULE_ICONS[key]}
                    active={active === key}
                    pillId={pillId}
                    collapsed={collapsed}
                    onSelect={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </LayoutGroup>
  );
};
