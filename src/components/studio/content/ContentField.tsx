"use client";

import {
  AlignLeft,
  CalendarClock,
  CircleAlert,
  Hash,
  Layers,
  List,
  Plus,
  RotateCcw,
  ToggleRight,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Switch } from "@/components/studio/ui/switch";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import {
  blankLike,
  fill,
  humanize,
  isIsoDate,
  isObject,
  isoToLocalInput,
  localInputToIso,
  matchesQuery,
  pathKey,
  same,
  type JsonValue,
  type Path,
} from "./content-paths";

type Copy = StudioShellContent["editor"];

type FieldProps = {
  name: string | number;
  path: Path;
  value: JsonValue;
  /** The last saved value at this path, to mark and undo edits. */
  saved: JsonValue | undefined;
  onChange: (path: Path, value: JsonValue) => void;
  errors: Record<string, string>;
  query: string;
  copy: Copy;
};

const LONG_TEXT = 70;
const fieldId = (path: Path) => `field-${path.join("-")}`;

/** Child of a saved group or list, if it exists. */
const savedChild = (saved: JsonValue | undefined, key: string | number): JsonValue | undefined => {
  if (Array.isArray(saved) && typeof key === "number") {
    return saved[key];
  }
  if (isObject(saved) && typeof key === "string") {
    return saved[key];
  }
  return undefined;
};

/** Bare control inside a tile: the tile draws the border, background and focus ring. */
const BARE =
  "w-full min-w-0 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/70";

/**
 * The frame every field sits in: a soft filled tile with a type icon and the
 * label on top. It lifts to white with an accent ring while you type, turns
 * red when invalid, and carries an amber edge plus an undo button once edited.
 * Hover only changes colour.
 */
