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
 * Launchpad's version control (docs/screens/STUDIO_LAUNCHPAD_BUSINESS.md):
 * pick a page, see its saved versions (newest first: who, when, which
 * sections differ from now) and restore one. Restoring saves the old content
 * as a new version, so the history keeps everything. The restore button asks
 * for a second click before it acts.
 */

type Copy = StudioShellContent["launchpad"]["versions"];
type Screen = { slug: string; name: string };
type Version = { version: number; savedAt: string; savedBy: string; changed: string[] };
type History = { current: number; versions: Version[] };

/** How long the restore button waits for its confirming click. */
const CONFIRM_MS = 4000;

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const Saved = ({ template, iso, who }: { template: string; iso: string; who: string }) => {
  const time = useRelativeTime(iso);
  return <>{fill(template, { time, who })}</>;
};

export const VersionHistory = ({
  copy,
  screens,
  sectionNames,
  initialSlug,
  initial,
}: {
  copy: Copy;
  screens: Screen[];
  /** Readable names of top-level sections, for "differs in". */
  sectionNames: Record<string, string>;
  initialSlug: string;
  initial: History;
}) => {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const [history, setHistory] = useState<History | null>(initial);
  const [loading, setLoading] = useState(false);
  const [armed, setArmed] = useState<number | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);
  const disarm = useRef<number | null>(null);

  useEffect(() => () => window.clearTimeout(disarm.current ?? undefined), []);

  const load = async (next: string) => {
    setLoading(true);
    const response = await fetch(`/api/studio/screens/${next}/versions`).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { ok: boolean; data: History } | null;
    setLoading(false);
    if (!response?.ok || !body?.ok) {
      toast.error(copy.failed);
      return;
    }
    setHistory(body.data);
  };

  const choose = (next: string) => {
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
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <header className="flex flex-col gap-3 border-b border-border p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <History aria-hidden className="size-4" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">{copy.title}</h2>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{copy.hint}</p>
          </div>
        </div>
        <div role="tablist" aria-label={copy.title} className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {screens.map((screen) => (
            <button
              key={screen.slug}
              type="button"
              role="tab"
              aria-selected={slug === screen.slug}
              onClick={() => choose(screen.slug)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                slug === screen.slug
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {screen.name}
            </button>
          ))}
        </div>
      </header>

      {loading || !history ? (
        <div className="flex justify-center p-10 text-muted-foreground">
          <LoaderCircle aria-hidden className="size-5 animate-spin" />
        </div>
      ) : history.versions.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">{copy.empty}</p>
      ) : (
        <ol className="divide-y divide-border">
          {history.versions.map((entry) => {
            const isCurrent = entry.version === history.current;
            return (
              <li key={entry.version} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 font-code text-xs font-semibold tabular-nums",
                    isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {fill(copy.version, { n: entry.version })}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm">
                    <Saved template={copy.savedBy} iso={entry.savedAt} who={entry.savedBy} />
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {isCurrent
                      ? copy.current
                      : entry.changed.length > 0
                        ? fill(copy.changed, {
                            list: entry.changed.map((key) => sectionNames[key] ?? key).join(", "),
                          })
                        : copy.same}
                  </span>
                </span>
                {isCurrent ? (
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                    {copy.current}
                  </span>
                ) : (
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
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
