"use client";

import { Archive, ArchiveRestore, ArrowLeft, Inbox as InboxIcon, Mail, MailOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/studio/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/studio/ui/tooltip";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { cn } from "@/lib/shared/cn";
import type { Conversation, ConversationSummary } from "@/lib/shared/contact/contact-schema";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { formatDateUtc } from "@/lib/shared/format";

/*
 * Inbox, the studio's chat module (docs/screens/STUDIO_INBOX_BUSINESS.md):
 * every contact-form conversation. The list (search, All / Unread / Archived)
 * on the left; the open conversation on the right, with mark read / unread,
 * archive / restore and reply by email. Opening an unread one marks it read.
 * Phones: the list, then the conversation with a back button.
 */

type Copy = StudioShellContent["inbox"];
type Filter = "all" | "unread" | "archived";

type InboxProps = {
  copy: Copy;
  title: string;
  description: string;
  initial: ConversationSummary[];
};

const ENTER =
  "animate-in fill-mode-both duration-500 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none";

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/** Up to two initials ("Ada Lovelace" → "AL"). */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const matchesFilter = (item: ConversationSummary, filter: Filter) =>
  filter === "archived" ? item.status === "archived" : item.status === "open" && (filter === "all" || item.unread);

const matchesQuery = (item: ConversationSummary, query: string) => {
  const needle = query.trim().toLowerCase();
  return (
    !needle || [item.name, item.email, item.topic, item.preview].some((value) => value.toLowerCase().includes(needle))
  );
};

const Avatar = ({ name, unread }: { name: string; unread?: boolean }) => (
  <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-aurora-indigo text-xs font-semibold text-primary-foreground">
    {initialsOf(name)}
    {unread ? (
      <span aria-hidden className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-primary" />
    ) : null}
  </span>
);

const When = ({ iso, className }: { iso: string; className?: string }) => {
  const label = useRelativeTime(iso);
  return (
    <time dateTime={iso} title={formatDateUtc(new Date(iso))} className={cn("tabular-nums", className)}>
      {label}
    </time>
  );
};

const Row = ({
  item,
  active,
  copy,
  onOpen,
}: {
  item: ConversationSummary;
  active: boolean;
  copy: Copy;
  onOpen: (id: string) => void;
}) => (
  <li>
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
        active ? "bg-primary/[0.07]" : "hover:bg-muted/70",
      )}
    >
      <Avatar name={item.name} unread={item.unread} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-sm", item.unread ? "font-semibold text-foreground" : "font-medium")}>
            {item.name}
          </span>
          <When iso={item.lastMessageAt} className="shrink-0 text-xs text-muted-foreground" />
        </span>
        <span className="truncate text-xs font-medium text-primary">{item.topic || copy.noTopic}</span>
        <span className={cn("line-clamp-1 text-xs", item.unread ? "text-foreground" : "text-muted-foreground")}>
          {item.preview}
        </span>
      </span>
    </button>
  </li>
);

