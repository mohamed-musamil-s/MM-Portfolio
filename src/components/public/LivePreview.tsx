"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HomeView } from "@/components/home/HomeView";
import { PREVIEW_SECTION_EVENT } from "@/components/home/SiteNav";
import { MaintenanceScreen } from "@/components/maintenance/MaintenanceScreen";
import { NameSplash } from "@/components/splash/NameSplash";
import { markIntroReady } from "@/components/splash/splash-state";
import { homeContentSchema, type HomeContent } from "@/lib/shared/content/home-schema";
import type { SectionVisibility } from "@/lib/shared/content/home-sections";
import { splashContentSchema, type SplashContent } from "@/lib/shared/content/splash-schema";
import { NotFoundScreen } from "@/components/not-found/NotFoundScreen";
import { maintenanceContentSchema, type MaintenanceContent } from "@/lib/shared/content/maintenance-schema";
import { notFoundContentSchema, type NotFoundContent } from "@/lib/shared/content/not-found-schema";
import {
  toPreviewSchema,
  type FromPreviewMessage,
  type PreviewableScreen,
} from "@/lib/shared/content/preview-protocol";
import { sharedContentSchema, type SharedContent } from "@/lib/shared/content/shared-schema";
import { formatDateUtc } from "@/lib/shared/format";
import { PreviewModeContext } from "./preview-mode";

type Rendered =
  | { slug: "maintenance"; content: MaintenanceContent; shared: SharedContent }
  | { slug: "not-found"; content: NotFoundContent; shared: SharedContent }
  | { slug: "home"; content: HomeContent; shared: SharedContent }
  | { slug: "splash"; content: SplashContent; shared: SharedContent };

/** Pause between two plays of the splash preview. */
const SPLASH_REPLAY_MS = 1500;

/** Validates a draft for this screen; null when it doesn't pass (the last valid render stays). */
const parseDraft = (slug: PreviewableScreen, content: unknown, shared: unknown): Rendered | null => {
  const sharedResult = sharedContentSchema.safeParse(shared);
  if (!sharedResult.success) {
    return null;
  }
  if (slug === "maintenance") {
    const result = maintenanceContentSchema.safeParse(content);
    return result.success ? { slug, content: result.data, shared: sharedResult.data } : null;
  }
  if (slug === "home") {
    const result = homeContentSchema.safeParse(content);
    return result.success ? { slug, content: result.data, shared: sharedResult.data } : null;
  }
  if (slug === "splash") {
    const result = splashContentSchema.safeParse(content);
    return result.success ? { slug, content: result.data, shared: sharedResult.data } : null;
  }
  const result = notFoundContentSchema.safeParse(content);
  return result.success ? { slug, content: result.data, shared: sharedResult.data } : null;
};

const HIT = "data-cf-hit";
/** Text compared without spaces or case: split letters and CSS case changes still match. */
const squash = (text: string) => text.replace(/\s+/g, "").toLowerCase();

/** The part of the page a field lives in: its section, or the whole page. Null when that section isn't shown. */
const scopeRoot = (scope: string | null | undefined): Element | null =>
  scope
    ? document.querySelector(`[data-cf-section="${CSS.escape(scope)}"]`)
    : (document.querySelector("main") ?? document.body);

const isVisible = (element: Element) => {
  const box = element.getBoundingClientRect();
  if (box.width <= 2 || box.height <= 2) return false;
  const style = window.getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none";
};

/** Visible text of an element, leaving out duplicate visual copies (`data-cf-copy`, e.g. rolling letters). */
const textOf = (element: Element): string => {
  if (!element.querySelector("[data-cf-copy]")) return squash(element.textContent ?? "");
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let text = "";
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.parentElement?.closest("[data-cf-copy]")) text += node.textContent ?? "";
  }
  return squash(text);
};

