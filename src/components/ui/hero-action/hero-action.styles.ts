import { tv } from "@/lib/shared/tv";

/**
 * HeroActionButton layers, outside in:
 *   anchor (static, measured for the magnetic pull) > shaker (error shake)
 *     > magnet (pull offset) > halo, brackets, ring, root, waves, burst
 *       root > sheen, wipe, wipeDeep, content
 * Public surface only: ink pill, signal accents (docs/STYLE.md §6.5).
 */
export const heroAction = tv({
  slots: {
    anchor: "relative inline-flex",
    shaker: "inline-flex",
    magnet: "relative inline-flex",
    halo: "pointer-events-none absolute -inset-1.5 rounded-full border-2 border-signal",
    bracket: "pointer-events-none absolute size-4 border-signal",
    ring: "pointer-events-none absolute overflow-visible fill-none stroke-signal stroke-2",
    root: "relative isolate inline-flex min-h-22 items-center overflow-hidden rounded-full bg-ink px-11 text-h3 font-extrabold tracking-tight text-paper uppercase outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-[14px] focus-visible:outline-signal [@media(max-height:820px)]:min-h-16 [@media(max-height:820px)]:px-8",
    sheen:
      "pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-20 bg-linear-to-r from-transparent via-signal/45 to-transparent",
    wipe: "pointer-events-none absolute inset-0 origin-left bg-signal",
    wipeDeep:
      "pointer-events-none absolute inset-0 origin-left bg-linear-to-r from-transparent via-transparent to-ink/30",
    content: "relative z-10 inline-flex items-center gap-4",
    iconSlot: "relative size-7 shrink-0",
    wave: "pointer-events-none absolute inset-0 rounded-full border-2 border-signal",
    burst: "pointer-events-none absolute inset-0",
    ray: "absolute h-0.5 w-3.5 -translate-1/2 rounded-full bg-signal",
  },
});
