import { cn } from "@/lib/shared/cn";
import {
  MONOGRAM_DOT,
  MONOGRAM_DOT_RING_RADIUS,
  MONOGRAM_LETTERS,
  MONOGRAM_NODES,
  MONOGRAM_NODE_RADIUS,
  MONOGRAM_TRACES,
  MONOGRAM_TRACE_WIDTH,
  MONOGRAM_VIEWBOX,
} from "@/lib/shared/brand/monogram";

export type MonogramVariant = "flat" | "circuit";

type MonogramProps = {
  /** `flat`: pure 2D mark. `circuit`: adds fine signal-orange traces and terminal nodes. */
  variant?: MonogramVariant;
  /** `accent`: the period is signal orange (site default). `letter`: same colour as the letters (as in the logo files). */
  dot?: "accent" | "letter";
  /** Accessible name. Omit when a visible label sits next to the mark (it is then decorative). */
  label?: string;
  className?: string;
};

/**
 * The "MM." monogram (docs/brand/LOGO.md). Letters use the current text
 * colour, so `text-ink` / `text-paper` recolour it; the circuit traces use the
 * signal token. Size it with width or height utilities.
 */
export const Monogram = ({ variant = "flat", dot = "accent", label, className }: MonogramProps) => (
  <svg
    viewBox={`0 0 ${MONOGRAM_VIEWBOX.width} ${MONOGRAM_VIEWBOX.height}`}
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={cn("block h-auto text-ink", className)}
  >
    <path d={MONOGRAM_LETTERS} fill="currentColor" />
    <circle
      cx={MONOGRAM_DOT.cx}
      cy={MONOGRAM_DOT.cy}
      r={MONOGRAM_DOT.r}
      fill="currentColor"
      className={cn(dot === "accent" && "fill-signal")}
    />
    {variant === "circuit" ? (
      <g
        fill="none"
        strokeWidth={MONOGRAM_TRACE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-signal"
      >
        {MONOGRAM_TRACES.map((d) => (
          <path key={d} d={d} />
        ))}
        {MONOGRAM_NODES.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={MONOGRAM_NODE_RADIUS} fill="currentColor" />
        ))}
        <circle
          cx={MONOGRAM_DOT.cx}
          cy={MONOGRAM_DOT.cy}
          r={MONOGRAM_DOT_RING_RADIUS}
          className={cn(dot === "accent" && "stroke-paper")}
        />
      </g>
    ) : null}
  </svg>
);
