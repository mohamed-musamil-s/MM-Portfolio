"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, FileQuestion, LoaderCircle, PanelsTopLeft, RotateCcw, Search, Share2, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/studio/ui/button";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { ROUTES } from "@/lib/shared/routes";
import { ContentField, countFields } from "./ContentField";
import {
  fill,
  humanize,
  matchesQuery,
  pathKey,
  same,
  setAt,
  type JsonObject,
  type JsonValue,
  type Path,
} from "./content-paths";
import { SiteModeCard } from "./SiteModeCard";

export type EditableScreen = {
  slug: string;
  content: JsonObject;
  version: number;
  updatedAt: string;
  updatedBy: string;
};

type ContentEditorProps = {
  shell: StudioShellContent;
  screens: EditableScreen[];
  maintenance: boolean;
};

const SCREEN_ICONS: Record<string, typeof Wrench> = {
  shared: Share2,
  maintenance: Wrench,
  "not-found": FileQuestion,
};
const PREVIEW: Record<string, string> = { maintenance: ROUTES.maintenance, "not-found": ROUTES.notFound };

type Issue = { path: (string | number)[]; message: string; code?: string; minimum?: number; maximum?: number };
type SaveResponse =
  { ok: true; data: { version: number } } | { ok: false; error: { code: string; message: string; issues?: Issue[] } };

const noopSubscribe = () => () => undefined;
/** Local date-time, rendered only in the browser so server and client HTML match. */
const useFormattedTime = (iso: string) =>
  useSyncExternalStore(
    noopSubscribe,
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)),
    () => "",
  );

/** Plain-language message for a validation issue (falls back to the server's wording). */
const friendly = (issue: Issue, copy: StudioShellContent["editor"]): string => {
  if (issue.code === "too_small") {
    return issue.minimum === 1 ? copy.required : fill(copy.tooShort, { min: issue.minimum ?? 1 });
  }
  if (issue.code === "too_big" && issue.maximum !== undefined) {
    return fill(copy.tooLong, { max: issue.maximum });
  }
  return issue.message;
};

/**
 * Content Forge: pick a screen, edit its fields, save. Drafts are kept per
 * screen while you switch; a save bar appears as soon as something changes
 * (Ctrl/⌘ + S saves). Validation errors from the server are shown on the
 * fields; a version conflict offers a reload.
 */
