import { AlertTriangle, BarChart3, Eye, KeyRound, Layers, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/shared/cn";
import { percentChange } from "@/lib/shared/format";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { ROUTES } from "@/lib/shared/routes";
import {
  BREAKDOWNS,
  PULSE_RANGES,
  type Breakdown,
  type BreakdownRow,
  type PulseRange,
  type PulseResult,
  type Totals,
} from "@/lib/server/analytics/vercel-analytics";
import { TrafficChart } from "./TrafficChart";

/*
 * Pulse, Vercel Web Analytics in the studio (docs/screens/STUDIO_PULSE_BUSINESS.md):
 * the environment badge (production data on production, preview data
 * elsewhere), a 7 / 30 / 90-day range, stat cards with the change against the
 * previous range, the daily chart and the top pages, referrers, countries and
 * devices. Without configuration: the setup card; on an API error: a message.
 */

type Copy = StudioShellContent["pulse"];

const ENTER =
  "animate-in fill-mode-both duration-500 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none";
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });
const NUMBER = new Intl.NumberFormat("en");
const REGIONS = new Intl.DisplayNames(["en"], { type: "region" });
const RANGE_KEYS: Record<PulseRange, keyof Copy["ranges"]> = { 7: "week", 30: "month" };
const SETUP_VARIABLES = ["VERCEL_ANALYTICS_TOKEN", "VERCEL_ANALYTICS_PROJECT", "VERCEL_ANALYTICS_TEAM"] as const;

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const Card = ({ children, className, order = 0 }: { children: ReactNode; className?: string; order?: number }) => (
  <section
    className={cn("rounded-2xl border border-border bg-card p-5 shadow-xs", ENTER, className)}
    style={delay(80 + order * 60)}
  >
    {children}
  </section>
);

const Stat = ({
  label,
  value,
  note,
  Icon,
  order,
}: {
  label: string;
  value: string;
  note: string;
  Icon: typeof Users;
  order: number;
}) => (
  <Card order={order} className="flex flex-col gap-3">
    <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
      {label}
      <span className="grid size-8 place-items-center rounded-lg bg-muted">
        <Icon aria-hidden className="size-4" />
      </span>
    </span>
    <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
    <span className="text-xs text-muted-foreground">{note}</span>
  </Card>
);

const labelFor = (dimension: Breakdown, raw: string, copy: Copy): string => {
  if (!raw) return copy.direct;
  if (dimension === "country") {
    try {
      return REGIONS.of(raw) ?? raw;
    } catch {
      return raw;
    }
  }
  return dimension === "deviceType" ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw;
};

const BreakdownList = ({
  title,
  dimension,
  rows,
  copy,
  order,
}: {
  title: string;
  dimension: Breakdown;
  rows: BreakdownRow[];
  copy: Copy;
  order: number;
}) => {
  const top = Math.max(1, ...rows.map((row) => row.visitors));
  return (
    <Card order={order} className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="py-4 text-xs text-muted-foreground">{copy.empty}</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li
              key={`${dimension}-${row.label}`}
              className="relative flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-md bg-chart-1/10"
                style={{ width: `${(row.visitors / top) * 100}%` }}
              />
              <span className="relative truncate font-code text-xs">{labelFor(dimension, row.label, copy)}</span>
              <span className="relative shrink-0 font-medium tabular-nums">{NUMBER.format(row.visitors)}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
};

const Totals = ({ totals, previous, days, copy }: { totals: Totals; previous: Totals; days: number; copy: Copy }) => {
  const note = (now: number, before: number) => {
    const delta = percentChange(now, before);
    return delta ? fill(copy.stats.change, { change: delta, days }) : copy.stats.noPrevious;
  };
  const perVisitor = totals.visitors > 0 ? (totals.pageviews / totals.visitors).toFixed(1) : "0";
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat
        order={0}
        label={copy.stats.visitors}
        value={NUMBER.format(totals.visitors)}
        note={note(totals.visitors, previous.visitors)}
        Icon={Users}
      />
      <Stat
        order={1}
        label={copy.stats.pageviews}
        value={NUMBER.format(totals.pageviews)}
        note={note(totals.pageviews, previous.pageviews)}
        Icon={Eye}
      />
      <Stat
        order={2}
        label={copy.stats.perVisitor}
        value={perVisitor}
        note={note(
          totals.visitors > 0 ? totals.pageviews / totals.visitors : 0,
          previous.visitors > 0 ? previous.pageviews / previous.visitors : 0,
        )}
        Icon={Layers}
      />
    </div>
  );
};

