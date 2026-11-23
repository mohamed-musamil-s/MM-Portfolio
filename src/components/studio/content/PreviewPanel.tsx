"use client";

import { ArrowUpRight, Crosshair, LoaderCircle, Maximize, Monitor, Smartphone, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import {
  fromPreviewSchema,
  type PreviewableScreen,
  type ToPreviewMessage,
} from "@/lib/shared/content/preview-protocol";
import { cn } from "@/lib/shared/cn";
import { ROUTES } from "@/lib/shared/routes";
import { fill, type JsonObject } from "./content-paths";

type Copy = StudioShellContent["editor"];

/**
 * `fit` renders the page at the panel's own shape (FIT_WIDTH wide, as tall as
 * the panel allows), so the preview fills the column top to bottom. The others
 * are fixed device sizes, centred and scaled to fit.
 */
const DEVICES = {
  fit: { width: 0, height: 0, icon: Maximize },
  desktop: { width: 1440, height: 900, icon: Monitor },
  mobile: { width: 390, height: 844, icon: Smartphone },
} as const;
type Device = keyof typeof DEVICES;
const DEVICE_KEYS: Device[] = ["fit", "desktop", "mobile"];
/** Fit renders a 900px page, or the phone layout when the studio itself is open on a phone. */
const FIT_WIDTH = { wide: 900, phone: 390 } as const;
const PHONE_QUERY = "(max-width: 767px)";
const subscribePhone = (onChange: () => void) => {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useIsPhone = () =>
  useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );

const PAGE_ROUTES: Record<PreviewableScreen, string> = {
  // The splash plays once per visit over the first page, so its own preview is the page to open.
  splash: `${ROUTES.preview}/splash`,
  maintenance: ROUTES.maintenance,
  "not-found": ROUTES.notFound,
};

const send = (frame: HTMLIFrameElement | null, message: ToPreviewMessage) =>
  frame?.contentWindow?.postMessage(message, window.location.origin);

/** Size of the element, kept current. */
const useSize = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry?.contentRect.width ?? 0, height: entry?.contentRect.height ?? 0 }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
};

/** Virtual viewport, scale and position of the frame inside a box. */
const layoutFrame = (device: Device, box: { width: number; height: number }, phone: boolean) => {
  const width = Math.max(box.width, 1);
  const height = Math.max(box.height, 1);
  if (device === "fit") {
    const scale = Math.min(1, width / (phone ? FIT_WIDTH.phone : FIT_WIDTH.wide));
    return { vw: width / scale, vh: height / scale, scale, left: 0, top: 0 };
  }
  const { width: vw, height: vh } = DEVICES[device];
  const scale = Math.min(1, width / vw, height / vh);
  return { vw, vh, scale, left: (width - vw * scale) / 2, top: (height - vh * scale) / 2 };
};

type PreviewPanelProps = {
  copy: Copy;
  /** Screens this record appears on (one for a page, several for shared content). */
  targets: PreviewableScreen[];
  /** Current drafts, unsaved edits included. */
  drafts: Record<string, JsonObject>;
  /** Texts of the field being edited (empty when none). */
  focusTexts: string[];
  focusLabel: string | null;
};

/**
 * Right column of Content Forge: the real page in a scaled frame, updated as
 * you type, with the focused field outlined where it appears.
 */
