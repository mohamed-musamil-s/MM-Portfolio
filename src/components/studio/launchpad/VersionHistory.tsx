"use client";

import { History, LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/studio/ui/button";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { cn } from "@/lib/shared/cn";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";

/*
 * Launchpad's version control (docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md §6):
 * pick a page, then its saved versions as a timeline (newest on top: who,
 * when, which sections differ from now) with a restore on each. Restoring
 * saves the old content as a new version, so the history keeps everything.
 * The restore button asks for a second click before it acts.
 */

type Copy = StudioShellContent["launchpad"]["versions"];
export type HistoryScreen = { slug: string; name: string; version: number };
type Version = { version: number; savedAt: string; savedBy: string; changed: string[] };
export type ScreenHistory = { current: number; versions: Version[] };

/** How long the restore button waits for its confirming click. */
const CONFIRM_MS = 4000;

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const Saved = ({ template, iso, who }: { template: string; iso: string; who: string }) => {
  const time = useRelativeTime(iso);
  return (
    <time dateTime={iso} className="truncate">
      {fill(template, { time, who })}
    </time>
  );
};

export const VersionHistory = ({
  copy,
  screens,
  sectionNames,
  initialSlug,
  initial,
}: {
  copy: Copy;
  screens: HistoryScreen[];
  /** Readable names of top-level sections, for "differs in". */
  sectionNames: Record<string, string>;
  initialSlug: string;
  initial: ScreenHistory;
}) => {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const [history, setHistory] = useState<ScreenHistory | null>(initial);
  const [currents, setCurrents] = useState(() => Object.fromEntries(screens.map((item) => [item.slug, item.version])));
  const [loading, setLoading] = useState(false);
  const [armed, setArmed] = useState<number | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);
  const disarm = useRef<number | null>(null);

  useEffect(() => () => window.clearTimeout(disarm.current ?? undefined), []);

  const load = async (next: string) => {
    setLoading(true);
    const response = await fetch(`/api/studio/screens/${next}/versions`).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { ok: boolean; data: ScreenHistory } | null;
    setLoading(false);
    if (!response?.ok || !body?.ok) {
      toast.error(copy.failed);
      return;
    }
    setHistory(body.data);
    setCurrents((value) => ({ ...value, [next]: body.data.current }));
  };

  const choose = (next: string) => {
    if (next === slug) return;
    setSlug(next);
    setArmed(null);
    setHistory(null);
    void load(next);
  };

  const restore = async (version: number) => {
    if (!history) return;
    if (armed !== version) {
      // First click arms the button; a second click within CONFIRM_MS restores.
      setArmed(version);
      window.clearTimeout(disarm.current ?? undefined);
      disarm.current = window.setTimeout(() => setArmed(null), CONFIRM_MS);
      return;
    }
    setArmed(null);
    setRestoring(version);
    const response = await fetch(`/api/studio/screens/${slug}/versions/${version}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expectedVersion: history.current }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { ok: boolean; data?: { version: number } } | null;
    setRestoring(null);
    if (!response?.ok || !body?.data) {
      toast.error(
        response?.status === 409 ? copy.conflict : response?.status === 422 ? copy.incompatible : copy.failed,
      );
      return;
    }
    toast.success(fill(copy.restored, { n: version, m: body.data.version }));
    await load(slug);
    router.refresh();
  };

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <header className="flex flex-col gap-4 border-b border-border p-5">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <History aria-hidden className="size-4 text-primary" />
            {copy.title}
          </h2>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{copy.hint}</p>
        </div>
        {/* Page picker: each page with its current version. */}
        <div role="tablist" aria-label={copy.title} className="flex flex-wrap gap-2">
          {screens.map((screen) => {
            const active = slug === screen.slug;
            return (
              <button
                key={screen.slug}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => choose(screen.slug)}
                className={cn(
                  "flex items-center gap-2 rounded-full border py-1 pr-1 pl-3 text-xs font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                {screen.name}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-code text-[0.625rem] tabular-nums",
                    active ? "bg-primary-foreground/20" : "bg-muted",
                  )}
                >
                  v{currents[screen.slug] ?? screen.version}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {loading || !history ? (
        <div className="flex justify-center p-12 text-muted-foreground">
          <LoaderCircle aria-hidden className="size-5 animate-spin" />
        </div>
      ) : history.versions.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">{copy.empty}</p>
      ) : (
        <ol className="relative flex max-h-152 flex-col overflow-y-auto px-5 py-4">
          {history.versions.map((entry, index) => {
            const isCurrent = entry.version === history.current;
            const last = index === history.versions.length - 1;
            return (
              <li key={entry.version} className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4">
                {/* The timeline: a node per version on a running line. */}
                <span aria-hidden className="relative flex justify-center">
                  {last ? null : <span className="absolute top-5 bottom-0 w-px bg-border" />}
                  {index === 0 ? null : <span className="absolute top-0 h-5 w-px bg-border" />}
                  <span
                    className={cn(
                      "relative mt-3.5 rounded-full",
                      isCurrent
                        ? "size-3 bg-primary ring-4 ring-primary/15"
                        : "size-2.5 border-2 border-muted-foreground/40 bg-card",
                    )}
                  />
                </span>
                <div
                  className={cn(
                    "mb-3 flex flex-col gap-2 rounded-xl border p-3.5 transition-colors duration-200",
                    isCurrent
                      ? "border-primary/25 bg-primary/5"
                      : "border-transparent hover:border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-code text-sm font-semibold tabular-nums">
                      {fill(copy.version, { n: entry.version })}
                    </span>
                    {isCurrent ? (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-success">
                        {copy.current}
                      </span>
                    ) : null}
                    <span className="flex min-w-0 flex-1 text-xs text-muted-foreground">
                      <Saved template={copy.savedBy} iso={entry.savedAt} who={entry.savedBy} />
                    </span>
                    {isCurrent ? null : (
                      <Button
                        size="sm"
                        variant={armed === entry.version ? "default" : "outline"}
                        disabled={restoring !== null}
                        onClick={() => void restore(entry.version)}
                      >
                        {restoring === entry.version ? (
                          <LoaderCircle aria-hidden className="animate-spin" />
                        ) : (
                          <RotateCcw aria-hidden />
                        )}
                        {armed === entry.version ? copy.confirm : copy.restore}
                      </Button>
                    )}
                  </div>
                  {isCurrent ? null : entry.changed.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[0.6875rem] text-muted-foreground">{copy.changedLabel}</span>
                      {entry.changed.map((key) => (
                        <span
                          key={key}
                          className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[0.6875rem] font-medium"
                        >
                          {sectionNames[key] ?? key}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[0.6875rem] text-muted-foreground">{copy.same}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