export const Pulse = ({
  result,
  copy,
  title,
  description,
}: {
  result: PulseResult;
  copy: Copy;
  title: string;
  description: string;
}) => {
  const production = result.environment === "production";
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className={cn("flex flex-wrap items-end justify-between gap-4", ENTER)}>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 font-semibold",
                production ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
              )}
            >
              {production ? copy.environment.production : copy.environment.preview}
            </span>
            {production ? copy.environment.productionHint : copy.environment.previewHint}
          </p>
        </div>
        <nav aria-label={copy.rangeLabel} className="flex gap-1 rounded-lg bg-muted p-1">
          {PULSE_RANGES.map((range) => (
            <Link
              key={range}
              href={`${ROUTES.studio.analytics}?range=${range}`}
              aria-current={range === result.range ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                range === result.range
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {copy.ranges[RANGE_KEYS[range]]}
            </Link>
          ))}
        </nav>
      </header>

      {result.status === "unconfigured" ? (
        <Card className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <KeyRound aria-hidden className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">{copy.setup.title}</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{copy.setup.body}</p>
            </div>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-muted p-4 font-code text-xs leading-relaxed">
            {SETUP_VARIABLES.map((name) => `${name}=`).join("\n")}
          </pre>
          <p className="text-xs text-muted-foreground">{copy.setup.note}</p>
        </Card>
      ) : result.status === "error" ? (
        <Card className="flex items-start gap-3 border-destructive/40 bg-destructive-surface">
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
          <p role="alert" className="text-sm">
            {copy.errors[result.reason]}
          </p>
        </Card>
      ) : (
        <>
          <Totals totals={result.data.totals} previous={result.data.previous} days={result.range} copy={copy} />
          <Card order={3} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 aria-hidden className="size-4 text-muted-foreground" />
                {copy.chartTitle}
              </h2>
              <span className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-0.5 w-4 rounded-full bg-chart-1" />
                  {copy.stats.visitors}
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-0.5 w-4 rounded-full bg-chart-2" />
                  {copy.stats.pageviews}
                </span>
              </span>
            </div>
            {result.data.totals.pageviews === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">{copy.empty}</p>
            ) : (
              <>
                <p className="sr-only">
                  {fill(copy.chartSummary, {
                    visitors: NUMBER.format(result.data.totals.visitors),
                    pageviews: NUMBER.format(result.data.totals.pageviews),
                    days: result.range,
                  })}
                </p>
                <TrafficChart
                  points={result.data.daily}
                  labels={{ visitors: copy.stats.visitors, pageviews: copy.stats.pageviews }}
                />
                <table className="sr-only">
                  <caption>{copy.tableCaption}</caption>
                  <thead>
                    <tr>
                      <th>{copy.date}</th>
                      <th>{copy.stats.visitors}</th>
                      <th>{copy.stats.pageviews}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.daily.map((point) => (
                      <tr key={point.date}>
                        <td>{point.date}</td>
                        <td>{point.visitors}</td>
                        <td>{point.pageviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {BREAKDOWNS.map((dimension, index) => (
              <BreakdownList
                key={dimension}
                title={copy.breakdowns[dimension]}
                dimension={dimension}
                rows={result.data.breakdowns[dimension]}
                copy={copy}
                order={4 + index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
