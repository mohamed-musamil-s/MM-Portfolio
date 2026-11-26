"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Globe,
  Inbox,
  LayoutGrid,
  MessageSquare,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { TrafficChart } from "@/components/studio/pulse/TrafficChart";
import { Button } from "@/components/studio/ui/button";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import type { PulseResult } from "@/lib/server/analytics/vercel-analytics";
import { cn } from "@/lib/shared/cn";
import type { ConversationSummary } from "@/lib/shared/contact/contact-schema";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { percentChange } from "@/lib/shared/format";
import { ROUTES } from "@/lib/shared/routes";

/*
 * Mission Control, the studio dashboard (docs/screens/STUDIO_MISSION_CONTROL_BUSINESS.md):
 * - a command banner: greeting, what needs a look, quick actions and three
 *   status chips (site, unread, sections);
 * - traffic for the last 7 days (Pulse) and a health check;
 * - recent activity (content saves and messages) and the newest messages.
 * Everything rises in once, in sequence.
 */

export type Activity =
  | { kind: "save"; at: string; who: string; screen: string; version: number }
  | { kind: "message"; at: string; name: string; id: string };

export type HealthChecks = { live: boolean; sections: boolean; analytics: boolean; inbox: boolean; fresh: boolean };

type MissionControlProps = {
  shell: StudioShellContent;
  maintenance: boolean;
  unread: number;
  sectionsShowing: number;
  sectionsTotal: number;
  traffic: PulseResult;
  checks: HealthChecks;
  activity: Activity[];
  recent: ConversationSummary[];
};

type Copy = StudioShellContent["missionControl"];

const ENTER =
  "animate-in fill-mode-both duration-500 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none";
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });
const FOCUS = "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";
const NUMBER = new Intl.NumberFormat("en");

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/** "All clear", "1 thing needs a look" or "{n} things need a look". */
const attentionLine = (copy: Copy, open: number) =>
  open === 0 ? copy.allClear : open === 1 ? copy.attentionOne : fill(copy.attention, { n: open });

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const noopSubscribe = () => () => undefined;
const formatToday = () =>
  new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(new Date());

/** Today's date in the viewer's locale, browser only. */
const Today = () => {
  const today = useSyncExternalStore(noopSubscribe, formatToday, () => null);
  return <span className="min-h-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">{today}</span>;
};

const When = ({ iso }: { iso: string }) => {
  const label = useRelativeTime(iso);
  return (
    <time dateTime={iso} className="shrink-0 text-[0.6875rem] text-muted-foreground tabular-nums">
      {label}
    </time>
  );
};

const Card = ({ className, order, children }: { className?: string; order: number; children: ReactNode }) => (
  <section
    className={cn("flex flex-col rounded-2xl border border-border bg-card shadow-xs", ENTER, className)}
    style={delay(80 + order * 70)}
  >
    {children}
  </section>
);

const CardHeader = ({ title, Icon, action }: { title: string; Icon: LucideIcon; action?: ReactNode }) => (
  <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
    <h2 className="flex items-center gap-2 text-sm font-semibold">
      <Icon aria-hidden className="size-4 text-primary" />
      {title}
    </h2>
    {action}
  </header>
);

const TextLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-1 rounded-md text-xs font-medium text-primary transition-colors hover:text-primary/80",
      FOCUS,
    )}
  >
    {children}
    <ArrowRight aria-hidden className="size-3.5" />
  </Link>
);

const StatusChip = ({
  href,
  label,
  value,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  tone: "success" | "warning" | "primary" | "muted";
}) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-2 rounded-full border border-border bg-card/80 py-1.5 pr-3 pl-2.5 text-xs backdrop-blur transition-colors hover:border-primary/40",
      FOCUS,
    )}
  >
    <span
      aria-hidden
      className={cn(
        "size-2 rounded-full",
        tone === "success" && "bg-success",
        tone === "warning" && "bg-warning",
        tone === "primary" && "bg-primary",
        tone === "muted" && "bg-muted-foreground/40",
      )}
    />
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground tabular-nums">{value}</span>
  </Link>
);

