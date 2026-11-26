"use client";

import { ArrowUpRight, Eye, EyeOff, LoaderCircle, Lock, PanelsTopLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SECTION_ICONS } from "@/components/studio/content/section-icons";
import { useSiteMode } from "@/components/studio/content/use-site-mode";
import { Button } from "@/components/studio/ui/button";
import { Switch } from "@/components/studio/ui/switch";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { cn } from "@/lib/shared/cn";
import { HOME_SECTIONS, type HomeSection, type SectionVisibility } from "@/lib/shared/content/home-sections";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { ROUTES } from "@/lib/shared/routes";
import { VersionHistory, type HistoryScreen, type ScreenHistory } from "./VersionHistory";

/*
 * Launchpad (docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md): the site's launch
 * controls, laid out as a console.
 * - A status strip: site mode (with its switch), sections showing, last save.
 * - The page outline: a miniature of the home page. Each section is a block
 *   that switches on and off (PUT /api/studio/settings/sections); the navbar,
 *   hero and footer are fixed.
 * - Version history as a timeline, per page.
 */

type LastSave = { screen: string; version: number; at: string; by: string };

type LaunchpadProps = {
  shell: StudioShellContent;
  initial: SectionVisibility;
  updatedAt: string | null;
  updatedBy: string | null;
  maintenance: boolean;
  lastSave: LastSave | null;
  history: { screens: HistoryScreen[]; initialSlug: string; initial: ScreenHistory };
};

const ENTER =
  "animate-in fill-mode-both duration-500 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none";

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const Relative = ({ template, iso, values }: { template: string; iso: string; values: Record<string, string> }) => {
  const time = useRelativeTime(iso);
  return <>{fill(template, { ...values, time })}</>;
};

const Readout = ({ label, children, aside }: { label: string; children: React.ReactNode; aside?: React.ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-3 p-5">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      {aside}
    </div>
    {children}
  </div>
);

const SiteModeReadout = ({ shell, initial }: { shell: StudioShellContent; initial: boolean }) => {
  const { siteMode } = shell.editor;
  const { maintenance, pending, change } = useSiteMode(initial, {
    updated: siteMode.updated,
    failed: shell.editor.failed,
  });
  return (
    <Readout
      label={siteMode.title}
      aside={
        <Switch
          checked={maintenance}
          disabled={pending}
          onCheckedChange={(checked) => void change(checked)}
          aria-label={siteMode.toggle}
        />
      }
    >
      <p className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
        <span
          aria-hidden
          className={cn(
            "size-2.5 rounded-full ring-4",
            maintenance ? "bg-warning ring-warning/15" : "bg-success ring-success/15",
          )}
        />
        {maintenance ? shell.siteStatus.maintenance : shell.siteStatus.live}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {maintenance ? siteMode.maintenance : siteMode.live}
      </p>
    </Readout>
  );
};

/** A fixed part of the page in the outline: always shown, not switchable. */
const FixedBlock = ({ name, note, tall }: { name: string; note: string; tall?: boolean }) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 px-3 text-xs text-muted-foreground",
      tall ? "py-4" : "py-2",
    )}
  >
    <Lock aria-hidden className="size-3.5 shrink-0" />
    <span className="font-medium text-foreground/80">{name}</span>
    <span className="ml-auto">{note}</span>
  </div>
);

