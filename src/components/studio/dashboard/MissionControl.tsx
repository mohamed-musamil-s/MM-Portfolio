"use client";

import {
  ArrowUpRight,
  BarChart3,
  ExternalLink,
  FileText,
  Globe,
  Inbox,
  LayoutGrid,
  PenLine,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { cn } from "@/lib/shared/cn";
import type { ConversationSummary } from "@/lib/shared/contact/contact-schema";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { ROUTES } from "@/lib/shared/routes";

/*
 * Mission Control, the studio dashboard (docs/screens/STUDIO_MISSION_CONTROL_BUSINESS.md):
 * a greeting, four stat cards (site, unread messages, sections showing,
 * content), shortcuts into every module, and the latest messages. Each card
 * is one link. Everything rises in once, in sequence.
 */

type MissionControlProps = {
  shell: StudioShellContent;
  maintenance: boolean;
  unread: number;
  sectionsShowing: number;
  sectionsTotal: number;
  content: { version: number; updatedAt: string | null; updatedBy: string | null };
  recent: ConversationSummary[];
};

const ENTER =
  "animate-in fill-mode-both duration-500 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none";
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const CARD = "rounded-2xl border border-border bg-card shadow-xs transition-colors hover:border-primary/40";
const FOCUS = "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

const Stat = ({
  href,
  label,
  value,
  hint,
  Icon,
  tone = "default",
  order,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  Icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "primary";
  order: number;
}) => (
  <Link href={href} className={cn("group flex flex-col gap-3 p-5", CARD, FOCUS, ENTER)} style={delay(80 + order * 60)}>
    <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
      {label}
      <span
        className={cn(
          "grid size-8 place-items-center rounded-lg",
          tone === "success" && "bg-success/10 text-success",
          tone === "warning" && "bg-warning/10 text-warning",
          tone === "primary" && "bg-primary/10 text-primary",
          tone === "default" && "bg-muted text-muted-foreground",
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
    </span>
    <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
    <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
      {hint}
      <ArrowUpRight aria-hidden className="size-3.5" />
    </span>
  </Link>
);

const ContentHint = ({ template, iso, who }: { template: string; iso: string; who: string }) => {
  const time = useRelativeTime(iso);
  return <>{fill(template, { time, who })}</>;
};

const RecentRow = ({ item, noTopic }: { item: ConversationSummary; noTopic: string }) => {
  const when = useRelativeTime(item.lastMessageAt);
  return (
    <li>
      <Link
        href={ROUTES.studio.chat}
        className={cn("flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/70", FOCUS)}
      >
        <span
          aria-hidden
          className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.unread ? "bg-primary" : "bg-transparent")}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-sm", item.unread ? "font-semibold" : "font-medium")}>{item.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{when}</span>
          </span>
          <span className="truncate text-xs font-medium text-primary">{item.topic || noTopic}</span>
          <span className="line-clamp-1 text-xs text-muted-foreground">{item.preview}</span>
        </span>
      </Link>
    </li>
  );
};

export const MissionControl = ({
  shell,
  maintenance,
  unread,
  sectionsShowing,
  sectionsTotal,
  content,
  recent,
}: MissionControlProps) => {
  const copy = shell.missionControl;
  const shortcuts: {
    key: keyof typeof copy.shortcuts;
    href: string;
    Icon: LucideIcon;
    external?: boolean;
    soon?: boolean;
  }[] = [
    { key: "site", href: ROUTES.home, Icon: Globe, external: true },
    { key: "content", href: ROUTES.studio.content, Icon: PenLine },
    { key: "inbox", href: ROUTES.studio.chat, Icon: Inbox },
    { key: "launchpad", href: ROUTES.studio.release, Icon: Rocket },
    { key: "resume", href: ROUTES.studio.resume, Icon: FileText, soon: true },
    { key: "pulse", href: ROUTES.studio.analytics, Icon: BarChart3, soon: true },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={cn("text-3xl font-semibold tracking-tight", ENTER)}>
          {fill(copy.greeting, { name: shell.owner.name.split(" ")[0] ?? shell.owner.name })}
        </h1>
        <p className={cn("text-sm text-muted-foreground", ENTER)} style={delay(40)}>
          {copy.summary}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          order={0}
          href={ROUTES.studio.release}
          label={copy.stats.site}
          value={maintenance ? copy.stats.maintenance : copy.stats.live}
          hint={copy.stats.siteHint}
          Icon={Globe}
          tone={maintenance ? "warning" : "success"}
        />
        <Stat
          order={1}
          href={ROUTES.studio.chat}
          label={copy.stats.unread}
          value={String(unread)}
          hint={copy.stats.unreadHint}
          Icon={Inbox}
          tone={unread > 0 ? "primary" : "default"}
        />
        <Stat
          order={2}
          href={ROUTES.studio.release}
          label={copy.stats.sections}
          value={fill(copy.stats.sectionsValue, { n: sectionsShowing, total: sectionsTotal })}
          hint={copy.stats.sectionsHint}
          Icon={LayoutGrid}
        />
        <Link
          href={ROUTES.studio.content}
          className={cn("group flex flex-col gap-3 p-5", CARD, FOCUS, ENTER)}
          style={delay(80 + 3 * 60)}
        >
          <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            {copy.stats.content}
            <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
              <PenLine aria-hidden className="size-4" />
            </span>
          </span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {fill(copy.stats.contentValue, { n: content.version })}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
            {content.updatedAt && content.updatedBy ? (
              <ContentHint template={copy.stats.contentHint} iso={content.updatedAt} who={content.updatedBy} />
            ) : (
              copy.stats.never
            )}
            <ArrowUpRight aria-hidden className="size-3.5" />
          </span>
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className={cn("flex flex-col gap-3", ENTER)} style={delay(360)}>
          <h2 className="text-sm font-semibold">{copy.shortcutsTitle}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {shortcuts.map(({ key, href, Icon, external, soon }) => {
              const entry = copy.shortcuts[key];
              return (
                <li key={key}>
                  <Link
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className={cn("group flex h-full items-start gap-3 p-4", CARD, FOCUS)}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary to-aurora-indigo text-primary-foreground shadow-sm shadow-primary/30">
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {entry.label}
                        {soon ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.625rem] font-semibold text-muted-foreground">
                            {copy.soon}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs leading-snug text-muted-foreground">{entry.description}</span>
                    </span>
                    {external ? (
                      <ExternalLink aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ArrowUpRight
                        aria-hidden
                        className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs", ENTER)}
          style={delay(420)}
        >
          <header className="flex items-center justify-between px-2 pt-1">
            <h2 className="text-sm font-semibold">{copy.recentTitle}</h2>
            <Link
              href={ROUTES.studio.chat}
              className={cn("rounded text-xs font-medium text-primary hover:underline", FOCUS)}
            >
              {copy.viewAll}
            </Link>
          </header>
          {recent.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">{copy.recentEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {recent.map((item) => (
                <RecentRow key={item.id} item={item} noTopic={shell.inbox.noTopic} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
