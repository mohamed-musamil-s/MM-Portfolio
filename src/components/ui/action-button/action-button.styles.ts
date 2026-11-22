import type { VariantProps } from "tailwind-variants";
import { tv } from "@/lib/shared/tv";

/**
 * One recipe, two visual languages. Behaviour is identical; only these
 * classes differ between the portfolio and the studio.
 *
 * Layers: anchor (static, measured for the magnetic pull)
 *   > shaker (error shake) > root (magnetic offset, press scale)
 *     > fill (ink wipe / progress / hold) + content + corners
 */
export const actionButton = tv({
  slots: {
    anchor: "relative inline-flex",
    shaker: "inline-flex",
    root: "relative isolate inline-flex items-center justify-center overflow-hidden outline-none select-none disabled:cursor-not-allowed aria-disabled:cursor-not-allowed",
    fill: "pointer-events-none absolute origin-left",
    content: "relative z-10 inline-flex items-center gap-2 whitespace-nowrap",
    badge: "leading-none",
    corner: "pointer-events-none absolute z-20",
    pulse: "pointer-events-none absolute inset-0",
  },
  variants: {
    variant: {
      // Public portfolio (docs/STYLE.md): ink wipe, crosshair lock-on, magnetic pull.
      "editorial-ink": {
        // bg-paper is required: the difference blend needs an opaque backdrop inside the isolated root.
        root: "min-h-11 border border-ink bg-paper px-6 py-3.5 font-grotesk text-label font-bold text-ink uppercase focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink disabled:opacity-40 aria-disabled:opacity-40",
        fill: "inset-0 bg-ink",
        // Paper text with a difference blend: reads ink on paper and paper on ink, exactly where the wipe is.
        content: "text-paper mix-blend-difference",
        badge: "border border-current px-1 py-0.5 font-technical text-micro",
        corner: "size-2.5 text-ink",
        pulse: "hidden",
      },
      // Studio (docs/ADMIN_STYLE.md, provisional tokens): detent press, border illumination, state machine.
      "studio-action": {
        root: "h-9 rounded-md border border-line bg-panel px-3.5 text-sm font-medium text-fg transition-[border-color,box-shadow,background-color] duration-150 hover:border-accent focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-glow disabled:opacity-50 aria-disabled:opacity-50 data-[pressed=true]:border-accent data-[pressed=true]:bg-accent data-[pressed=true]:text-on-accent data-[status=error]:border-danger data-[status=success]:border-success",
        fill: "inset-x-0 bottom-0 h-0.5 bg-accent",
        badge: "rounded-sm bg-danger/10 px-1.5 py-0.5 font-mono text-xs text-danger",
        corner: "hidden",
        pulse: "rounded-md border-2 border-success",
      },
    },
    /** `solid`: filled ink pill (primary call to action). `outline`: the default bordered button. */
    tone: {
      outline: {},
      solid: {},
    },
    method: {
      submit: {},
      "async-fetch": {},
      navigate: {},
      destructive: {},
      copy: {},
      toggle: {},
    },
  },
  compoundVariants: [
    {
      variant: "editorial-ink",
      tone: "solid",
      class: {
        root: "min-h-12 rounded-full border-ink bg-ink px-7 text-paper hover:bg-ink/88",
        fill: "hidden",
        content: "text-paper mix-blend-normal",
        corner: "hidden",
      },
    },
    {
      variant: "studio-action",
      method: "destructive",
      class: {
        root: "text-danger hover:border-danger focus-visible:border-danger focus-visible:ring-danger/20",
        fill: "inset-0 h-auto bg-danger/12",
      },
    },
  ],
  defaultVariants: { variant: "studio-action", tone: "outline", method: "submit" },
});

export type ActionButtonStyleProps = VariantProps<typeof actionButton>;
