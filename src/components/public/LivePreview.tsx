"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { MaintenanceScreen } from "@/components/maintenance/MaintenanceScreen";
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
  | { slug: "not-found"; content: NotFoundContent; shared: SharedContent };

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
  const result = notFoundContentSchema.safeParse(content);
  return result.success ? { slug, content: result.data, shared: sharedResult.data } : null;
};

const HIT = "data-cf-hit";
const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

/**
 * Outlines the smallest visible elements whose text contains one of `texts`.
 * Generic on purpose: no screen needs to know about the editor.
 */
const highlight = (texts: string[]): number => {
  document.querySelectorAll(`[${HIT}]`).forEach((element) => element.removeAttribute(HIT));
  const wanted = texts.map(normalize).filter((text) => text.length >= 2);
  if (wanted.length === 0) {
    return 0;
  }
  const main = document.querySelector("main") ?? document.body;
  const matches = (element: Element) => wanted.some((text) => normalize(element.textContent ?? "").includes(text));
  const hits = [...main.querySelectorAll("*")].filter((element) => {
    if (!matches(element) || [...element.children].some(matches)) {
      return false;
    }
    const box = element.getBoundingClientRect();
    return box.width > 4 && box.height > 4;
  });
  hits.forEach((element) => element.setAttribute(HIT, ""));
  return hits.length;
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
}: {
  slug: PreviewableScreen;
  initialContent: unknown;
  initialShared: unknown;
}) => {
  const [rendered, setRendered] = useState(() => parseDraft(slug, initialContent, initialShared));
  const [valid, setValid] = useState(true);
  const [focusTexts, setFocusTexts] = useState<string[]>([]);

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
        setFocusTexts(message.data.texts);
        return;
      }
      const next = parseDraft(slug, message.data.content, message.data.shared);
      setValid(next !== null);
      if (next) {
        setRendered(next);
      }
    };
    window.addEventListener("message", onMessage);
    reply({ source: "content-forge-preview", type: "ready" });
    return () => window.removeEventListener("message", onMessage);
  }, [slug]);

  // After each render: re-outline the focused field and report back.
  useLayoutEffect(() => {
    const matches = highlight(focusTexts);
    reply({ source: "content-forge-preview", type: "status", valid, matches });
  }, [focusTexts, rendered, valid]);

  if (!rendered) {
    return null;
  }
  return (
    <PreviewModeContext value>
      <style>{`[${HIT}]{outline:2px solid #2563eb!important;outline-offset:6px;border-radius:3px;background-color:rgb(37 99 235 / 0.08)}`}</style>
      {rendered.slug === "maintenance" ? (
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