const Traffic = ({ copy, pulse, result }: { copy: Copy; pulse: StudioShellContent["pulse"]; result: PulseResult }) => {
  const badge = result.environment === "production" ? pulse.environment.production : pulse.environment.preview;
  return (
    <Card order={1} className="lg:col-span-2">
      <CardHeader
        title={copy.traffic.title}
        Icon={BarChart3}
        action={
          <span className="flex items-center gap-3">
            <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground sm:inline">
              {badge}
            </span>
            <TextLink href={ROUTES.studio.analytics}>{copy.traffic.open}</TextLink>
          </span>
        }
      />
      {result.status === "ok" ? (
        <div className="flex flex-col gap-2 px-5 pb-4">
          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            {(["visitors", "pageviews"] as const).map((key) => {
              const delta = percentChange(result.data.totals[key], result.data.previous[key]);
              return (
                <div key={key} className="flex flex-col">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("size-2 rounded-full", key === "visitors" ? "bg-chart-1" : "bg-chart-2")} />
                    {pulse.stats[key]}
                  </dt>
                  <dd className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {NUMBER.format(result.data.totals[key])}
                    </span>
                    {delta ? <span className="text-xs text-muted-foreground tabular-nums">{delta}</span> : null}
                  </dd>
                </div>
              );
            })}
          </dl>
          <TrafficChart
            points={result.data.daily}
            labels={{ visitors: pulse.stats.visitors, pageviews: pulse.stats.pageviews }}
            height={180}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
            <BarChart3 aria-hidden className="size-5" />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            {result.status === "unconfigured" ? copy.traffic.setup : copy.traffic.error}
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.studio.analytics}>{copy.traffic.open}</Link>
          </Button>
        </div>
      )}
    </Card>
  );
};

const RING = { size: 72, stroke: 7 };

/** A ring that fills with the share of checks that pass. */
const ScoreRing = ({ done, total, label }: { done: number; total: number; label: string }) => {
  const radius = (RING.size - RING.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const share = total === 0 ? 0 : done / total;
  return (
    <div className="relative grid size-18 shrink-0 place-items-center">
      <svg width={RING.size} height={RING.size} aria-hidden className="-rotate-90">
        <circle
          cx={RING.size / 2}
          cy={RING.size / 2}
          r={radius}
          strokeWidth={RING.stroke}
          className="fill-none stroke-muted"
        />
        <circle
          cx={RING.size / 2}
          cy={RING.size / 2}
          r={radius}
          strokeWidth={RING.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - share)}
          className={cn(
            "fill-none transition-[stroke-dashoffset] duration-700 ease-out",
            share === 1 ? "stroke-success" : "stroke-primary",
          )}
        />
      </svg>
      <span className="absolute text-sm font-semibold tabular-nums">{label}</span>
    </div>
  );
};

