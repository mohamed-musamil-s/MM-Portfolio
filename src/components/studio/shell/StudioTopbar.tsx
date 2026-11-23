"use client";

import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/studio/ui/button";
import { MagicIcon } from "@/components/ui/MagicIcon";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { MODULE_ICONS } from "./nav";
import { OwnerChip } from "./OwnerChip";
import { useSidebarState } from "./sidebar-state";
import { useActiveModule } from "./use-active-module";

const EASE = [0.2, 0, 0, 1] as const;

/**
 * Floating glass topbar: drawer button (mobile), an animated breadcrumb (the
 * page name and icon roll over when the page changes) and the owner chip.
 */
export const StudioTopbar = ({ content }: { content: StudioShellContent }) => {
  const { mobileOpen, setMobileOpen } = useSidebarState();
  const active = useActiveModule();

  return (
    <motion.header
      className="sticky top-2 z-20 mx-2 mt-2 flex h-16 shrink-0 items-center gap-3 rounded-2xl border border-card bg-card/70 px-3 shadow-lg shadow-aurora-indigo/5 backdrop-blur-xl sm:px-4 lg:top-3 lg:mx-3 lg:mt-3 lg:ml-0"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-xl text-muted-foreground hover:text-foreground lg:hidden"
        aria-label={content.actions.openMenu}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <MagicIcon name="menu" size={20} state={mobileOpen ? "active" : "idle"} />
      </Button>

      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-2.5 text-sm">
          <li className="hidden text-muted-foreground sm:block">{content.breadcrumbRoot}</li>
          {active ? (
            <>
              <li aria-hidden className="hidden text-muted-foreground/50 sm:block">
                /
              </li>
              <li aria-current="page" className="relative min-w-0 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={active}
                    className="flex items-center gap-2 font-semibold text-foreground"
                    initial={{ y: 18, opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -18, opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                      <MagicIcon name={MODULE_ICONS[active]} size={15} state="active" />
                    </span>
                    <span className="truncate">{content.modules[active].label}</span>
                  </motion.span>
                </AnimatePresence>
              </li>
            </>
          ) : null}
        </ol>
      </nav>

      <div className="ml-auto">
        <OwnerChip owner={content.owner} />
      </div>
    </motion.header>
  );
};