const Thread = ({
  conversation,
  copy,
  busy,
  onBack,
  onToggleUnread,
  onToggleArchive,
}: {
  conversation: Conversation;
  copy: Copy;
  busy: boolean;
  onBack: () => void;
  onToggleUnread: () => void;
  onToggleArchive: () => void;
}) => {
  const archived = conversation.status === "archived";
  const subject = fill(copy.replySubject, { topic: conversation.topic || copy.noTopic });
  const actions = [
    {
      label: conversation.unread ? copy.markRead : copy.markUnread,
      Icon: conversation.unread ? MailOpen : Mail,
      run: onToggleUnread,
    },
    { label: archived ? copy.restore : copy.archive, Icon: archived ? ArchiveRestore : Archive, run: onToggleArchive },
  ];
  return (
    <article key={conversation.id} className={cn("flex min-h-0 flex-1 flex-col", ENTER)}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label={copy.back} className="lg:hidden">
            <ArrowLeft aria-hidden />
          </Button>
          <Avatar name={conversation.name} />
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-base font-semibold">{conversation.name}</h2>
            <a
              href={`mailto:${conversation.email}`}
              className="truncate font-code text-xs text-primary hover:underline"
            >
              {conversation.email}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {actions.map(({ label, Icon, run }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={run} disabled={busy} aria-label={label}>
                  <Icon aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-b border-border px-4 py-3 text-xs sm:px-5">
        <dt className="text-muted-foreground">{copy.topic}</dt>
        <dd className="font-medium">{conversation.topic || copy.noTopic}</dd>
        <dt className="text-muted-foreground">{copy.received}</dt>
        <dd className="font-code">{formatDateUtc(new Date(conversation.createdAt))}</dd>
        {conversation.page ? (
          <>
            <dt className="text-muted-foreground">{copy.page}</dt>
            <dd className="truncate font-code">{conversation.page}</dd>
          </>
        ) : null}
      </dl>

      <ol className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5">
        {conversation.messages.map((message, index) => {
          const owner = message.from === "owner";
          return (
            <li
              key={`${message.at}-${index}`}
              className={cn("flex max-w-[85%] flex-col gap-1", owner ? "items-end self-end" : "self-start")}
            >
              <span
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
                  owner ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground",
                )}
              >
                {message.body}
              </span>
              <span className="text-[0.6875rem] text-muted-foreground">
                {owner ? `${copy.you} · ` : null}
                <When iso={message.at} />
              </span>
            </li>
          );
        })}
      </ol>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:p-5">
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{copy.replyNote}</p>
        <Button asChild>
          <a href={`mailto:${conversation.email}?subject=${encodeURIComponent(subject)}`}>
            <Mail aria-hidden />
            {copy.replyByEmail}
          </a>
        </Button>
      </footer>
    </article>
  );
};

export const Inbox = ({ copy, title, description, initial }: InboxProps) => {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Conversation | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(
    () => ({
      all: items.filter((item) => matchesFilter(item, "all")).length,
      unread: items.filter((item) => matchesFilter(item, "unread")).length,
      archived: items.filter((item) => matchesFilter(item, "archived")).length,
    }),
    [items],
  );
  const shown = items.filter((item) => matchesFilter(item, filter) && matchesQuery(item, query));

  /** Applies a change on the server, updating the list and the open conversation; rolls back on failure. */
  const patch = async (id: string, changes: { unread?: boolean; status?: "open" | "archived" }, quiet = false) => {
    const before = items;
    const openBefore = open;
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...changes } : item)));
    setOpen((current) => (current?.id === id ? { ...current, ...changes } : current));
    setBusy(true);
    const response = await fetch(`/api/studio/messages/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(changes),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setItems(before);
      setOpen(openBefore);
      toast.error(copy.failed);
      return;
    }
    if (!quiet) {
      toast.success(copy.updated);
    }
  };

  const openConversation = async (id: string) => {
    const response = await fetch(`/api/studio/messages/${id}`).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { ok: boolean; data: Conversation } | null;
    if (!response?.ok || !body?.ok) {
      toast.error(copy.failed);
      return;
    }
    setOpen(body.data);
    if (body.data.unread) {
      await patch(id, { unread: false }, true);
    }
  };

  const filters: Filter[] = ["all", "unread", "archived"];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className={cn("flex flex-wrap items-end justify-between gap-3", ENTER)}>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {counts.unread > 0 ? (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
            {fill(copy.unreadCount, { n: counts.unread })}
          </span>
        ) : null}
      </header>

      <div
        className={cn(
          "grid min-h-[36rem] overflow-hidden rounded-2xl border border-border bg-card shadow-xs lg:h-[min(46rem,calc(100svh-12rem))] lg:grid-cols-[22rem_minmax(0,1fr)]",
          ENTER,
        )}
        style={{ animationDelay: "80ms" }}
      >
        {/* The list. */}
        <section className={cn("flex min-h-0 flex-col border-border lg:border-r", open && "hidden lg:flex")}>
          <div className="flex flex-col gap-3 border-b border-border p-3">
            <label className="relative block">
              <span className="sr-only">{copy.search}</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.search}
                className="h-9 w-full rounded-md border border-input bg-card pr-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              />
            </label>
            <div role="tablist" aria-label={title} className="flex gap-1 rounded-lg bg-muted p-1">
              {filters.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                    filter === key
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {copy.filters[key]}
                  <span className="text-muted-foreground tabular-nums">{counts[key]}</span>
                </button>
              ))}
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="m-auto max-w-xs p-6 text-center text-sm text-muted-foreground">
              {items.length === 0 ? copy.empty : copy.emptyFilter}
            </p>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
              {shown.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  active={open?.id === item.id}
                  copy={copy}
                  onOpen={(id) => void openConversation(id)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* The open conversation. */}
        <section className={cn("min-h-0 flex-col", open ? "flex" : "hidden lg:flex")}>
          {open ? (
            <Thread
              conversation={open}
              copy={copy}
              busy={busy}
              onBack={() => setOpen(null)}
              onToggleUnread={() => void patch(open.id, { unread: !open.unread })}
              onToggleArchive={() => void patch(open.id, { status: open.status === "archived" ? "open" : "archived" })}
            />
          ) : (
            <div className="m-auto flex flex-col items-center gap-3 p-8 text-center text-muted-foreground">
              <span className="grid size-14 place-items-center rounded-2xl bg-muted">
                <InboxIcon aria-hidden className="size-6" />
              </span>
              <p className="max-w-xs text-sm">{copy.selectPrompt}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