export const ContentEditor = ({ shell, screens: initial, maintenance }: ContentEditorProps) => {
  const copy = shell.editor;
  const router = useRouter();
  const [screens, setScreens] = useState(initial);
  const [drafts, setDrafts] = useState<Record<string, JsonObject>>(() =>
    Object.fromEntries(initial.map((screen) => [screen.slug, screen.content])),
  );
  const [selected, setSelected] = useState(initial[0]?.slug ?? "");
  const [query, setQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);

  const screen = screens.find((item) => item.slug === selected);
  const draft = drafts[selected];
  const dirty = useMemo(
    () => new Set(screens.filter((item) => !same(drafts[item.slug] ?? {}, item.content)).map((item) => item.slug)),
    [drafts, screens],
  );
  const isDirty = dirty.has(selected);

  const update = useCallback(
    (path: Path, value: JsonValue) => {
      setDrafts((current) => ({ ...current, [selected]: setAt(current[selected] ?? {}, path, value) as JsonObject }));
      setErrors((current) => {
        const key = pathKey(path);
        if (!(key in current)) {
          return current;
        }
        const next = { ...current };
        delete next[key];
        return next;
      });
    },
    [selected],
  );

  const discard = () => {
    if (screen) {
      setDrafts((current) => ({ ...current, [selected]: screen.content }));
      setErrors({});
    }
  };

  const save = useCallback(async () => {
    if (!screen || !draft || saving || !dirty.has(selected)) {
      return;
    }
    setSaving(true);
    const response = await fetch(`/api/studio/screens/${screen.slug}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: draft, version: screen.version }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as SaveResponse | null;
    setSaving(false);

    if (body?.ok) {
      setScreens((current) =>
        current.map((item) =>
          item.slug === screen.slug
            ? {
                ...item,
                content: draft,
                version: body.data.version,
                updatedAt: new Date().toISOString(),
                updatedBy: shell.owner.name,
              }
            : item,
        ),
      );
      setErrors({});
      toast.success(copy.saved);
      router.refresh();
      return;
    }
    if (body && !body.ok && body.error.code === "version_conflict") {
      setConflict(true);
      return;
    }
    if (body && !body.ok && body.error.issues) {
      setErrors(Object.fromEntries(body.error.issues.map((issue) => [issue.path.join("."), friendly(issue, copy)])));
      toast.error(copy.invalid);
      return;
    }
    toast.error(copy.failed);
  }, [copy, dirty, draft, router, saving, screen, selected, shell.owner.name]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "s" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [save]);

  const sections = draft ? Object.entries(draft).filter(([key, value]) => matchesQuery(key, value, query)) : [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">{shell.modules.content.title}</h1>
        <p className="text-sm text-muted-foreground">{shell.modules.content.description}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left: site mode + screens */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <SiteModeCard copy={copy} failed={copy.failed} initialMaintenance={maintenance} />
          <section className="rounded-2xl border border-border bg-card p-2 shadow-xs">
            <h2 className="px-2 pt-2 pb-1 text-[0.625rem] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
              {copy.screensTitle}
            </h2>
            <ul className="flex flex-col gap-1">
              {screens.map((item) => {
                const Icon = SCREEN_ICONS[item.slug] ?? PanelsTopLeft;
                const meta = copy.screens[item.slug];
                const active = item.slug === selected;
                return (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(item.slug);
                        setErrors({});
                        setConflict(false);
                      }}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors duration-200",
                        active ? "bg-primary/[0.07]" : "hover:bg-muted/70",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
                          active
                            ? "bg-linear-to-br from-primary to-aurora-indigo text-primary-foreground shadow-sm shadow-primary/30"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon aria-hidden className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <span className="truncate">{meta?.name ?? humanize(item.slug)}</span>
                          {dirty.has(item.slug) ? <span className="size-1.5 shrink-0 rounded-full bg-warning" /> : null}
                        </span>
                        <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                          {meta?.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>

        {/* Right: editor */}
        {screen && draft ? (
          <section
            key={screen.slug}
            className="flex min-w-0 animate-in flex-col gap-4 duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
          >
            <ScreenHeader screen={screen} copy={copy} query={query} onQuery={setQuery} />

            {conflict ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
                <span>{copy.conflict}</span>
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  <RotateCcw aria-hidden />
                  {copy.reload}
                </Button>
              </div>
            ) : null}

            {sections.length > 1 && !query ? (
              <nav aria-label={copy.screensTitle} className="flex flex-wrap gap-1.5">
                {sections.map(([key]) => (
                  <a
                    key={key}
                    href={`#section-${key}`}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {humanize(key)}
                  </a>
                ))}
              </nav>
            ) : null}

            {sections.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
                {copy.noFields}
              </p>
            ) : (
              sections.map(([key, value]) => (
                <section
                  key={key}
                  id={`section-${key}`}
                  className="scroll-mt-24 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-16px_rgb(15_23_42/0.12)] sm:p-5"
                >
                  <header className="mb-4 flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary/12 to-aurora-indigo/12 text-sm font-semibold text-primary">
                      {humanize(key).charAt(0)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <h3 className="truncate text-sm font-semibold">{humanize(key)}</h3>
                      <span className="text-xs text-muted-foreground">
                        {countFields(value) === 1
                          ? copy.fieldCountOne
                          : fill(copy.fieldCount, { n: countFields(value) })}
                      </span>
                    </span>
                    {same(value, screen.content[key]) ? null : (
                      <span className="flex items-center gap-1.5 rounded-full bg-warning/12 px-2 py-0.5 text-[0.6875rem] font-semibold text-warning">
                        <span className="size-1.5 rounded-full bg-warning" />
                        {copy.edited}
                      </span>
                    )}
                  </header>
                  <ContentField
                    name={key}
                    path={[key]}
                    value={value}
                    saved={screen.content[key]}
                    onChange={update}
                    errors={errors}
                    query={query}
                    copy={copy}
                  />
                </section>
              ))
            )}

            <AnimatePresence>
              {isDirty ? (
                <motion.div
                  className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-foreground px-4 py-3 text-card shadow-2xl"
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 24, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="size-2 rounded-full bg-warning" />
                    {copy.unsaved}
                  </span>
                  <span className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={discard}
                      disabled={saving}
                      className="text-card hover:bg-card/10 hover:text-card"
                    >
                      {copy.discard}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void save()}
                      disabled={saving}
                      className="bg-card text-foreground hover:bg-card/90"
                    >
                      {saving ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
                      {saving ? copy.saving : copy.save}
                      {saving ? null : (
                        <kbd className="ml-1 rounded border border-border px-1 text-[0.625rem] text-muted-foreground">
                          ⌘S
                        </kbd>
                      )}
                    </Button>
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
        ) : null}
      </div>
    </div>
  );
};

const ScreenHeader = ({
  screen,
  copy,
  query,
  onQuery,
}: {
  screen: EditableScreen;
  copy: StudioShellContent["editor"];
  query: string;
  onQuery: (value: string) => void;
}) => {
  const time = useFormattedTime(screen.updatedAt);
  const meta = copy.screens[screen.slug];
  const preview = PREVIEW[screen.slug];
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{meta?.name ?? humanize(screen.slug)}</h2>
        <p className="text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground tabular-nums">
            {fill(copy.version, { n: screen.version })}
          </span>
          {time ? <span className="ml-2">{fill(copy.lastSaved, { time, who: screen.updatedBy })}</span> : null}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-background/70 px-2.5 text-sm transition-colors focus-within:border-ring focus-within:bg-card focus-within:ring-3 focus-within:ring-ring/15 sm:w-56">
          <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <span className="sr-only">{copy.searchFields}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={copy.searchFields}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </label>
        {preview ? (
          <Button asChild variant="outline" size="sm" className="h-9 rounded-lg">
            <a href={preview} target="_blank" rel="noopener noreferrer">
              {copy.preview}
              <ArrowUpRight aria-hidden />
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
};