/** Elements that carry the value in an attribute: a link's address, an image's file, a placeholder or alt text. */
const attributeMatches = (root: Element, raw: string[]): Element[] => {
  const values = raw.map((text) => text.trim()).filter((text) => text.length >= 2);
  if (values.length === 0) return [];
  const sameValue = (value: string | null) => value !== null && values.includes(value.trim());
  const decoded = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  return [...root.querySelectorAll("a[href], img, input, textarea, [title]")].filter((element) => {
    if (element instanceof HTMLAnchorElement && sameValue(element.getAttribute("href"))) return true;
    if (element instanceof HTMLImageElement) {
      const source = decoded(element.getAttribute("src") ?? "");
      if (values.some((value) => value.startsWith("/") && source.includes(value))) return true;
      if (sameValue(element.getAttribute("alt"))) return true;
    }
    return sameValue(element.getAttribute("placeholder")) || sameValue(element.getAttribute("title"));
  });
};

/** The nearest visible container of an element that isn't shown right now (a collapsed role, a closed panel). */
const visibleContainer = (element: Element, root: Element): Element | null => {
  for (let parent = element.parentElement; parent && parent !== root; parent = parent.parentElement) {
    if (isVisible(parent)) return parent;
  }
  return null;
};

/**
 * Where the value shows inside `root`: the smallest elements whose text is exactly it (else contains it),
 * plus elements carrying it in an attribute. When it is in the page but not shown right now, the
 * nearest visible container stands in.
 */
const findMatches = (root: Element, raw: string[]): Element[] => {
  const wanted = raw.map(squash).filter((text) => text.length >= 1);
  const contains = (element: Element) => wanted.some((text) => textOf(element).includes(text));
  const smallestAll = [root, ...root.querySelectorAll("*")].filter(
    (element) => contains(element) && ![...element.children].some(contains),
  );
  const smallest = smallestAll.filter(isVisible);
  const exact = smallest.filter((element) => wanted.includes(textOf(element)));
  // A short value ("01", "5+") inside longer text is almost always a different text: don't outline it.
  const partial = wanted.some((text) => text.length >= 4) ? smallest : [];
  const byText = exact.length > 0 ? exact : partial;
  const byAttribute = attributeMatches(root, raw).filter(isVisible);
  const hits = [...new Set([...byText, ...byAttribute])];
  if (hits.length > 0) return hits;
  // Same rule for text that isn't shown right now: short values only where they stand alone.
  const sources = smallestAll.filter(
    (element) => wanted.includes(textOf(element)) || wanted.some((text) => text.length >= 4),
  );
  const standIns = sources.map((element) => visibleContainer(element, root)).filter((element) => element !== null);
  return [...new Set(standIns)];
};

/**
 * Outlines where the focused field's text appears, inside its section, and
 * brings the first match into view. Generic on purpose: no screen needs to
 * know about the editor beyond its `data-cf-section` attribute.
 */
const area = (element: Element) => {
  const box = element.getBoundingClientRect();
  return box.width * box.height;
};

/**
 * The one visible element showing the item's most distinctive value (its longest): exactly that
 * text, or for a long value (6+ characters) the smallest element containing it.
 */
const distinctive = (elements: Element[], marks: string[]): Element | null => {
  for (const mark of [...marks].sort((a, b) => b.length - a.length)) {
    const exact = elements.filter((element) => textOf(element) === mark && isVisible(element));
    const holders =
      exact.length > 0 || mark.length < 6
        ? exact
        : elements.filter(
            (element) =>
              textOf(element).includes(mark) &&
              ![...element.children].some((child) => textOf(child).includes(mark)) &&
              isVisible(element),
          );
    if (holders.length === 1) return holders[0] ?? null;
  }
  return null;
};

const marksOf = (item: string[]) => [...new Set(item.map(squash).filter((text) => text.length >= 3))];

/** The smallest visible element holding two or more of the item's values, if it is one place and not most of the section. */
const holdingMost = (root: Element, elements: Element[], marks: string[]): Element | null => {
  const counts = new Map(
    elements.map((element) => [element, marks.filter((mark) => textOf(element).includes(mark)).length]),
  );
  const best = Math.max(...counts.values());
  if (best < 2) return null;
  const deepest = elements.filter(
    (element) =>
      counts.get(element) === best &&
      ![...element.children].some((child) => counts.get(child) === best) &&
      isVisible(element),
  );
  const container = deepest.length === 1 ? (deepest[0] ?? null) : null;
  return container && area(container) < area(root) * 0.4 ? container : null;
};