export const PreviewPanel = ({ copy, targets, drafts, focusTexts, focusLabel }: PreviewPanelProps) => {
  const panel = copy.previewPanel;
  const [device, setDevice] = useState<Device>("fit");
  const [chosen, setChosen] = useState<PreviewableScreen | null>(null);
  const target = chosen && targets.includes(chosen) ? chosen : (targets[0] ?? "maintenance");
  const [boxRef, box] = useSize();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState({ valid: true, matches: 0 });

  const phone = useIsPhone();
  const { vw, vh, scale, left, top } = layoutFrame(device, box, phone);

  // Replies from the frame (same origin, known shape only).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) {
        return;
      }
      const message = fromPreviewSchema.safeParse(event.data);
      if (!message.success) {
        return;
      }
      if (message.data.type === "ready") {
        setReady(true);
        return;
      }
      setStatus({ valid: message.data.valid, matches: message.data.matches });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const content = drafts[target];
  const shared = drafts.shared;
  useEffect(() => {
    if (ready) {
      send(iframeRef.current, { source: "content-forge", type: "draft", content, shared });
    }
  }, [content, ready, shared]);

  const focusKey = focusTexts.join("\u0000");
  useEffect(() => {
    if (ready) {
      send(iframeRef.current, {
        source: "content-forge",
        type: "focus",
        texts: focusKey ? focusKey.split("\u0000") : [],
      });
    }
  }, [focusKey, ready]);

  const impact = !focusLabel
    ? panel.idle
    : status.matches === 0
      ? panel.none
      : status.matches === 1
        ? panel.hitsOne
        : fill(panel.hits, { n: status.matches });

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-16px_rgb(15_23_42/0.12)] xl:h-full xl:min-h-0">
      <header className="flex items-center gap-2 px-1">
        <span className="relative flex size-2">
          <span className="absolute inset-0 rounded-full bg-success/40" />
          <span className="relative size-2 rounded-full bg-success" />
        </span>
        <h2 className="flex-1 text-sm font-semibold">{panel.title}</h2>
        <div role="radiogroup" aria-label={panel.title} className="flex rounded-lg bg-muted p-0.5">
          {DEVICE_KEYS.map((key) => {
            const Icon = DEVICES[key].icon;
            const active = key === device;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={panel[key]}
                title={panel[key]}
                onClick={() => {
                  if (key !== device) {
                    setDevice(key);
                    setReady(false);
                  }
                }}
                className={cn(
                  "grid size-7 place-items-center rounded-md transition-colors",
                  active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-3.5" />
              </button>
            );
          })}
        </div>
        <a
          href={PAGE_ROUTES[target]}
          target="_blank"
          rel="noopener noreferrer"
          title={panel.openPage}
          aria-label={panel.openPage}
          className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      </header>

      {targets.length > 1 ? (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-muted-foreground">{panel.showOn}</span>
          <div className="flex flex-wrap gap-1">
            {targets.map((slug) => (
              <button
                key={slug}
                type="button"
                aria-pressed={slug === target}
                onClick={() => {
                  setChosen(slug);
                  setReady(false);
                }}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                  slug === target
                    ? "border-primary/40 bg-primary/[0.07] text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {copy.screens[slug]?.name ?? slug}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/*
        The stage fills the rest of the column (100vh layout). The page renders at
        a virtual viewport and is scaled into it.
      */}
      <div
        ref={boxRef}
        className="relative h-[62svh] min-h-96 w-full shrink-0 overflow-hidden rounded-xl bg-muted/60 bg-[radial-gradient(var(--studio-border)_1px,transparent_1px)] bg-size-[14px_14px] xl:h-auto xl:min-h-0 xl:flex-1"
      >
        <div
          className={cn(
            "bg-white absolute overflow-hidden",
            device === "fit"
              ? "inset-0 rounded-xl"
              : "rounded-lg shadow-[0_0_0_1px_var(--studio-border),0_12px_32px_-12px_rgb(15_23_42/0.25)]",
            device === "mobile" && "rounded-[1.25rem]",
          )}
          style={device === "fit" ? undefined : { left, top, width: vw * scale, height: vh * scale }}
        >
          {box.width > 0 ? (
            <iframe
              ref={iframeRef}
              key={`${target}-${device}`}
              src={`${ROUTES.preview}/${target}`}
              title={`${panel.title}: ${copy.screens[target]?.name ?? target}`}
              tabIndex={-1}
              className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
              style={{ width: vw, height: vh, transform: `scale(${scale})` }}
            />
          ) : null}
        </div>
        {ready ? null : (
          <div className="absolute inset-0 grid place-items-center bg-muted/80">
            <LoaderCircle aria-hidden className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <div
        aria-live="polite"
        className={cn(
          "flex shrink-0 items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-relaxed",
          status.valid ? "bg-muted/70 text-muted-foreground" : "bg-destructive/[0.06] text-destructive",
        )}
      >
        {status.valid ? (
          <Crosshair aria-hidden className={cn("mt-0.5 size-3.5 shrink-0", focusLabel && "text-primary")} />
        ) : (
          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        )}
        <span>
          {status.valid ? (
            <>
              {focusLabel ? <span className="font-semibold text-foreground">{focusLabel}: </span> : null}
              {impact}
            </>
          ) : (
            panel.invalid
          )}
        </span>
      </div>
      <p className="shrink-0 px-1 text-[0.6875rem] leading-relaxed text-muted-foreground">{panel.hint}</p>
    </section>
  );
};
