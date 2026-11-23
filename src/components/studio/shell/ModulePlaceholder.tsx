import { MagicIcon } from "@/components/ui/MagicIcon";
import type { StudioModule, StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { MODULE_ICONS } from "./nav";

type ModulePlaceholderProps = { module: StudioModule; content: StudioShellContent };

/** Enter animation (shadcn / tw-animate-css) with a stagger; plays once when the page opens. */
const ENTER =
  "animate-in fill-mode-both duration-500 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none";
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });
const PREVIEW_ROWS = ["w-3/4", "w-1/2", "w-2/3"] as const;

/**
 * Body of a module page that isn't built yet: page header and a "coming soon"
 * panel. Everything enters once, in sequence; nothing loops.
 */
export const ModulePlaceholder = ({ module, content }: ModulePlaceholderProps) => {
  const copy = content.modules[module];
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={cn("text-3xl font-semibold tracking-tight text-balance", ENTER)} style={delay(40)}>
          {copy.title}
        </h1>
        <p className={cn("max-w-2xl text-sm leading-relaxed text-muted-foreground", ENTER)} style={delay(100)}>
          {copy.description}
        </p>
      </header>

      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(30_41_59/0.04),0_16px_40px_-24px_rgb(30_41_59/0.25)]",
          "animate-in duration-600 ease-out fill-mode-both fade-in slide-in-from-bottom-4 zoom-in-98 motion-reduce:animate-none",
        )}
        style={delay(160)}
      >
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-aurora-cyan to-aurora-indigo"
        />
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="relative grid size-28 place-items-center">
            <span aria-hidden className="absolute inset-0 rounded-full border border-dashed border-primary/25" />
            <span aria-hidden className="absolute inset-3 rounded-full bg-primary/[0.06]" />
            <span
              className="relative grid size-16 animate-in place-items-center rounded-2xl bg-linear-to-br from-foreground to-primary text-primary-foreground shadow-xl shadow-primary/25 duration-700 fill-mode-both zoom-in-50 spin-in-12 motion-reduce:animate-none"
              style={delay(280)}
            >
              <MagicIcon name={MODULE_ICONS[module]} size={28} state="active" />
            </span>
          </div>
          <span
            className={cn("mt-6 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary", ENTER)}
            style={delay(380)}
          >
            {content.placeholder.badge}
          </span>
          <p className={cn("mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground", ENTER)} style={delay(440)}>
            {content.placeholder.body}
          </p>
          <div aria-hidden className="mt-10 flex w-full max-w-md flex-col gap-3">
            {PREVIEW_ROWS.map((width, index) => (
              <div
                key={width}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-3",
                  ENTER,
                  "slide-in-from-left-3",
                )}
                style={delay(520 + index * 80)}
              >
                <span className="size-9 shrink-0 rounded-lg bg-aurora-lavender/60" />
                <span className="flex flex-1 flex-col gap-2">
                  <span className={cn("h-2 rounded-full bg-aurora-lavender/80", width)} />
                  <span className="h-2 w-1/3 rounded-full bg-aurora-mist" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
