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

/**
 * Grouped module links. Rows fade and slide in once on first load (shadcn /
 * tw-animate-css); after that the only motion is the edge bar sliding to the
 * row you click. Group labels become hairlines when collapsed.
 */
export const SidebarNav = ({ content, collapsed, onNavigate }: SidebarNavProps) => {
  const active = useActiveModule();
  const id = useId();
  const rows = content.groups.flatMap((group) => group.items);

  return (
    <LayoutGroup id={`studio-nav-${id}`}>
      <nav aria-label={content.actions.navigation} className="flex flex-col gap-6">
        {content.groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1.5">
            <div className={cn("flex h-5 items-center px-2", collapsed && "justify-center px-0")}>
              {collapsed ? (
                <span aria-hidden className="h-px w-7 bg-border" />
              ) : (
                <span className="text-[0.6875rem] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
                  {group.label}
                </span>
              )}
            </div>
            <ul className="flex flex-col gap-1">
              {group.items.map((key) => (
                <li
                  key={key}
                  className="animate-in duration-500 ease-out fill-mode-both fade-in slide-in-from-left-3 motion-reduce:animate-none"
                  style={{ animationDelay: `${120 + rows.indexOf(key) * 55}ms` }}
                >
                  <NavRow
                    href={MODULE_ROUTES[key]}
                    label={content.modules[key].label}
                    icon={MODULE_ICONS[key]}
                    active={active === key}
                    barId={`${id}-bar`}
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
