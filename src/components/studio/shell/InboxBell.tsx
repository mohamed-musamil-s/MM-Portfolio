"use client";

import { ArrowRight, Bell } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/studio/ui/dropdown-menu";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { cn } from "@/lib/shared/cn";
import type { ConversationSummary } from "@/lib/shared/contact/contact-schema";
import { INBOX_CHANGED, toSnapshot, type InboxSnapshot } from "@/lib/shared/contact/inbox-events";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { ROUTES } from "@/lib/shared/routes";

/*
 * The topbar bell (docs/screens/STUDIO_INBOX_BUSINESS.md, §Bell): the number
 * of unread conversations on a badge, and a menu with the newest unread ones.
 * It refreshes after each page change, when the window regains focus, when
 * the Inbox changes a conversation, and once a minute while the tab is shown.
 */

type Copy = StudioShellContent["inbox"]["bell"];

const REFRESH_MS = 60_000;
const MAX_BADGE = 9;

const fill = (text: string, n: number) => text.replace("{n}", String(n));

/** The bell's view of the Inbox, read from the messages API; null when it can't be read. */
const loadSnapshot = async (): Promise<InboxSnapshot | null> => {
  const response = await fetch(ROUTES.api.studioMessages, { cache: "no-store" }).catch(() => null);
  const body = (await response?.json().catch(() => null)) as {
    ok: boolean;
    data: { conversations: ConversationSummary[] };
  } | null;
  return response?.ok && body?.ok ? toSnapshot(body.data.conversations) : null;
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const Row = ({ item }: { item: ConversationSummary }) => {
  const when = useRelativeTime(item.lastMessageAt);
  return (
    <DropdownMenuItem asChild className="cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5">
      <Link href={`${ROUTES.studio.chat}?open=${item.id}`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-aurora-indigo text-[0.6875rem] font-semibold text-primary-foreground">
          {initialsOf(item.name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{item.name}</span>
            <time
              dateTime={item.lastMessageAt}
              className="shrink-0 text-[0.6875rem] text-muted-foreground tabular-nums"
            >
              {when}
            </time>
          </span>
          {item.topic ? <span className="truncate text-xs font-medium text-primary">{item.topic}</span> : null}
          <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.preview}</span>
        </span>
      </Link>
    </DropdownMenuItem>
  );
};

export const InboxBell = ({ copy, initial }: { copy: Copy; initial: InboxSnapshot }) => {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [snapshot, setSnapshot] = useState(initial);
  const [rings, setRings] = useState(0);
  const lastCount = useRef(initial.unread);

  /** Takes a fresh snapshot; the bell swings once when the count went up (a new message). */
  const apply = useCallback((next: InboxSnapshot | null) => {
    if (!next) return;
    if (next.unread > lastCount.current) {
      setRings((value) => value + 1);
    }
    lastCount.current = next.unread;
    setSnapshot(next);
  }, []);

  const refresh = useCallback(() => void loadSnapshot().then(apply), [apply]);

  useEffect(() => {
    void loadSnapshot().then(apply);
  }, [pathname, apply]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onChange = () => refresh();
    const timer = window.setInterval(onVisible, REFRESH_MS);
    window.addEventListener("focus", onChange);
    window.addEventListener(INBOX_CHANGED, onChange);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onChange);
      window.removeEventListener(INBOX_CHANGED, onChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const { unread, recent } = snapshot;
  const badge = unread > MAX_BADGE ? `${MAX_BADGE}+` : String(unread);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={fill(copy.label, unread)}
        className="relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=open]:bg-muted data-[state=open]:text-foreground"
      >
        <motion.span
          key={rings}
          className="grid origin-top place-items-center"
          initial={rings > 0 && !reduceMotion ? { rotate: 0 } : false}
          animate={rings > 0 && !reduceMotion ? { rotate: [0, 16, -14, 9, -5, 0] } : undefined}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Bell aria-hidden className="size-5" />
        </motion.span>
        {unread > 0 ? (
          <span
            key={unread}
            aria-hidden
            className="text-white absolute top-0.5 right-0.5 grid h-4.5 min-w-4.5 animate-in place-items-center rounded-full bg-destructive px-1 text-[0.625rem] leading-none font-semibold tabular-nums ring-2 ring-card duration-300 zoom-in-50 motion-reduce:animate-none"
          >
            {badge}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] rounded-xl p-1.5">
        <div className="flex items-center justify-between gap-3 px-2 pt-1.5 pb-2">
          <p className="text-sm font-semibold text-foreground">{copy.title}</p>
          {unread > 0 ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-primary tabular-nums">
              {fill(copy.count, unread)}
            </span>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {recent.length > 0 ? (
          <div className="flex max-h-96 flex-col overflow-y-auto py-1">
            {recent.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <Bell aria-hidden className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer justify-center rounded-lg px-2 py-2 font-medium">
          <Link href={ROUTES.studio.chat} className={cn("text-primary")}>
            {copy.viewAll}
            <ArrowRight aria-hidden />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