const Health = ({ copy, checks }: { copy: Copy; checks: HealthChecks }) => {
  const items: { key: keyof HealthChecks; href: string }[] = [
    { key: "live", href: ROUTES.studio.release },
    { key: "sections", href: ROUTES.studio.release },
    { key: "analytics", href: ROUTES.studio.analytics },
    { key: "inbox", href: ROUTES.studio.chat },
    { key: "fresh", href: ROUTES.studio.content },
  ];
  const done = items.filter((item) => checks[item.key]).length;
  return (
    <Card order={2}>
      <CardHeader title={copy.checklist.title} Icon={CheckCircle2} />
      <div className="flex items-center gap-4 px-5 pb-3">
        <ScoreRing
          done={done}
          total={items.length}
          label={fill(copy.checklist.score, { n: done, total: items.length })}
        />
        <p className="text-sm text-muted-foreground">{attentionLine(copy, items.length - done)}</p>
      </div>
      <ul className="flex flex-col px-2 pb-3">
        {items.map(({ key, href }) => {
          const ok = checks[key];
          return (
            <li key={key}>
              <Link
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/60",
                  FOCUS,
                )}
              >
                {ok ? (
                  <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />
                ) : (
                  <CircleAlert aria-hidden className="size-4 shrink-0 text-warning" />
                )}
                <span className={cn("flex-1", ok ? "text-muted-foreground" : "font-medium text-foreground")}>
                  {copy.checklist[key]}
                </span>
                <ArrowRight
                  aria-hidden
                  className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

const ActivityFeed = ({ copy, activity }: { copy: Copy; activity: Activity[] }) => (
  <Card order={3} className="lg:col-span-2">
    <CardHeader title={copy.activity.title} Icon={PenLine} />
    {activity.length === 0 ? (
      <p className="px-5 pb-6 text-sm text-muted-foreground">{copy.activity.empty}</p>
    ) : (
      <ol className="flex flex-col px-5 pb-4">
        {activity.map((item, index) => {
          const last = index === activity.length - 1;
          const save = item.kind === "save";
          const href = save ? ROUTES.studio.release : `${ROUTES.studio.chat}?open=${item.id}`;
          return (
            <li key={`${item.kind}-${item.at}-${index}`} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3">
              <span aria-hidden className="relative flex justify-center">
                {last ? null : <span className="absolute top-8 bottom-0 w-px bg-border" />}
                <span
                  className={cn(
                    "relative mt-1 grid size-8 place-items-center rounded-full",
                    save ? "bg-primary/10 text-primary" : "bg-success/10 text-success",
                  )}
                >
                  {save ? <PenLine className="size-3.5" /> : <MessageSquare className="size-3.5" />}
                </span>
              </span>
              <Link
                href={href}
                className={cn(
                  "mb-1 flex min-w-0 items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60",
                  FOCUS,
                )}
              >
                <span className="min-w-0 flex-1 truncate text-sm">
                  {save
                    ? fill(copy.activity.saved, { who: item.who, screen: item.screen, n: item.version })
                    : fill(copy.activity.message, { name: item.name })}
                </span>
                <When iso={item.at} />
              </Link>
            </li>
          );
        })}
      </ol>
    )}
  </Card>
);

const Messages = ({ copy, recent }: { copy: Copy; recent: ConversationSummary[] }) => (
  <Card order={4}>
    <CardHeader
      title={copy.recentTitle}
      Icon={Inbox}
      action={<TextLink href={ROUTES.studio.chat}>{copy.viewAll}</TextLink>}
    />
    {recent.length === 0 ? (
      <p className="px-5 pb-6 text-sm text-muted-foreground">{copy.recentEmpty}</p>
    ) : (
      <ul className="flex flex-col px-2 pb-3">
        {recent.map((item) => (
          <li key={item.id}>
            <Link
              href={`${ROUTES.studio.chat}?open=${item.id}`}
              className={cn("flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60", FOCUS)}
            >
              <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-aurora-indigo text-[0.6875rem] font-semibold text-primary-foreground">
                {initialsOf(item.name)}
                {item.unread ? (
                  <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-card" />
                ) : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn("truncate text-sm", item.unread ? "font-semibold" : "font-medium")}>
                    {item.name}
                  </span>
                  <When iso={item.lastMessageAt} />
                </span>
                <span className="truncate text-xs text-muted-foreground">{item.preview}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </Card>
);

export const MissionControl = ({
  shell,
  maintenance,
  unread,
  sectionsShowing,
  sectionsTotal,
  traffic,
  checks,
  activity,
  recent,
}: MissionControlProps) => {
  const copy = shell.missionControl;
  const firstName = shell.owner.name.split(" ")[0] ?? shell.owner.name;
  const attention = Object.values(checks).filter((ok) => !ok).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Command banner. */}
      <section
        className={cn("relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8", ENTER)}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-linear-to-br from-primary/15 via-aurora-indigo/10 to-transparent blur-2xl"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Today />
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {fill(copy.greeting, { name: firstName })}
            </h1>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {attention > 0 ? (
                <CircleAlert aria-hidden className="size-4 text-warning" />
              ) : (
                <CheckCircle2 aria-hidden className="size-4 text-success" />
              )}
              {attentionLine(copy, attention)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={ROUTES.studio.content}>
                <LayoutGrid aria-hidden />
                {copy.shortcuts.content.label}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={ROUTES.home} target="_blank" rel="noopener noreferrer">
                <Globe aria-hidden />
                {copy.shortcuts.site.label}
                <ArrowUpRight aria-hidden />
              </a>
            </Button>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-2">
          <StatusChip
            href={ROUTES.studio.release}
            label={copy.stats.site}
            value={maintenance ? copy.stats.maintenance : copy.stats.live}
            tone={maintenance ? "warning" : "success"}
          />
          <StatusChip
            href={ROUTES.studio.chat}
            label={copy.stats.unread}
            value={String(unread)}
            tone={unread > 0 ? "primary" : "muted"}
          />
          <StatusChip
            href={ROUTES.studio.release}
            label={copy.stats.sections}
            value={fill(copy.stats.sectionsValue, { n: sectionsShowing, total: sectionsTotal })}
            tone={sectionsShowing === sectionsTotal ? "success" : "warning"}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Traffic copy={copy} pulse={shell.pulse} result={traffic} />
        <Health copy={copy} checks={checks} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <ActivityFeed copy={copy} activity={activity} />
        <Messages copy={copy} recent={recent} />
      </div>
    </div>
  );
};
