"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/studio/ui/switch";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";

type SiteModeCardProps = { copy: StudioShellContent["editor"]; failed: string; initialMaintenance: boolean };

/** Switches the public site between live and maintenance (PUT /api/studio/settings/maintenance). */
export const SiteModeCard = ({ copy, failed, initialMaintenance }: SiteModeCardProps) => {
  const router = useRouter();
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [pending, setPending] = useState(false);

  const change = async (next: boolean) => {
    setPending(true);
    setMaintenance(next);
    const response = await fetch("/api/studio/settings/maintenance", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    }).catch(() => null);
    setPending(false);
    if (!response?.ok) {
      setMaintenance(!next);
      toast.error(failed);
      return;
    }
    toast.success(copy.siteMode.updated);
    router.refresh();
  };

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
