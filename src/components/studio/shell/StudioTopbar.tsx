"use client";

import { Button } from "@/components/studio/ui/button";
import { MagicIcon } from "@/components/ui/MagicIcon";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { MODULE_ICONS } from "./nav";
import { OwnerChip } from "./OwnerChip";
import { useSidebarState } from "./sidebar-state";
import { useActiveModule } from "./use-active-module";

/** Sticky studio topbar: drawer button (mobile), breadcrumb, owner chip. */
export const StudioTopbar = ({ content }: { content: StudioShellContent }) => {
  const { mobileOpen, setMobileOpen } = useSidebarState();
  const active = useActiveModule();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="-ml-1 rounded-lg text-muted-foreground hover:text-foreground lg:hidden"
        aria-label={content.actions.openMenu}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <MagicIcon name="menu" size={18} state={mobileOpen ? "active" : "idle"} />
      </Button>

      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-2 text-sm">
          <li className="hidden text-muted-foreground sm:block">{content.breadcrumbRoot}</li>
          {active ? (
            <>
              <li aria-hidden className="hidden text-border sm:block">
                /
              </li>
              <li aria-current="page" className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                <MagicIcon name={MODULE_ICONS[active]} size={16} className="text-muted-foreground" />
                <span className="truncate">{content.modules[active].label}</span>
              </li>
            </>
          ) : null}
        </ol>
      </nav>

      <div className="ml-auto">
        <OwnerChip owner={content.owner} />
      </div>
    </header>
  );
};
