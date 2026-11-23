"use client";

import { ArrowUpRight, Globe } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/studio/ui/tooltip";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { ROUTES } from "@/lib/shared/routes";

type SiteStatusCardProps = {
  copy: StudioShellContent["siteStatus"];
  /** The real maintenance flag (site_settings), read on the server. */
  maintenance: boolean;
  collapsed: boolean;
};

/** Public-site status at the bottom of the sidebar: live or in maintenance, with a link to open the site. */
export const SiteStatusCard = ({ copy, maintenance, collapsed }: SiteStatusCardProps) => {
  const status = maintenance ? copy.maintenance : copy.live;
  const dot = (
    <span aria-hidden className="relative flex size-2">
      <span className={cn("size-2 rounded-full", maintenance ? "bg-warning" : "bg-success")} />
    </span>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={ROUTES.home}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${copy.title}: ${status}. ${copy.viewSite}`}
            className="relative mx-auto grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Globe aria-hidden className="size-[18px]" />
            <span className="absolute top-1.5 right-1.5">{dot}</span>
          </a>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          {copy.title}: {status}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background/70 p-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-card text-muted-foreground shadow-xs">
          <Globe aria-hidden className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[0.6875rem] text-muted-foreground">{copy.title}</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            {dot}
            <span className="truncate">{status}</span>
          </span>
        </span>
      </div>
      <a
        href={ROUTES.home}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        {copy.viewSite}
        <ArrowUpRight aria-hidden className="size-3.5" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
};
