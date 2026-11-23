"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { MagicIcon } from "@/components/ui/MagicIcon";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { MODULE_ICONS } from "./nav";
import { OwnerChip } from "./OwnerChip";
import { useSidebarState } from "./sidebar-state";
import { useActiveModule } from "./use-active-module";
import { useRipple } from "./use-ripple";

const EASE = [0.2, 0, 0, 1] as const;
/** Bottom hairline plus a soft shade over the page. */
const BOTTOM_SHADOW = "shadow-[0_1px_0_var(--studio-border),0_12px_28px_-20px_rgb(30_41_59/0.25)]";

const noopSubscribe = () => () => undefined;
const formatToday = () =>
  new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(new Date());

/** Today's date in the viewer's locale; rendered only in the browser (nothing on the server). */
const TodayChip = () => {
  const today = useSyncExternalStore(noopSubscribe, formatToday, () => null);
  if (!today) {
    return null;
  }
  return (
    <span className="hidden items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground md:flex">
      <span className="size-1.5 rounded-full bg-primary" />
      {today}
    </span>
  );
};

const MenuButton = ({ content }: { content: StudioShellContent }) => {
  const { mobileOpen, setMobileOpen } = useSidebarState();
  const { onPointerDown, ripples } = useRipple();
  return (
    <button
      type="button"
      aria-label={content.actions.openMenu}
      aria-expanded={mobileOpen}
      onClick={() => setMobileOpen(true)}
      onPointerDown={onPointerDown}
      className="relative grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors duration-200 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 lg:hidden"
    >
      <MagicIcon name="menu" size={22} state={mobileOpen ? "active" : "idle"} />
      {ripples}
    </button>
  );
};

/**
 * Flush, full-width topbar with a bottom shade: menu button (mobile), the
 * current page as a title with its group above it (rolls over when you pick
 * another page), today's date and the owner. Enters once on first load.
 */
export const StudioTopbar = ({ content }: { content: StudioShellContent }) => {
  const active = useActiveModule();
  const group = active ? content.groups.find((item) => item.items.includes(active)) : undefined;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-[72px] shrink-0 animate-in items-center gap-4 bg-card/85 px-4 backdrop-blur-xl duration-500 ease-out fade-in slide-in-from-top-3 motion-reduce:animate-none sm:px-6 lg:px-8",
        BOTTOM_SHADOW,
      )}
    >
      <MenuButton content={content} />

      <nav aria-label="Breadcrumb" className="min-w-0">
        <AnimatePresence mode="popLayout" initial={false}>
          {active ? (
            <motion.ol
              key={active}
              className="flex items-center gap-3"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <li
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
              >
                <MagicIcon name={MODULE_ICONS[active]} size={20} state="active" />
              </li>
              <li className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-xs text-muted-foreground">
                  {content.breadcrumbRoot}
                  {group ? ` / ${group.label}` : null}
                </span>
                <span aria-current="page" className="truncate text-base font-semibold text-foreground">
                  {content.modules[active].label}
                </span>
              </li>
            </motion.ol>
          ) : null}
        </AnimatePresence>
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <TodayChip />
        <span aria-hidden className="hidden h-8 w-px bg-border md:block" />
        <OwnerChip owner={content.owner} />
      </div>
    </header>
  );
};
