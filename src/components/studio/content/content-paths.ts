/**
 * Helpers for the schema-agnostic content editor: readable labels from keys,
 * immutable updates by path, ISO date detection and search matching.
 */

export type Path = readonly (string | number)[];
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

/** "checkAgainLabel" → "Check again label", "srRemaining" → "Sr remaining", 2 → "Item 3". */
export const humanize = (key: string | number): string => {
  if (typeof key === "number") {
    return `Item ${key + 1}`;
  }
  const words = key
    .replace(/[-_]/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const pathKey = (path: Path): string => path.join(".");

export const isObject = (value: JsonValue | undefined): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
export const isIsoDate = (value: JsonValue): value is string => typeof value === "string" && ISO_DATE.test(value);

/** ISO (UTC) ↔ the value a `datetime-local` input shows, both in UTC. */
export const isoToLocalInput = (iso: string): string => iso.slice(0, 16);
export const localInputToIso = (local: string): string => (local ? `${local}:00.000Z` : "");

/** Returns a copy of `root` with `value` written at `path`. */
export const setAt = (root: JsonValue, path: Path, value: JsonValue): JsonValue => {
  if (path.length === 0) {
    return value;
  }
  const [head, ...rest] = path;
  if (Array.isArray(root) && typeof head === "number") {
    const copy = [...root];
    copy[head] = setAt(root[head] ?? null, rest, value);
    return copy;
  }
  if (isObject(root) && typeof head === "string") {
    return { ...root, [head]: setAt(root[head] ?? null, rest, value) };
  }
  return root;
};

/** True when the key, its readable label or a leaf value under it contains the query. */
export const matchesQuery = (key: string | number, value: JsonValue, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  if (humanize(key).toLowerCase().includes(needle) || String(key).toLowerCase().includes(needle)) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some((item, index) => matchesQuery(index, item, needle));
  }
  if (isObject(value)) {
    return Object.entries(value).some(([childKey, child]) => matchesQuery(childKey, child, needle));
  }
  return String(value).toLowerCase().includes(needle);
};

/** A blank copy of an item (strings emptied), used when adding to a list. */
export const blankLike = (value: JsonValue): JsonValue => {
  if (typeof value === "string") {
    return isIsoDate(value) ? value : "";
  }
  if (Array.isArray(value)) {
    return value.slice(0, 1).map(blankLike);
  }
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, blankLike(child)]));
  }
  return value;
};

/** Fills `{name}` placeholders in a copy template. */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

/** Deep equality for plain JSON values. */
export const same = (a: JsonValue | undefined, b: JsonValue | undefined) => JSON.stringify(a) === JSON.stringify(b);