/**
 * The list item a field belongs to, on the page (a project card, a role row): the smallest element
 * holding most of the item's other values, nearest item first; failing that, the item's most
 * distinctive value. Null when no item is recognisable.
 */
const itemContainer = (root: Element, context: string[][]): Element | null => {
  const elements = [root, ...root.querySelectorAll("*")];
  for (const item of context) {
    const found = holdingMost(root, elements, marksOf(item));
    if (found) return found;
  }
  for (const item of context) {
    const found = distinctive(elements, marksOf(item));
    // One value stands for the item: show its small wrapper (a stat's label and number together).
    if (found) return snugParent(found, root);
  }
  return null;
};

/** The element's parent when it adds little around it (and isn't the section), else the element. */
const snugParent = (element: Element, root: Element): Element => {
  const parent = element.parentElement;
  return parent && parent !== root && textOf(parent).length <= textOf(element).length * 2 + 40 && isVisible(parent)
    ? parent
    : element;
};

/** Whether `hit` sits in a sibling of the item: an element of the same kind next to it (another role row). */
const inPeerItem = (hit: Element, container: Element): boolean => {
  let branch: Element = container;
  while (branch.parentElement && !branch.parentElement.contains(hit)) branch = branch.parentElement;
  const common = branch.parentElement;
  if (!common) return false;
  let other: Element = hit;
  while (other.parentElement && other.parentElement !== common) other = other.parentElement;
  return (
    other !== branch && other.tagName === branch.tagName && other.getAttribute("class") === branch.getAttribute("class")
  );
};

/** How far a container may widen to take in the field's own text: a little, not into the next item. */
const widenToHits = (container: Element, root: Element, hits: Element[]): Element | null => {
  const limit = textOf(container).length * 2 + 80;
  for (let parent = container.parentElement; parent && parent !== root; parent = parent.parentElement) {
    if (textOf(parent).length > limit) return null;
    if (hits.some((hit) => parent.contains(hit))) return parent;
  }
  return null;
};

/**
 * The field's matches, kept to its own list item when it sits in one: repeated values (two
 * projects with the same period) resolve to the right copy, and when the field isn't shown right
 * now (a collapsed role) the item itself is outlined.
 */
const locate = (root: Element, texts: string[], context: string[][]): Element[] => {
  const hits = findMatches(root, texts);
  const container = itemContainer(root, context);
  if (!container) return hits;
  const inside = hits.filter((hit) => container.contains(hit));
  if (inside.length > 0) return inside;
  const wider = widenToHits(container, root, hits);
  if (wider) return hits.filter((hit) => wider.contains(hit));
  // One match elsewhere in the section (a skill chip away from its group's text) counts, unless it
  // belongs to another item of the same list; several are ambiguous, so the item itself is outlined.
  const own = hits.filter((hit) => !inPeerItem(hit, container));
  return own.length === 1 ? own : [container];
};

const highlight = (texts: string[], scope: string | null | undefined, context: string[][], reveal: boolean): number => {
  document.querySelectorAll(`[${HIT}]`).forEach((element) => element.removeAttribute(HIT));
  const root = scopeRoot(scope);
  if (texts.every((text) => text.trim() === "") || !root) {
    return 0;
  }
  const hits = locate(root, texts, context);
  hits.forEach((element) => element.setAttribute(HIT, ""));
  const first = hits[0];
  if (reveal && first) {
    if (scope === "nav") {
      // The navbar is fixed and hides while scrolling down: go to the top, where it shows.
      window.scrollTo({ top: 0, behavior: "instant" });
    } else if (scope === "footer") {
      // The footer sits behind the page and is uncovered at the very end.
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    } else {
      const box = first.getBoundingClientRect();
      if (box.top < 0 || box.bottom > window.innerHeight) {
        window.scrollTo({ top: Math.max(0, box.top + window.scrollY - window.innerHeight / 3), behavior: "instant" });
      }
    }
  }
  return hits.length;
};

