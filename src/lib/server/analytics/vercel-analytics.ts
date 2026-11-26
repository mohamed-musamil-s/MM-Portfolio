import "server-only";
import { env } from "../env";
import { getLogger } from "../logger";

/*
 * Reads Vercel Web Analytics for Pulse (docs/screens/STUDIO_PULSE_BUSINESS.md)
 * through `GET /v1/query/web-analytics/visits/aggregate`
 * (https://vercel.com/docs/analytics/web-analytics-api). Server only: the
 * token never reaches the browser. The production deployment reads
 * production data; every other environment (local, dev / preview) reads
 * preview data. Responses are cached for 60 s.
 */

const log = getLogger("analytics");

const API = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate";
const CACHE_SECONDS = 60;
const TOP = 8;
const DAY_MS = 86_400_000;

export const PULSE_RANGES = [7, 30, 90] as const;
export type PulseRange = (typeof PULSE_RANGES)[number];

export const BREAKDOWNS = ["requestPath", "referrerHostname", "country", "deviceType"] as const;
export type Breakdown = (typeof BREAKDOWNS)[number];

export type AnalyticsEnvironment = "production" | "preview";
export type Totals = { visitors: number; pageviews: number };
export type DailyPoint = Totals & { date: string };
export type BreakdownRow = Totals & { label: string };

export type PulseData = {
  totals: Totals;
  previous: Totals;
  daily: DailyPoint[];
  breakdowns: Record<Breakdown, BreakdownRow[]>;
};

export type PulseErrorReason = "auth" | "forbidden" | "plan" | "failed";

export type PulseResult =
  | { status: "ok"; environment: AnalyticsEnvironment; range: PulseRange; data: PulseData }
  | { status: "unconfigured"; environment: AnalyticsEnvironment; range: PulseRange }
  | { status: "error"; environment: AnalyticsEnvironment; range: PulseRange; reason: PulseErrorReason };

type Row = Record<string, string | number | null | undefined> & { pageviews?: number; visitors?: number };

class AnalyticsError extends Error {
  constructor(readonly reason: PulseErrorReason) {
    super(reason);
  }
}

/** Production data on the production deployment, preview data everywhere else. */
export const analyticsEnvironment = (): AnalyticsEnvironment =>
  env.vercelEnv() === "production" ? "production" : "preview";

/** YYYY-MM-DD (UTC) for a timestamp. */
const day = (time: number) => new Date(time).toISOString().slice(0, 10);

const reasonFor = (status: number): PulseErrorReason =>
  status === 401 ? "auth" : status === 403 ? "forbidden" : status === 402 ? "plan" : "failed";

const query = async (
  config: { token: string; project: string; team: string | null },
  environment: AnalyticsEnvironment,
  params: { by: string; since: string; until: string; limit?: number },
): Promise<Row[]> => {
  const search = new URLSearchParams({
    projectId: config.project,
    since: params.since,
    until: params.until,
    by: params.by,
    filter: `environment eq '${environment}'`,
  });
  if (params.limit) {
    search.set("limit", String(params.limit));
  }
  if (config.team) {
    search.set(config.team.startsWith("team_") ? "teamId" : "slug", config.team);
  }
  const response = await fetch(`${API}?${search.toString()}`, {
    headers: { Authorization: `Bearer ${config.token}` },
    next: { revalidate: CACHE_SECONDS },
  });
  if (!response.ok) {
    log.warn({ status: response.status, by: params.by }, "vercel analytics query failed");
    throw new AnalyticsError(reasonFor(response.status));
  }
  const body = (await response.json()) as { data?: Row[] };
  return Array.isArray(body.data) ? body.data : [];
};

const sum = (rows: Row[]): Totals =>
  rows.reduce<Totals>(
    (total, row) => ({
      visitors: total.visitors + Number(row.visitors ?? 0),
      pageviews: total.pageviews + Number(row.pageviews ?? 0),
    }),
    { visitors: 0, pageviews: 0 },
  );

/** One point per day of the range, zero where Vercel has no row. */
const fillDays = (rows: Row[], since: number, days: number): DailyPoint[] => {
  const byDay = new Map(rows.map((row) => [String(row.timestamp ?? "").slice(0, 10), row]));
  return Array.from({ length: days }, (_, index) => {
    const date = day(since + index * DAY_MS);
    const row = byDay.get(date);
    return { date, visitors: Number(row?.visitors ?? 0), pageviews: Number(row?.pageviews ?? 0) };
  });
};

export const getPulse = async (range: PulseRange): Promise<PulseResult> => {
  const environment = analyticsEnvironment();
  const config = env.vercelAnalytics();
  if (!config) {
    return { status: "unconfigured", environment, range };
  }

  const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const since = today - (range - 1) * DAY_MS;
  const window = { since: day(since), until: day(today) };
  const before = { since: day(since - range * DAY_MS), until: day(since - DAY_MS) };

  try {
    const [totals, previous, daily, ...lists] = await Promise.all([
      query(config, environment, { by: "environment", ...window }),
      query(config, environment, { by: "environment", ...before }),
      query(config, environment, { by: "day", ...window }),
      ...BREAKDOWNS.map((dimension) => query(config, environment, { by: dimension, limit: TOP, ...window })),
    ]);
    const breakdowns = Object.fromEntries(
      BREAKDOWNS.map((dimension, index) => [
        dimension,
        (lists[index] ?? []).map((row) => ({
          label: String(row[dimension] ?? ""),
          visitors: Number(row.visitors ?? 0),
          pageviews: Number(row.pageviews ?? 0),
        })),
      ]),
    ) as Record<Breakdown, BreakdownRow[]>;
    return {
      status: "ok",
      environment,
      range,
      data: { totals: sum(totals), previous: sum(previous), daily: fillDays(daily, since, range), breakdowns },
    };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      return { status: "error", environment, range, reason: error.reason };
    }
    log.error({ err: error }, "vercel analytics unavailable");
    return { status: "error", environment, range, reason: "failed" };
  }
};
