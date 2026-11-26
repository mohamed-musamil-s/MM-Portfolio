"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SiteModeCard } from "@/components/studio/content/SiteModeCard";
import { Switch } from "@/components/studio/ui/switch";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { cn } from "@/lib/shared/cn";
import { HOME_SECTIONS, type HomeSection, type SectionVisibility } from "@/lib/shared/content/home-sections";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";

/*
 * Launchpad (docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md): the site's launch
 * controls. The site mode switch (live / maintenance), then one switch per
 * portfolio section. A switch saves at once (PUT /api/studio/settings/sections);
 * a hidden section leaves the public page along with its navbar and footer links.
 */

type LaunchpadProps = {
  shell: StudioShellContent;
  initial: SectionVisibility;
  updatedAt: string | null;
  updatedBy: string | null;
  maintenance: boolean;
};

const ENTER =
  "animate-in fill-mode-both duration-500 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none";

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const LastChange = ({ template, iso, who }: { template: string; iso: string; who: string }) => {
  const time = useRelativeTime(iso);
  return <span>{fill(template, { time, who })}</span>;
};

export const Launchpad = ({ shell, initial, updatedAt, updatedBy, maintenance }: LaunchpadProps) => {
  const copy = shell.launchpad;
  const page = shell.modules.release;
  const router = useRouter();
  const [visible, setVisible] = useState(initial);
  const [pending, setPending] = useState<HomeSection | null>(null);
  const showing = HOME_SECTIONS.filter((section) => visible[section]).length;

  const change = async (section: HomeSection, next: boolean) => {
    const before = visible;
    setVisible({ ...visible, [section]: next });
    setPending(section);
    const response = await fetch("/api/studio/settings/sections", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visible: { [section]: next } }),
    }).catch(() => null);
    setPending(null);
    if (!response?.ok) {
      setVisible(before);
      toast.error(copy.failed);
      return;
    }
    const name = copy.sections[section].name;
    toast.success(fill(next ? copy.shown : copy.hiddenToast, { section: name }));
    router.refresh();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className={cn("flex flex-col gap-2", ENTER)}>
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{page.description}</p>
      </header>

      <div className={ENTER} style={{ animationDelay: "60ms" }}>
        <SiteModeCard copy={shell.editor} failed={shell.editor.failed} initialMaintenance={maintenance} />
      </div>

      <section
        className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-xs", ENTER)}
        style={{ animationDelay: "120ms" }}
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex max-w-xl flex-col gap-1">
            <h2 className="text-base font-semibold">{copy.sectionsTitle}</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{copy.sectionsHint}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary tabular-nums">
              {fill(copy.count, { n: showing, total: HOME_SECTIONS.length })}
            </span>
            {updatedAt && updatedBy ? <LastChange template={copy.lastChange} iso={updatedAt} who={updatedBy} /> : null}
          </div>
        </header>
        <ul className="divide-y divide-border">
          {HOME_SECTIONS.map((section, index) => {
            const on = visible[section];
            const entry = copy.sections[section];
            return (
              <li key={section} className="flex items-center gap-4 px-5 py-4">
                <span className="w-6 shrink-0 font-code text-xs text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
                    on ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {on ? <Eye aria-hidden className="size-4" /> : <EyeOff aria-hidden className="size-4" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn("text-sm font-medium", !on && "text-muted-foreground")}>{entry.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{entry.description}</span>
                </span>
                <span
                  className={cn(
                    "hidden w-16 text-right text-xs font-medium sm:block",
                    on ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {on ? copy.visible : copy.hidden}
                </span>
                <Switch
                  checked={on}
                  disabled={pending === section}
                  onCheckedChange={(checked) => void change(section, checked)}
                  aria-label={fill(copy.toggle, { section: entry.name })}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
