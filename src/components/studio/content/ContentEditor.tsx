"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Eye,
  FileQuestion,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  PencilLine,
  RotateCcw,
  Search,
  Share2,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type FocusEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/studio/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/studio/ui/tooltip";
import { SHARED_CONSUMERS, isPreviewableScreen, type PreviewableScreen } from "@/lib/shared/content/preview-protocol";
import { formatDateUtc } from "@/lib/shared/format";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import { ContentField, countFields } from "./ContentField";
import {
  fill,
  getAt,
  humanize,
  isIsoDate,
  matchesQuery,
  parsePathKey,
  pathKey,
  same,
  setAt,
  type JsonObject,
  type JsonValue,
  type Path,
} from "./content-paths";
import { PreviewPanel } from "./PreviewPanel";
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
  const [screensOpen, setScreensOpen] = useState(true);
  /** Below xl the fields and the preview share one column: this picks which one shows. */
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  /** The field being edited, for the preview outline. */
  const [focusPath, setFocusPath] = useState<Path | null>(null);

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
  const targets: PreviewableScreen[] =
    selected === "shared" ? [...SHARED_CONSUMERS] : isPreviewableScreen(selected) ? [selected] : [];
  const focusValue = focusPath ? getAt(draft, focusPath) : undefined;

  const selectScreen = (slug: string) => {
    setSelected(slug);
    setErrors({});
    setConflict(false);
    setFocusPath(null);
  };

  const onFieldFocus = (event: FocusEvent<HTMLElement>) => {
    const path = event.target instanceof HTMLElement ? event.target.dataset.path : undefined;
    setFocusPath(path ? parsePathKey(path) : null);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 xl:min-h-0 xl:flex-1">
      <header className="flex shrink-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{shell.modules.content.title}</h1>
        <p className="text-sm text-muted-foreground">{shell.modules.content.description}</p>
      </header>

      <div
        className={cn(
          // From xl the three columns fill the viewport and each scrolls on its own.
          "grid items-start gap-5 xl:min-h-0 xl:flex-1 xl:grid-rows-[minmax(0,1fr)] xl:items-stretch",
          screensOpen
            ? "lg:grid-cols-[256px_minmax(0,1fr)] xl:grid-cols-[256px_minmax(0,1fr)_minmax(380px,0.95fr)]"
            : "lg:grid-cols-[60px_minmax(0,1fr)] xl:grid-cols-[60px_minmax(0,1fr)_minmax(380px,1.1fr)]",
        )}
      >
        {/* Left: screens (collapsible) */}
        <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-0 lg:row-span-3 lg:gap-4 xl:static xl:row-span-1 xl:min-h-0 xl:[scrollbar-width:thin] xl:overflow-y-auto">
          {/* Hidden only with the desktop collapse; phones always show it. */}
          <div className={cn(!screensOpen && "lg:hidden")}>
            <SiteModeCard copy={copy} failed={copy.failed} initialMaintenance={maintenance} />
          </div>
          <ScreensList
            copy={copy}
            screens={screens}
            selected={selected}
            dirty={dirty}
            open={screensOpen}
            onToggle={() => setScreensOpen((open) => !open)}
            onSelect={selectScreen}
          />
        </aside>

        {/* Below xl: switch between the fields and the preview (both show side by side from xl). */}
        {targets.length > 0 ? (
          <div className="sticky top-0 z-20 -mx-4 bg-background/85 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:col-start-2 lg:mx-0 lg:px-0 xl:hidden">
            <div
              role="tablist"
              aria-label={copy.previewPanel.title}
              className="grid grid-cols-2 rounded-xl bg-muted p-1"
            >
              {(["edit", "preview"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  aria-selected={mobileView === view}
                  onClick={() => setMobileView(view)}
                  className={cn(
                    "flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors",
                    mobileView === view
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {view === "edit" ? (
                    <PencilLine aria-hidden className="size-4" />
                  ) : (
                    <Eye aria-hidden className="size-4" />
                  )}
                  {view === "edit" ? copy.previewPanel.editTab : copy.previewPanel.previewTab}
                  {view === "edit" && isDirty ? <span className="size-1.5 rounded-full bg-warning" /> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Centre: the screen's fields */}
        {screen && draft ? (
          <section
            key={screen.slug}
            onFocusCapture={onFieldFocus}
            className={cn(
              targets.length > 0 && mobileView === "preview" && "hidden xl:flex",
              "min-w-0 lg:col-start-2 xl:col-start-auto xl:flex xl:min-h-0 xl:flex-col",
            )}
          >
            <div className="@container flex min-w-0 animate-in flex-col gap-4 duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none xl:-mx-2 xl:min-h-0 xl:flex-1 xl:[scrollbar-width:thin] xl:overflow-y-auto xl:px-2 xl:pb-2">
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
                    className="scroll-mt-4 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-16px_rgb(15_23_42/0.12)] sm:p-5"
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
            </div>
          </section>
        ) : null}

        {/* Right: live preview of the page(s) this screen feeds */}
        {targets.length > 0 ? (
          <aside
            className={cn(
              "min-w-0 lg:col-start-2 xl:col-start-auto xl:min-h-0",
              mobileView === "edit" && "hidden xl:block",
            )}
          >
            <PreviewPanel
              key={targets.join()}
              copy={copy}
              targets={targets}
              drafts={drafts}
              focusTexts={previewTexts(focusValue)}
              focusLabel={focusPath ? fieldLabel(focusPath) : null}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
};

/** Texts to look for on the page for a field value (dates as the page prints them). */
const previewTexts = (value: JsonValue | undefined): string[] => {
  if (typeof value === "number") {
    return [String(value)];
  }
  if (typeof value !== "string") {
    return [];
  }
  return isIsoDate(value) ? [formatDateUtc(new Date(value))] : [value];
};

/** "Status › Kicker", "Lines 2". */
const fieldLabel = (path: Path): string =>
  path.map((segment) => (typeof segment === "number" ? String(segment + 1) : humanize(segment))).join(" › ");

/** Screens column; collapses to icons like the side navigation. */
const ScreensList = ({
  copy,
  screens,
  selected,
  dirty,
  open,
  onToggle,
  onSelect,
}: {
  copy: StudioShellContent["editor"];
  screens: EditableScreen[];
  selected: string;
  dirty: Set<string>;
  open: boolean;
  onToggle: () => void;
  onSelect: (slug: string) => void;
}) => {
  const toggleLabel = open ? copy.previewPanel.hideScreens : copy.previewPanel.showScreens;
  const ToggleIcon = open ? PanelLeftClose : PanelLeftOpen;
  return (
    <section className="rounded-2xl border border-border bg-card p-1.5 shadow-xs lg:p-2">
      {/* Title and the hide toggle are desktop-only; phones get a scrolling row of screens. */}
      <div className={cn("hidden items-center gap-2 pb-1 lg:flex", open ? "px-2 pt-1" : "justify-center")}>
        {open ? (
          <h2 className="flex-1 text-[0.625rem] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
            {copy.screensTitle}
          </h2>
        ) : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggle}
              aria-label={toggleLabel}
              aria-expanded={open}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <ToggleIcon aria-hidden className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{toggleLabel}</TooltipContent>
        </Tooltip>
      </div>
      <ul className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
        {screens.map((item) => {
          const Icon = SCREEN_ICONS[item.slug] ?? PanelsTopLeft;
          const meta = copy.screens[item.slug];
          const name = meta?.name ?? humanize(item.slug);
          const active = item.slug === selected;
          const button = (
            <button
              type="button"
              onClick={() => onSelect(item.slug)}
              aria-current={active ? "true" : undefined}
              aria-label={open ? undefined : name}
              className={cn(
                "relative flex items-center gap-2.5 rounded-xl py-1.5 pr-3 pl-1.5 text-left whitespace-nowrap transition-colors duration-200 lg:w-full lg:whitespace-normal",
                open ? "lg:items-start lg:gap-3 lg:p-2.5" : "lg:justify-center lg:p-1.5",
                active ? "bg-primary/[0.07]" : "hover:bg-muted/70",
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg transition-colors lg:size-9",
                  active
                    ? "bg-linear-to-br from-primary to-aurora-indigo text-primary-foreground shadow-sm shadow-primary/30"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon aria-hidden className="size-4" />
              </span>
              <span className={cn("flex min-w-0 flex-col lg:flex-1", !open && "lg:hidden")}>
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="truncate">{name}</span>
                  {dirty.has(item.slug) ? <span className="size-1.5 shrink-0 rounded-full bg-warning" /> : null}
                </span>
                <span className="hidden text-xs leading-snug text-muted-foreground lg:line-clamp-2">
                  {meta?.description}
                </span>
              </span>
              {!open && dirty.has(item.slug) ? (
                <span className="absolute top-1.5 right-1.5 hidden size-2 rounded-full bg-warning ring-2 ring-card lg:block" />
              ) : null}
            </button>
          );
          return (
            <li key={item.slug} className="shrink-0 lg:shrink">
              {open ? (
                button
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{name}</TooltipContent>
                </Tooltip>
              )}
            </li>
          );
        })}
      </ul>
    </section>
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
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{meta?.name ?? humanize(screen.slug)}</h2>
        <p className="text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground tabular-nums">
            {fill(copy.version, { n: screen.version })}
          </span>
          {time ? <span className="ml-2">{fill(copy.lastSaved, { time, who: screen.updatedBy })}</span> : null}
        </p>
      </div>
      <div className="flex w-full items-center gap-2 @2xl:w-auto">
        <label className="flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-background/70 px-2.5 text-sm transition-colors focus-within:border-ring focus-within:bg-card focus-within:ring-3 focus-within:ring-ring/15 @2xl:w-56">
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
      </div>
    </div>
  );
};
