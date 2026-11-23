"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/studio/ui/input";
import { Switch } from "@/components/studio/ui/switch";
import { Textarea } from "@/components/studio/ui/textarea";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { cn } from "@/lib/shared/cn";
import {
  blankLike,
  humanize,
  isIsoDate,
  isObject,
  isoToLocalInput,
  localInputToIso,
  matchesQuery,
  pathKey,
  type JsonValue,
  type Path,
} from "./content-paths";

type Copy = StudioShellContent["editor"];

type FieldProps = {
  name: string | number;
  path: Path;
  value: JsonValue;
  onChange: (path: Path, value: JsonValue) => void;
  errors: Record<string, string>;
  query: string;
  copy: Copy;
  /** Nesting depth, for group styling. */
  depth?: number;
};

const LONG_TEXT = 70;
const fieldId = (path: Path) => `field-${path.join("-")}`;

const FieldShell = ({
  label,
  htmlFor,
  error,
  meta,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  meta?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-foreground">
        {label}
      </label>
      {meta ? <span className="text-[0.6875rem] text-muted-foreground tabular-nums">{meta}</span> : null}
    </div>
    {children}
    {error ? <p className="text-xs text-destructive">{error}</p> : null}
  </div>
);

const INPUT = "h-10 rounded-lg bg-card text-sm shadow-none focus-visible:ring-3 focus-visible:ring-ring/15";

/** Text, long text (textarea), date-time, number or on/off, chosen from the value itself. */
const LeafField = ({ name, path, value, onChange, errors, copy }: FieldProps) => {
  const id = fieldId(path);
  const error = errors[pathKey(path)];
  const label = humanize(name);
  const invalid = error ? true : undefined;

  if (typeof value === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
        <label htmlFor={id} className="text-[0.8125rem] font-medium">
          {label}
        </label>
        <Switch id={id} checked={value} onCheckedChange={(checked) => onChange(path, checked)} />
      </div>
    );
  }
  if (typeof value === "number") {
    return (
      <FieldShell label={label} htmlFor={id} error={error}>
        <Input
          id={id}
          type="number"
          value={value}
          aria-invalid={invalid}
          onChange={(event) => onChange(path, event.target.valueAsNumber || 0)}
          className={INPUT}
        />
      </FieldShell>
    );
  }
  if (isIsoDate(value)) {
    return (
      <FieldShell label={label} htmlFor={id} error={error} meta="UTC">
        <Input
          id={id}
          type="datetime-local"
          value={isoToLocalInput(value)}
          aria-invalid={invalid}
          onChange={(event) => onChange(path, localInputToIso(event.target.value))}
          className={INPUT}
        />
      </FieldShell>
    );
  }
  const text = typeof value === "string" ? value : "";
  const meta = `${text.length} ${copy.characters}`;
  return (
    <FieldShell label={label} htmlFor={id} error={error} meta={meta}>
      {text.length > LONG_TEXT || text.includes("\n") ? (
        <Textarea
          id={id}
          value={text}
          rows={3}
          aria-invalid={invalid}
          onChange={(event) => onChange(path, event.target.value)}
          className="min-h-20 rounded-lg bg-card text-sm leading-relaxed shadow-none focus-visible:ring-3 focus-visible:ring-ring/15"
        />
      ) : (
        <Input
          id={id}
          value={text}
          aria-invalid={invalid}
          onChange={(event) => onChange(path, event.target.value)}
          className={INPUT}
        />
      )}
    </FieldShell>
  );
};

const IconButton = ({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/8 hover:text-destructive"
  >
    {children}
  </button>
);

const AddButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
  >
    <Plus aria-hidden className="size-3.5" />
    {label}
  </button>
);

/** Lists: plain text lists get one input per row; lists of groups get a card per item. */
const ListField = (props: FieldProps & { value: JsonValue[] }) => {
  const { name, path, value, onChange, errors, copy, depth = 0 } = props;
  const error = errors[pathKey(path)];
  const simple = value.every((item) => typeof item === "string");
  const remove = (index: number) =>
    onChange(
      path,
      value.filter((_, i) => i !== index),
    );
  const add = () => onChange(path, [...value, value.length ? blankLike(value[value.length - 1] ?? "") : ""]);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[0.8125rem] font-medium text-foreground">
        {humanize(name)} <span className="font-normal text-muted-foreground">· {value.length}</span>
      </legend>
      {value.map((item, index) =>
        simple ? (
          <div key={index} className="flex items-center gap-2">
            <Input
              aria-label={`${humanize(name)} ${index + 1}`}
              value={typeof item === "string" ? item : ""}
              aria-invalid={errors[pathKey([...path, index])] ? true : undefined}
              onChange={(event) => onChange([...path, index], event.target.value)}
              className={INPUT}
            />
            <IconButton label={copy.removeItem} onClick={() => remove(index)}>
              <Trash2 aria-hidden className="size-4" />
            </IconButton>
          </div>
        ) : (
          <div key={index} className="rounded-xl border border-border bg-background/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{humanize(index)}</span>
              <IconButton label={copy.removeItem} onClick={() => remove(index)}>
                <Trash2 aria-hidden className="size-4" />
              </IconButton>
            </div>
            <ContentField {...props} name={index} path={[...path, index]} value={item} depth={depth + 1} />
          </div>
        ),
      )}
      <AddButton label={copy.addItem} onClick={add} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </fieldset>
  );
};

/** A nested group: its fields in a responsive two-column grid (long text spans both columns). */
const GroupField = (props: FieldProps & { value: Record<string, JsonValue> }) => {
  const { value, path, query, depth = 0 } = props;
  const entries = Object.entries(value).filter(([key, child]) => matchesQuery(key, child, query));
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", depth > 0 && "gap-3")}>
      {entries.map(([key, child]) => {
        const wide = isObject(child) || Array.isArray(child) || (typeof child === "string" && child.length > LONG_TEXT);
        return (
          <div key={key} className={cn(wide && "sm:col-span-2")}>
            {isObject(child) ? (
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="mb-3 text-[0.8125rem] font-semibold text-foreground">{humanize(key)}</p>
                <ContentField {...props} name={key} path={[...path, key]} value={child} depth={depth + 1} />
              </div>
            ) : (
              <ContentField {...props} name={key} path={[...path, key]} value={child} depth={depth + 1} />
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