export const Launchpad = ({ shell, initial, updatedAt, updatedBy, maintenance, lastSave, history }: LaunchpadProps) => {
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className={cn("flex flex-wrap items-end justify-between gap-4", ENTER)}>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{page.description}</p>
        </div>
        <Button variant="outline" asChild>
          <a href={ROUTES.home} target="_blank" rel="noopener noreferrer">
            {copy.status.viewSite}
            <ArrowUpRight aria-hidden />
          </a>
        </Button>
      </header>

      {/* Status strip: three readouts side by side. */}
      <section
        className={cn(
          "grid divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-xs md:grid-cols-3 md:divide-x md:divide-y-0",
          ENTER,
        )}
        style={{ animationDelay: "60ms" }}
      >
        <SiteModeReadout shell={shell} initial={maintenance} />
        <Readout label={copy.status.sections}>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {showing}
            <span className="text-base font-medium text-muted-foreground"> / {HOME_SECTIONS.length}</span>
          </p>
          <div aria-hidden className="flex gap-1">
            {HOME_SECTIONS.map((section) => (
              <span
                key={section}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  visible[section] ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </Readout>
        <Readout label={copy.status.lastSave}>
          {lastSave ? (
            <>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {fill(copy.versions.version, { n: lastSave.version })}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                <Relative template={copy.status.lastSaveOn} iso={lastSave.at} values={{ screen: lastSave.screen }} />
                {" · "}
                {lastSave.by}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{copy.versions.empty}</p>
          )}
        </Readout>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Page outline: the home page in miniature. */}
        <section
          className={cn("flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs", ENTER)}
          style={{ animationDelay: "120ms" }}
        >
          <header className="flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <PanelsTopLeft aria-hidden className="size-4 text-primary" />
              {copy.sectionsTitle}
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{copy.sectionsHint}</p>
            {updatedAt && updatedBy ? (
              <p className="text-xs text-muted-foreground/80">
                <Relative template={copy.lastChange} iso={updatedAt} values={{ who: updatedBy }} />
              </p>
            ) : null}
          </header>

          <div className="overflow-hidden rounded-xl border border-border bg-muted/50">
            {/* Browser chrome. */}
            <div className="flex items-center gap-3 border-b border-border bg-card/70 px-3 py-2">
              <span aria-hidden className="flex gap-1.5">
                <span className="size-2 rounded-full bg-muted-foreground/25" />
                <span className="size-2 rounded-full bg-muted-foreground/25" />
                <span className="size-2 rounded-full bg-muted-foreground/25" />
              </span>
              <span className="flex-1 truncate rounded-md bg-muted px-2.5 py-1 text-center font-code text-[0.6875rem] text-muted-foreground">
                {copy.outline.address}
              </span>
            </div>

            <ol className="flex flex-col gap-1.5 p-3">
              <li>
                <FixedBlock name={copy.outline.nav} note={copy.outline.fixed} />
              </li>
              <li>
                <FixedBlock name={copy.outline.hero} note={copy.outline.fixed} tall />
              </li>
              {HOME_SECTIONS.map((section) => {
                const on = visible[section];
                const entry = copy.sections[section];
                const Icon = SECTION_ICONS[section] ?? PanelsTopLeft;
                const busy = pending === section;
                return (
                  <li key={section}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={fill(copy.toggle, { section: entry.name })}
                      disabled={busy}
                      onClick={() => void change(section, !on)}
                      className={cn(
                        "group/block flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-[background-color,border-color,opacity] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.99]",
                        on
                          ? "border-primary/25 bg-card shadow-xs hover:border-primary/50"
                          : "border-dashed border-border bg-transparent opacity-70 hover:opacity-100",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-md transition-colors duration-200",
                          on ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon aria-hidden className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            on
                              ? "text-foreground"
                              : "text-muted-foreground line-through decoration-muted-foreground/40",
                          )}
                        >
                          {entry.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">{entry.description}</span>
                      </span>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
                          on ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {busy ? (
                          <LoaderCircle aria-hidden className="size-3 animate-spin" />
                        ) : on ? (
                          <Eye aria-hidden className="size-3" />
                        ) : (
                          <EyeOff aria-hidden className="size-3" />
                        )}
                        {on ? copy.visible : copy.hidden}
                      </span>
                    </button>
                  </li>
                );
              })}
              <li>
                <FixedBlock name={copy.outline.footer} note={copy.outline.fixed} />
              </li>
            </ol>
          </div>
        </section>

        <div className={ENTER} style={{ animationDelay: "180ms" }}>
          <VersionHistory
            copy={copy.versions}
            screens={history.screens}
            sectionNames={Object.fromEntries(
              Object.entries(shell.editor.sections).map(([key, entry]) => [key, entry.name]),
            )}
            initialSlug={history.initialSlug}
            initial={history.initial}
          />
        </div>
      </div>
    </div>
  );
};
