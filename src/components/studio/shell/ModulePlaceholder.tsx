import { MagicIcon } from "@/components/ui/MagicIcon";
import type { StudioModule, StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { MODULE_ICONS } from "./nav";

type ModulePlaceholderProps = { module: StudioModule; content: StudioShellContent };

/** Body of a module page that isn't built yet: page header and a "coming soon" empty state. */
export const ModulePlaceholder = ({ module, content }: ModulePlaceholderProps) => {
  const copy = content.modules[module];
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </header>
      <section className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-primary to-aurora-indigo text-primary-foreground shadow-lg shadow-primary/25">
          <MagicIcon name={MODULE_ICONS[module]} size={22} state="active" />
        </span>
        <span className="mt-5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {content.placeholder.badge}
        </span>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{content.placeholder.body}</p>
      </section>
    </div>
  );
};