/** Scrolls the home preview to a section: its anchor, the footer, or the top for the navbar, hero and page details. */
const showSection = (section: string | null) => {
  // Lets screens react to the section being edited (the navbar opens its index for "nav").
  window.dispatchEvent(new CustomEvent(PREVIEW_SECTION_EVENT, { detail: section }));
  const target =
    section === "footer"
      ? document.querySelector("footer")
      : section && !["nav", "hero", "meta"].includes(section)
        ? document.getElementById(section)
        : null;
  if (target) {
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
  } else {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
};

/** The splash on a loop: it plays, waits a moment, and plays again. */
const SplashLoop = ({ content }: { content: SplashContent }) => {
  const [take, setTake] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (playing) return;
    const timer = window.setTimeout(() => {
      setTake((value) => value + 1);
      setPlaying(true);
    }, SPLASH_REPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [playing]);
  return playing ? (
    <NameSplash key={take} content={content} onExitStart={() => undefined} onFinished={() => setPlaying(false)} />
  ) : (
    <div className="grid min-h-svh place-items-center bg-paper" />
  );
};

const reply = (message: FromPreviewMessage) => window.parent.postMessage(message, window.location.origin);

/**
 * The page inside Content Forge's preview frame: the real public screen,
 * re-rendered with the editor's drafts as they arrive, in preview mode (no
 * redirects, no polling), with the focused field's text outlined.
 */
export const LivePreview = ({
  slug,
  initialContent,
  initialShared,
  visible,
}: {
  slug: PreviewableScreen;
  initialContent: unknown;
  initialShared: unknown;
  /** Which home sections show (Launchpad), so the preview matches the live page. */
  visible: SectionVisibility;
}) => {
  const [rendered, setRendered] = useState(() => parseDraft(slug, initialContent, initialShared));
  const [valid, setValid] = useState(true);
  const [focus, setFocus] = useState<{ texts: string[]; scope: string | null; context: string[][] }>({
    texts: [],
    scope: null,
    context: [],
  });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) {
        return;
      }
      const message = toPreviewSchema.safeParse(event.data);
      if (!message.success) {
        return;
      }
      if (message.data.type === "focus") {
        setFocus({
          texts: message.data.texts,
          scope: message.data.scope ?? null,
          context: message.data.context ?? [],
        });
        return;
      }
      if (message.data.type === "section") {
        showSection(message.data.section);
        return;
      }
      const next = parseDraft(slug, message.data.content, message.data.shared);
      setValid(next !== null);
      if (next) {
        setRendered(next);
      }
    };
    window.addEventListener("message", onMessage);
    // No splash plays in the preview frame, so the home page's entrances can start at once.
    markIntroReady();
    reply({ source: "content-forge-preview", type: "ready" });
    return () => window.removeEventListener("message", onMessage);
  }, [slug]);

  // A new focus scrolls to the field; re-renders while typing only re-outline it.
  const focusKey = JSON.stringify(focus);
  const revealed = useRef<string | null>(null);
  useLayoutEffect(() => {
    const matches = highlight(focus.texts, focus.scope, focus.context, revealed.current !== focusKey);
    revealed.current = focusKey;
    reply({ source: "content-forge-preview", type: "status", valid, matches });
  }, [focus, focusKey, rendered, valid]);

  if (!rendered) {
    return null;
  }
  return (
    <PreviewModeContext value>
      <style>{`[${HIT}]{outline:2px solid #2563eb!important;outline-offset:6px;border-radius:3px;background-color:rgb(37 99 235 / 0.08)}`}</style>
      {rendered.slug === "home" ? (
        <HomeView home={rendered.content} visible={visible} />
      ) : rendered.slug === "splash" ? (
        <SplashLoop content={rendered.content} />
      ) : rendered.slug === "maintenance" ? (
        <MaintenanceScreen
          content={rendered.content}
          shared={rendered.shared}
          windowStartText={formatDateUtc(rendered.content.timeline.windowStart)}
          targetText={formatDateUtc(rendered.content.timeline.targetAt)}
        />
      ) : (
        <NotFoundScreen content={rendered.content} shared={rendered.shared} />
      )}
    </PreviewModeContext>
  );
};
