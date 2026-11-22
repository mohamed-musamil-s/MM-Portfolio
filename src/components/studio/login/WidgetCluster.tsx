"use client";

import { motion, useTransform } from "motion/react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useId, type CSSProperties, type ReactNode } from "react";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import type { StudioLoginContent } from "@/lib/shared/content/studio-login-schema";
import { cn } from "@/lib/shared/cn";

/*
 * Login brand-panel illustration: a cluster of labelled glass widgets
 * floating at different depths in a gently tilted 3D space:
 *
 *   auto-sync chip (top left)          uptime ring (top right)
 *            Overview card: visitors, delta, area chart, days
 *   recent activity list (bottom left)  secure-session badge (bottom right)
 *
 * All labels come from the database (showcase.illustration); they are generic
 * UI copy, not live data. Sizes use container units so the whole cluster
 * scales with the panel. Motion: the cluster leans toward the pointer, each
 * widget bobs at its own pace, the chart draws, the ring fills and the
 * activity rows slide in. Reduced motion: a still frame.
 */

type Labels = StudioLoginContent["showcase"]["illustration"];

const EASE = [0.2, 0, 0, 1] as const;
const REST = { rotateX: 9, rotateY: -11 } as const;
const GLASS = "rounded-[3cqw] border border-card bg-card/80 shadow-xl shadow-aurora-indigo/10 backdrop-blur-xl";

/** Smooth weekly curve (viewBox 0 0 100 40) and its filled area. */
const LINE =
  "M0 30 C8 28 12 22 17 23 C24 24 27 31 34 28 C42 24 44 12 51 13 C58 14 60 22 67 20 C75 18 78 8 84 7 C90 6 95 10 100 9";
const AREA = `${LINE} L100 40 L0 40 Z`;
const END = { x: 100, y: 9 };
const ACTIVITY_DOTS = ["bg-success", "bg-aurora-blue", "bg-aurora-violet"] as const;

const depth = (z: number): CSSProperties => ({ transform: `translateZ(${z}px)` });

/** One widget: placed in the cluster, pushed toward the camera by `z`, bobbing on its own loop. */
const Floating = ({
  className,
  z,
  bob,
  delay,
  still,
  children,
}: {
  className: string;
  z: number;
  bob: number;
  delay: number;
  still: boolean;
  children: ReactNode;
}) => (
  <div className={cn("absolute transform-3d", className)} style={depth(z)}>
    <motion.div
      initial={still ? false : { opacity: 0, y: 16 }}
      animate={still ? { opacity: 1 } : { opacity: 1, y: [0, -bob, 0] }}
      transition={
        still
          ? undefined
          : {
              opacity: { duration: 0.6, delay },
              y: { duration: 5 + bob * 0.4, ease: "easeInOut", repeat: Infinity, delay: delay + 0.6 },
            }
      }
    >
      {children}
    </motion.div>
  </div>
);

const IconTile = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span
    className={cn(
      "grid size-[5cqw] shrink-0 place-items-center rounded-[1.4cqw] bg-linear-to-br from-aurora-violet to-aurora-indigo text-primary-foreground shadow-md shadow-aurora-indigo/30 [&_svg]:size-[2.6cqw]",
      className,
    )}
  >
    {children}
  </span>
);

