"use client";

import { Switch } from "@/components/studio/ui/switch";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { useSiteMode } from "./use-site-mode";

type SiteModeCardProps = { copy: StudioShellContent["editor"]; failed: string; initialMaintenance: boolean };

/** Switches the public site between live and maintenance (PUT /api/studio/settings/maintenance). */
export const SiteModeCard = ({ copy, failed, initialMaintenance }: SiteModeCardProps) => {
  const { maintenance, pending, change } = useSiteMode(initialMaintenance, { updated: copy.siteMode.updated, failed });

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", maintenance ? "bg-warning" : "bg-success")} />
          <h2 className="text-sm font-semibold">{copy.siteMode.title}</h2>
        </div>
        <Switch
          checked={maintenance}
          disabled={pending}
          onCheckedChange={(checked) => void change(checked)}
          aria-label={copy.siteMode.toggle}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {maintenance ? copy.siteMode.maintenance : copy.siteMode.live}
      </p>
    </section>
  );
};
