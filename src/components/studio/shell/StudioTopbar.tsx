"use client";

import { CalendarDays } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { MagicIcon } from "@/components/ui/MagicIcon";
import type { InboxSnapshot } from "@/lib/shared/contact/inbox-events";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { InboxBell } from "./InboxBell";
import { OwnerChip } from "./OwnerChip";
import { useSidebarState } from "./sidebar-state";
import { useActiveModule } from "./use-active-module";
import { useRipple } from "./use-ripple";

const EASE = [0.2, 0, 0, 1] as const;
/** Bottom hairline plus a soft shade over the page. */
const BOTTOM_SHADOW = "shadow-[0_1px_0_var(--studio-border),0_10px_24px_-20px_rgb(30_41_59/0.25)]";

const noopSubscribe = () => () => undefined;
const formatToday = () =>
  new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(),
  );

/** Today's date in the viewer's locale; rendered only in the browser (nothing on the server). */
const Today = () => {
  const today = useSyncExternalStore(noopSubscribe, formatToday, () => null);
  if (!today) {
    return null;
  }
  return (
    <span className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
      <CalendarDays aria-hidden className="size-4" />
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
      className="relative -ml-1 grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 lg:hidden"
    >
      <MagicIcon name="menu" size={20} state={mobileOpen ? "active" : "idle"} />
      {ripples}
    </button>
  );
};

/**
 * Clean, flush topbar: menu button (mobile), a one-line breadcrumb
 * (group / page, the page part rolls over when you pick another page),
 * today's date, the unread-messages bell and the account menu.
 */
export const StudioTopbar = ({ content, inbox }: { content: StudioShellContent; inbox: InboxSnapshot }) => {
  const active = useActiveModule();
  const group = active ? content.groups.find((item) => item.items.includes(active)) : undefined;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 shrink-0 animate-in items-center gap-3 bg-card/90 px-4 backdrop-blur-xl duration-500 ease-out fade-in slide-in-from-top-3 motion-reduce:animate-none sm:px-6 lg:px-8",
        BOTTOM_SHADOW,
      )}
    >
      <MenuButton content={content} />

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-2 text-sm">
          <li className="hidden shrink-0 text-muted-foreground sm:block">{group?.label ?? content.breadcrumbRoot}</li>
          <li aria-hidden className="hidden shrink-0 text-muted-foreground/40 sm:block">
            /
          </li>
          <li className="relative min-w-0 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              {active ? (
                <motion.span
                  key={active}
                  aria-current="page"
                  className="block truncate font-semibold text-foreground"
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                >
                  {content.modules[active].label}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </li>
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Today />
        <span aria-hidden className="hidden h-6 w-px bg-border md:block" />
        <InboxBell copy={content.inbox.bell} initial={inbox} />
        <OwnerChip content={content} />
      </div>
    </header>
  );
};