const FieldTile = ({
  label,
  htmlFor,
  icon: Icon,
  error,
  meta,
  edited,
  onReset,
  copy,
  inline = false,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  icon: LucideIcon;
  error?: string;
  meta?: ReactNode;
  edited: boolean;
  onReset: () => void;
  copy: Copy;
  /** Label and control on one row (switches). */
  inline?: boolean;
  className?: string;
  children: ReactNode;
}) => {
  // A list has no single control to point at, so its title is plain text.
  const LabelTag = htmlFor ? "label" : "span";
  return (
    <div className="flex flex-col gap-1.5">
      <div
        data-invalid={error ? "" : undefined}
        className={cn(
          "group/field relative overflow-hidden rounded-xl border border-transparent bg-muted/60 px-3.5 pt-2.5 pb-2.5 transition-[background-color,border-color,box-shadow] duration-200",
          "hover:not-focus-within:bg-muted",
          "focus-within:border-primary/45 focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/10",
          "data-invalid:border-destructive/50 data-invalid:bg-destructive/[0.04] data-invalid:focus-within:ring-destructive/10",
          inline && "flex items-center gap-3 py-3",
          className,
        )}
      >
        {edited ? <span aria-hidden className="absolute inset-y-2.5 left-0 w-[3px] rounded-r-full bg-warning" /> : null}
        <div className={cn("flex min-h-5 items-center gap-1.5", inline ? "flex-1" : "mb-1")}>
          <Icon
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground/80 transition-colors group-focus-within/field:text-primary group-data-invalid/field:text-destructive"
          />
          <LabelTag
            htmlFor={htmlFor}
            className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground transition-colors group-focus-within/field:text-primary group-data-invalid/field:text-destructive"
          >
            {label}
          </LabelTag>
          {edited ? (
            <>
              <span className="rounded-full bg-warning/12 px-1.5 py-px text-[0.625rem] font-semibold text-warning">
                {copy.edited}
              </span>
              <button
                type="button"
                onClick={onReset}
                aria-label={copy.resetField}
                title={copy.resetField}
                className="grid size-5 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                <RotateCcw aria-hidden className="size-3" />
              </button>
            </>
          ) : null}
          {meta ? <span className="shrink-0 text-[0.6875rem] text-muted-foreground tabular-nums">{meta}</span> : null}
        </div>
        {children}
      </div>
      {error ? (
        <p className="flex items-center gap-1.5 px-1 text-xs text-destructive">
          <CircleAlert aria-hidden className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
};

/** Text, long text, date-time, number or on/off, chosen from the value itself. */
const LeafField = ({ name, path, value, saved, onChange, errors, copy }: FieldProps) => {
  const id = fieldId(path);
  const error = errors[pathKey(path)];
  const label = humanize(name);
  const invalid = error ? true : undefined;
  const edited = saved !== undefined && !same(value, saved);
  const reset = () => saved !== undefined && onChange(path, saved);
  const tile = { label, htmlFor: id, error, edited, onReset: reset, copy };

  if (typeof value === "boolean") {
    return (
      <FieldTile {...tile} icon={ToggleRight} inline>
        <Switch id={id} checked={value} onCheckedChange={(checked) => onChange(path, checked)} />
      </FieldTile>
    );
  }
  if (typeof value === "number") {
    return (
      <FieldTile {...tile} icon={Hash}>
        <input
          id={id}
          type="number"
          value={value}
          aria-invalid={invalid}
          onChange={(event) => onChange(path, event.target.valueAsNumber || 0)}
          className={cn(BARE, "h-6 tabular-nums")}
        />
      </FieldTile>
    );
  }
  if (isIsoDate(value)) {
    return (
      <FieldTile
        {...tile}
        icon={CalendarClock}
        meta={<span className="rounded bg-card px-1.5 py-px font-medium shadow-xs">UTC</span>}
      >
        <input
          id={id}
          type="datetime-local"
          value={isoToLocalInput(value)}
          aria-invalid={invalid}
          onChange={(event) => onChange(path, localInputToIso(event.target.value))}
          className={cn(BARE, "h-6 tabular-nums")}
        />
      </FieldTile>
    );
  }

  const text = typeof value === "string" ? value : "";
  const long = text.length > LONG_TEXT || text.includes("\n");
  return (
    <FieldTile {...tile} icon={long ? AlignLeft : Type} meta={`${text.length} ${copy.characters}`}>
      {long ? (
        <textarea
          id={id}
          value={text}
          rows={3}
          aria-invalid={invalid}
          onChange={(event) => onChange(path, event.target.value)}
          className={cn(BARE, "field-sizing-content min-h-11 resize-none leading-relaxed")}
        />
      ) : (
        <input
          id={id}
          value={text}
          aria-invalid={invalid}
          onChange={(event) => onChange(path, event.target.value)}
          className={cn(BARE, "h-6")}
        />
      )}
    </FieldTile>
  );
};

const RemoveButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-destructive/8 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
  >
    <X aria-hidden className="size-4" />
  </button>
);

const AddButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/[0.06] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
  >
    <span className="grid size-5 place-items-center rounded-md bg-primary/10">
      <Plus aria-hidden className="size-3.5" />
    </span>
    {label}
  </button>
);

const IndexBadge = ({ n }: { n: number }) => (
  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-card text-[0.6875rem] font-semibold text-muted-foreground tabular-nums shadow-xs">
    {n}
  </span>
);

/** Lists: text lists are numbered rows in one tile; lists of groups get a card per item. */
const ListField = (props: FieldProps & { value: JsonValue[] }) => {
  const { name, path, value, saved, onChange, errors, copy } = props;
  const error = errors[pathKey(path)];
  const label = humanize(name);
  const simple = value.every((item) => typeof item === "string");
  const edited = saved !== undefined && !same(value, saved);
  const remove = (index: number) =>
    onChange(
      path,
      value.filter((_, i) => i !== index),
    );
  const add = () => onChange(path, [...value, value.length ? blankLike(value[value.length - 1] ?? "") : ""]);

  return (
    <FieldTile
      label={label}
      icon={simple ? List : Layers}
      error={error}
      edited={edited}
      onReset={() => saved !== undefined && onChange(path, saved)}
      copy={copy}
      meta={<span className="rounded-full bg-card px-1.5 py-px font-semibold shadow-xs">{value.length}</span>}
      className="pb-1.5 focus-within:border-transparent focus-within:bg-muted/60 focus-within:ring-0 hover:bg-muted/60"
    >
      <ol className="mt-1.5 flex flex-col gap-1.5">
        {value.map((item, index) =>
          simple ? (
            <li
              key={index}
              className="flex items-center gap-2.5 rounded-lg border border-transparent bg-card/70 py-1 pr-1 pl-1.5 transition-colors focus-within:border-primary/40 focus-within:bg-card"
            >
              <IndexBadge n={index + 1} />
              <input
                aria-label={`${label} ${index + 1}`}
                value={typeof item === "string" ? item : ""}
                aria-invalid={errors[pathKey([...path, index])] ? true : undefined}
                onChange={(event) => onChange([...path, index], event.target.value)}
                className={cn(BARE, "h-7")}
              />
              <RemoveButton label={copy.removeItem} onClick={() => remove(index)} />
            </li>
          ) : (
            <li key={index} className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
              <div className="mb-2.5 flex items-center gap-2">
                <IndexBadge n={index + 1} />
                <span className="flex-1 text-xs font-semibold text-foreground">
                  {fill(copy.item, { n: index + 1 })}
                </span>
                <RemoveButton label={copy.removeItem} onClick={() => remove(index)} />
              </div>
              <ContentField
                {...props}
                name={index}
                path={[...path, index]}
                value={item}
                saved={savedChild(saved, index)}
              />
            </li>
          ),
        )}
      </ol>
      <div className="mt-1">
        <AddButton label={copy.addItem} onClick={add} />
      </div>
    </FieldTile>
  );
};

/** A nested group: a titled panel with its fields in a responsive two-column grid. */
const GroupField = (props: FieldProps & { value: Record<string, JsonValue> }) => {
  const { value, path, saved, query } = props;
  const entries = Object.entries(value).filter(([key, child]) => matchesQuery(key, child, query));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, child]) => {
        const wide = isObject(child) || Array.isArray(child) || (typeof child === "string" && child.length > LONG_TEXT);
        const childSaved = savedChild(saved, key);
        return (
          <div key={key} className={cn(wide && "sm:col-span-2")}>
            {isObject(child) ? (
              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="grid size-6 place-items-center rounded-md bg-card text-muted-foreground shadow-xs">
                    <Layers aria-hidden className="size-3.5" />
                  </span>
                  {humanize(key)}
                </p>
                <ContentField {...props} name={key} path={[...path, key]} value={child} saved={childSaved} />
              </div>
            ) : (
              <ContentField {...props} name={key} path={[...path, key]} value={child} saved={childSaved} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/** Renders the right editor for any content value, recursively. */
export const ContentField = (props: FieldProps) => {
  const { value } = props;
  if (Array.isArray(value)) {
    return <ListField {...props} value={value} />;
  }
  if (isObject(value)) {
    return <GroupField {...props} value={value} />;
  }
  return <LeafField {...props} />;
};

/** Number of editable values inside a section (for its header). */
export const countFields = (value: JsonValue): number => {
  if (Array.isArray(value)) {
    return value.every((item) => typeof item === "string")
      ? 1
      : value.reduce<number>((n, item) => n + countFields(item), 0);
  }
  if (isObject(value)) {
    return Object.values(value).reduce<number>((n, child) => n + countFields(child), 0);
  }
  return 1;
};
