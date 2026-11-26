"use client";

import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import type { DailyPoint } from "@/lib/server/analytics/vercel-analytics";

/*
 * Visitors (area + line, chart-1) and page views (line, chart-2) per day, on
 * one shared count axis. Hovering shows a crosshair, markers and a tooltip
 * for the nearest day. Colours are the validated studio chart tokens.
 */

type Labels = { visitors: string; pageviews: string };

const HEIGHT = 240;
const PAD = { top: 12, right: 12, bottom: 28, left: 44 };
const GRID_LINES = 4;

const DATE = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: "UTC" });
const NUMBER = new Intl.NumberFormat("en");
const dateLabel = (iso: string) => DATE.format(new Date(`${iso}T00:00:00Z`));

/** A round top for the axis: 1, 2, 5 × 10^n. */
const niceMax = (value: number) => {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((multiple) => multiple * magnitude >= (value / GRID_LINES) * 1) ?? 10;
  return Math.ceil(value / (step * magnitude)) * step * magnitude;
};

export const TrafficChart = ({ points, labels }: { points: DailyPoint[]; labels: Labels }) => {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    setWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);

  const top = niceMax(Math.max(1, ...points.map((point) => Math.max(point.visitors, point.pageviews))));
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) =>
    PAD.left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (value: number) => PAD.top + plotHeight - (value / top) * plotHeight;
  const line = (key: "visitors" | "pageviews") =>
    points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point[key])}`).join(" ");
  const area = `${line("visitors")} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const tickEvery = Math.max(1, Math.ceil(points.length / 6));

  const onMove = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / Math.max(1, box.width);
    setHover(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
  };

  const active = hover === null ? null : points[hover];

  return (
    <div ref={frame} className="relative w-full">
      {width > 0 ? (
        <svg width={width} height={HEIGHT} aria-hidden className="block overflow-visible">
          {/* Recessive grid and count labels. */}
          {Array.from({ length: GRID_LINES + 1 }, (_, index) => {
            const value = (top / GRID_LINES) * index;
            return (
              <g key={index}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(value)}
                  y2={y(value)}
                  className="stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y(value)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {NUMBER.format(value)}
                </text>
              </g>
            );
          })}
          {points.map((point, index) =>
            index % tickEvery === 0 || index === points.length - 1 ? (
              <text
                key={point.date}
                x={x(index)}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {dateLabel(point.date)}
              </text>
            ) : null,
          )}

          <path d={area} className="fill-chart-1/12" />
          <path d={line("visitors")} className="fill-none stroke-chart-1" strokeWidth={2} strokeLinejoin="round" />
          <path d={line("pageviews")} className="fill-none stroke-chart-2" strokeWidth={2} strokeLinejoin="round" />

          {active && hover !== null ? (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={PAD.top + plotHeight}
                className="stroke-muted-foreground/40"
                strokeWidth={1}
              />
              <circle
                cx={x(hover)}
                cy={y(active.visitors)}
                r={4}
                className="fill-chart-1 stroke-card"
                strokeWidth={2}
              />
              <circle
                cx={x(hover)}
                cy={y(active.pageviews)}
                r={4}
                className="fill-chart-2 stroke-card"
                strokeWidth={2}
              />
            </g>
          ) : null}

          {/* The hit area: the whole plot, wider than any mark. */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotWidth}
            height={plotHeight}
            className="fill-transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      ) : (
        <div style={{ height: HEIGHT }} />
      )}

      {active && hover !== null ? (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-36 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md"
          style={{ left: Math.min(Math.max(x(hover), 80), width - 80) }}
        >
          <p className="mb-1 font-medium">{dateLabel(active.date)}</p>
          <p className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-chart-1" />
              {labels.visitors}
            </span>
            <span className="font-medium tabular-nums">{NUMBER.format(active.visitors)}</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-chart-2" />
              {labels.pageviews}
            </span>
            <span className="font-medium tabular-nums">{NUMBER.format(active.pageviews)}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
};
