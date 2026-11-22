import { tv } from "@/lib/shared/tv";

/**
 * StatusPillButton: a small, clean ink pill. No magnetic pull, no hover
 * movement, no corner marks: hover only dims the fill (docs/STYLE.md §6.1).
 */
export const statusPill = tv({
  slots: {
    root: "relative inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-label font-bold text-paper uppercase transition-colors duration-200 outline-none select-none hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink",
    content: "relative inline-flex items-center gap-2.5",
    iconSlot: "relative size-4 shrink-0",
    labels: "grid",
    label: "whitespace-nowrap [grid-area:1/1]",
  },
});