const OverviewCard = ({ labels, still }: { labels: Labels["overview"]; still: boolean }) => {
  const gradientId = useId();
  return (
    <div className={cn(GLASS, "flex flex-col gap-[2.2cqw] p-[3.4cqw]")}>
      <div className="flex items-center gap-[1.6cqw]">
        <span className="text-[2.7cqw] font-semibold text-foreground">{labels.title}</span>
        <span className="rounded-full bg-muted px-[1.8cqw] py-[0.6cqw] text-[1.9cqw] font-medium text-muted-foreground">
          {labels.period}
        </span>
      </div>
      <div className="flex flex-col gap-[0.6cqw]">
        <span className="text-[2.1cqw] text-muted-foreground">{labels.metricLabel}</span>
        <div className="flex items-baseline gap-[1.6cqw]">
          <span className="text-[7cqw] leading-none font-semibold tracking-tight text-foreground tabular-nums">
            {labels.metricValue}
          </span>
          <span className="rounded-full bg-success/10 px-[1.4cqw] py-[0.4cqw] text-[1.9cqw] font-semibold text-success">
            {labels.delta}
          </span>
        </div>
      </div>
      <svg viewBox="0 0 100 40" className="w-full overflow-visible" fill="none">
        <defs>
          <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--studio-aurora-blue)", stopOpacity: 0.28 }} />
            <stop offset="100%" style={{ stopColor: "var(--studio-aurora-blue)", stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" style={{ stopColor: "var(--studio-aurora-cyan)" }} />
            <stop offset="100%" style={{ stopColor: "var(--studio-aurora-indigo)" }} />
          </linearGradient>
        </defs>
        {[10, 20, 30].map((y) => (
          <line
            key={y}
            x1={0}
            x2={100}
            y1={y}
            y2={y}
            className="stroke-aurora-lavender"
            strokeWidth={0.4}
            strokeDasharray="1.5 1.5"
          />
        ))}
        <motion.path
          d={AREA}
          fill={`url(#${gradientId}-area)`}
          initial={{ opacity: still ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
        />
        <motion.path
          d={LINE}
          stroke={`url(#${gradientId}-line)`}
          strokeWidth={1.4}
          strokeLinecap="round"
          initial={{ pathLength: still ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.5 }}
        />
        <motion.circle
          cx={END.x}
          cy={END.y}
          r={4}
          className="fill-aurora-blue/20"
          initial={false}
          animate={still ? undefined : { scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 2 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        <circle cx={END.x} cy={END.y} r={1.8} className="fill-card stroke-aurora-indigo" strokeWidth={1} />
      </svg>
      <div className="flex justify-between text-[1.8cqw] text-muted-foreground">
        {labels.days.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </div>
  );
};

const UptimeCard = ({ labels, still }: { labels: Labels["uptime"]; still: boolean }) => {
  const gradientId = useId();
  return (
    <div className={cn(GLASS, "flex flex-col items-center gap-[1.4cqw] p-[2.8cqw]")}>
      <div className="relative w-full">
        <svg viewBox="0 0 100 100" className="w-full -rotate-90" fill="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--studio-aurora-cyan)" }} />
              <stop offset="100%" style={{ stopColor: "var(--studio-aurora-indigo)" }} />
            </linearGradient>
          </defs>
          <circle cx={50} cy={50} r={40} className="stroke-aurora-mist" strokeWidth={10} />
          <motion.circle
            cx={50}
            cy={50}
            r={40}
            stroke={`url(#${gradientId})`}
            strokeWidth={10}
            strokeLinecap="round"
            initial={{ pathLength: still ? 0.97 : 0 }}
            animate={{ pathLength: 0.97 }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.8 }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[3.4cqw] font-semibold tracking-tight text-foreground tabular-nums">
          {labels.value}
        </span>
      </div>
      <span className="text-[2cqw] font-medium text-muted-foreground">{labels.label}</span>
    </div>
  );
};

const ActivityCard = ({ labels, still }: { labels: Labels["activity"]; still: boolean }) => (
  <div className={cn(GLASS, "flex flex-col gap-[1.8cqw] p-[3cqw]")}>
    <span className="text-[2.4cqw] font-semibold text-foreground">{labels.title}</span>
    <ul className="flex flex-col">
      {labels.items.map((item, index) => (
        <motion.li
          key={item.label}
          className="flex items-center gap-[1.6cqw] border-t border-border/70 py-[1.3cqw] first:border-t-0 first:pt-0"
          initial={still ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 1 + index * 0.15 }}
        >
          <span className={cn("size-[1.5cqw] shrink-0 rounded-full", ACTIVITY_DOTS[index] ?? ACTIVITY_DOTS[0])} />
          <span className="min-w-0 flex-1 truncate text-[2.1cqw] text-foreground">{item.label}</span>
          <span className="text-[1.8cqw] text-muted-foreground tabular-nums">{item.time}</span>
        </motion.li>
      ))}
    </ul>
  </div>
);

const ToggleChip = ({ labels, still }: { labels: Labels["toggle"]; still: boolean }) => (
  <div className={cn(GLASS, "flex items-center gap-[1.8cqw] rounded-[2.4cqw] p-[1.6cqw] pr-[2.2cqw]")}>
    <IconTile>
      <motion.span
        className="grid place-items-center"
        animate={still ? undefined : { rotate: [0, 360] }}
        transition={{ duration: 6, ease: "linear", repeat: Infinity }}
      >
        <RefreshCw aria-hidden />
      </motion.span>
    </IconTile>
    <span className="text-[2.2cqw] font-medium whitespace-nowrap text-foreground">{labels.label}</span>
    <span className="relative ml-[0.6cqw] h-[3cqw] w-[5.4cqw] rounded-full bg-primary">
      <motion.span
        className="absolute top-1/2 size-[2.3cqw] -translate-y-1/2 rounded-full bg-card shadow"
        initial={{ left: still ? "48%" : "8%" }}
        animate={{ left: "48%" }}
        transition={{ duration: 0.4, ease: EASE, delay: 1.2 }}
      />
    </span>
    <span className="text-[1.9cqw] font-medium text-primary">{labels.state}</span>
  </div>
);

const SecurityBadge = ({ labels }: { labels: Labels["security"] }) => (
  <div className={cn(GLASS, "flex items-center gap-[1.8cqw] rounded-[2.4cqw] p-[1.6cqw] pr-[2.6cqw]")}>
    <IconTile className="from-success/70 to-success shadow-success/30">
      <ShieldCheck aria-hidden />
    </IconTile>
    <span className="flex flex-col">
      <span className="text-[2.2cqw] font-semibold whitespace-nowrap text-foreground">{labels.label}</span>
      <span className="text-[1.8cqw] whitespace-nowrap text-muted-foreground">{labels.detail}</span>
    </span>
  </div>
);

export const WidgetCluster = ({ labels, className }: { labels: Labels; className?: string }) => {
  const { reducedMotion: still } = useMotionTheme();
  const lean = usePointerParallax(5);
  const rotateY = useTransform(lean.x, (value) => REST.rotateY + value);
  const rotateX = useTransform(lean.y, (value) => REST.rotateX - value * 0.6);

  return (
    <div aria-hidden className={cn("[container-type:inline-size] relative w-full", className)}>
      <div className="relative aspect-square perspective-[1800px]">
        <div className="absolute top-[78%] left-[14%] h-[12%] w-[72%] rounded-[50%] bg-aurora-indigo/15 blur-3xl" />
        <motion.div className="absolute inset-0 transform-3d" style={{ rotateX, rotateY }}>
          <Floating className="top-[21%] left-[13%] w-[64%]" z={0} bob={6} delay={0.1} still={still}>
            <OverviewCard labels={labels.overview} still={still} />
          </Floating>
          <Floating className="top-[6%] left-[66%] w-[26%]" z={70} bob={9} delay={0.3} still={still}>
            <UptimeCard labels={labels.uptime} still={still} />
          </Floating>
          <Floating className="top-[7%] left-[3%]" z={40} bob={7} delay={0.45} still={still}>
            <ToggleChip labels={labels.toggle} still={still} />
          </Floating>
          <Floating className="top-[71%] left-[1%] w-[46%]" z={55} bob={8} delay={0.6} still={still}>
            <ActivityCard labels={labels.activity} still={still} />
          </Floating>
          <Floating className="top-[79%] left-[53%]" z={85} bob={10} delay={0.75} still={still}>
            <SecurityBadge labels={labels.security} />
          </Floating>
        </motion.div>
      </div>
    </div>
  );
};
