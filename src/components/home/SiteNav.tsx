"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatedMonogram } from "@/components/brand/AnimatedMonogram";
import { RegistrationMark } from "@/components/motion/RegistrationMark";
import { StatusDot } from "@/components/motion/StatusDot";
import { usePreviewMode } from "@/components/public/preview-mode";
import { useIntroReady } from "@/components/splash/splash-state";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";

/*
 * The portfolio navbar (docs/screens/HOME_BUSINESS.md §4): a corner index.
 * Two pieces only, so the page stays the subject while reading:
 * - top left, the monogram and name (the splash lands its logo on the monogram);
 * - top right, "Let's talk" (from `sm`) and the index button: the section
 *   being read ("02 Experience", or "Menu" above the first) beside an ink disc
 *   ringed by the reading progress.
 * The button opens the index: a full-screen ink sheet that grows out of the
 * button, with the sections as giant numbered rows (the current one marked),
 * the live status and "Let's talk".
 */

type Nav = HomeContent["nav"];

/** Past this scroll the logo gets its own paper pill, so it reads over any section. */
const PILL_AFTER = 24;
/** Where the index sheet grows from: the index button's disc, top right. */
const ORIGIN = "calc(100% - var(--page-margin) - 1.5rem) 2.6rem";
/** Content Forge's preview opens the index while the Navbar section is edited (LivePreview dispatches it). */
export const PREVIEW_SECTION_EVENT = "cf:section";

/** Items drop in one by one once the splash has started leaving. */
const useDropIn = (index: number) => {
  const ready = useIntroReady();
  return {
    initial: { y: -24, opacity: 0 },
    animate: ready ? { y: 0, opacity: 1 } : { y: -24, opacity: 0 },
    transition: { delay: 0.2 + index * 0.12, duration: 0.7, ease: EASE_PRINT },
  };
};

/**
 * The section under the middle of the viewport, from the links' `#anchors` (null above the first).
 * Worked out from the scroll position on each frame that scrolls, so jumps and long pinned sections
 * never leave a stale section marked.
 */
const useActiveSection = (links: Nav["links"]) => {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const anchors = links.map((link) => link.href).filter((href) => href.startsWith("#"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      const found = anchors.find((href) => {
        const box = document.getElementById(href.slice(1))?.getBoundingClientRect();
        return box ? box.top <= middle && box.bottom > middle : false;
      });
      setActive(found ?? null);
    };
    const onScroll = () => {
      frame ||= window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [links]);
  return active;
};

const number = (index: number) => String(index + 1).padStart(2, "0");

/** The owner's name beside the monogram, on two lines when it has a space. */
const NavName = ({ name, muted }: { name: string; muted: boolean }) => {
  const [first, ...rest] = name.split(" ");
  return (
    <span className="hidden flex-col font-glyph text-[0.75rem] leading-[1.05] font-bold sm:flex">
      <span>{first}</span>
      {rest.length > 0 ? <span className={muted ? "text-graphite" : "opacity-60"}>{rest.join(" ")}</span> : null}
    </span>
  );
};

/** Two short lines that become a cross while the index is open. */
const Lines = ({ open }: { open: boolean }) => (
  <span aria-hidden className="relative block h-2.5 w-3.5">
    <span
      className={cn(
        "absolute top-0 left-0 h-px w-full bg-current transition-transform duration-500 ease-print",
        open ? "translate-y-[5px] rotate-45" : "group-hover:translate-x-0.5",
      )}
    />
    <span
      className={cn(
        "absolute bottom-0 left-0 h-px bg-current transition-[width,transform] duration-500 ease-print",
        open ? "w-full -translate-y-[4px] -rotate-45" : "w-2/3 group-hover:w-full",
      )}
    />
  </span>
);

/** "Let's talk" in the corner: an ink pill that leans toward the cursor; its arrow flies out and back in on hover. */
const CornerCta = ({ cta, hidden }: { cta: Nav["cta"]; hidden: boolean }) => {
  const { anchorRef, x, y } = useMagnetic<HTMLSpanElement>();
  const drop = useDropIn(1);
  return (
    <motion.span {...drop} className="hidden sm:block">
      <span
        ref={anchorRef}
        className={cn(
          "block transition-opacity duration-300 ease-print",
          hidden ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100",
        )}
      >
        <motion.a
          href={cta.href}
          tabIndex={hidden ? -1 : undefined}
          aria-hidden={hidden || undefined}
          style={{ x, y }}
          className="group flex min-h-12 items-center gap-3 rounded-full bg-ink py-1.5 pr-1.5 pl-5 text-label font-bold whitespace-nowrap text-paper uppercase shadow-[0_18px_50px_-28px_rgb(0_0_0/0.45)] transition-colors duration-200 hover:bg-ink/88 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal"
        >
          {cta.label}
          <span aria-hidden className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-signal">
            <span className="absolute inset-0 grid place-items-center transition-transform duration-500 ease-print group-hover:translate-x-full group-hover:-translate-y-full">
              ↗
            </span>
            <span className="absolute inset-0 grid -translate-x-full translate-y-full place-items-center transition-transform duration-500 ease-print group-hover:translate-x-0 group-hover:translate-y-0">
              ↗
            </span>
          </span>
        </motion.a>
      </span>
    </motion.span>
  );
};

/** The section being read (or "Menu") beside an ink disc ringed by the reading progress. */
const IndexButton = ({
  nav,
  active,
  open,
  onToggle,
  buttonRef,
}: {
  nav: Nav;
  active: string | null;
  open: boolean;
  onToggle: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) => {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 36, restDelta: 0.001 });
  const drop = useDropIn(2);
  const index = nav.links.findIndex((link) => link.href === active);
  const current = index >= 0 ? nav.links[index] : undefined;
  const label = open ? nav.close : (current?.label ?? nav.menu);
  const key = open ? "close" : (current?.href ?? "menu");

  return (
    <motion.button
      {...drop}
      ref={buttonRef}
      type="button"
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={onToggle}
      className={cn(
        "group pointer-events-auto flex min-h-12 items-center gap-3 rounded-full border py-1.5 pr-1.5 pl-4 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-500 ease-print focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal",
        open
          ? "border-paper/15 bg-paper text-ink"
          : "border-ink/12 bg-paper/85 text-ink shadow-[0_18px_50px_-28px_rgb(0_0_0/0.45)]",
      )}
    >
      <span className="relative flex h-5 min-w-14 items-center overflow-hidden font-technical text-micro uppercase">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={key}
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-110%" }}
            transition={{ duration: 0.45, ease: EASE_PRINT }}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {current && !open ? <span className="text-signal tabular-nums">{number(index)}</span> : null}
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="relative grid size-9 place-items-center rounded-full bg-ink text-paper">
        <svg aria-hidden viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90">
          <circle cx="18" cy="18" r="16.5" className="fill-none stroke-paper/15" strokeWidth="2" />
          <motion.circle
            cx="18"
            cy="18"
            r="16.5"
            className="fill-none stroke-signal"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ pathLength: progress }}
          />
        </svg>
        <Lines open={open} />
      </span>
    </motion.button>
  );
};

/** One section in the index: number, giant name, and an arrow that slides in on hover or focus (the pointer dims the rest). */
const IndexRow = ({
  link,
  index,
  current,
  dimmed,
  onHover,
  onPick,
}: {
  link: Nav["links"][number];
  index: number;
  current: boolean;
  dimmed: boolean;
  onHover: (index: number | null) => void;
  onPick: () => void;
}) => (
  <li className="border-b border-paper/12">
    <a
      href={link.href}
      onClick={onPick}
      aria-current={current ? "location" : undefined}
      onPointerEnter={() => onHover(index)}
      onPointerLeave={() => onHover(null)}
      className={cn(
        "group/row flex items-center gap-4 py-2 transition-opacity duration-300 ease-print focus-visible:outline-none sm:gap-6 sm:py-3",
        dimmed ? "opacity-35" : "opacity-100",
      )}
    >
      <span className="w-8 shrink-0 font-technical text-micro text-paper/55 tabular-nums">{number(index)}</span>
      <span className="block min-w-0 overflow-hidden">
        <motion.span
          initial={{ y: "110%" }}
          animate={{ y: "0%" }}
          transition={{ delay: 0.25 + index * 0.06, duration: 0.7, ease: EASE_PRINT }}
          className="block font-wide text-h2 leading-[1.02] uppercase transition-transform duration-500 ease-print group-hover/row:translate-x-3 group-focus-visible/row:translate-x-3 sm:text-h1"
        >
          {link.label}
        </motion.span>
      </span>
      {current ? <span aria-hidden className="size-3 shrink-0 rounded-full bg-signal" /> : null}
      <span
        aria-hidden
        className="ml-auto -translate-x-4 text-h2 text-signal opacity-0 transition-[opacity,transform] duration-500 ease-print group-hover/row:translate-x-0 group-hover/row:opacity-100 group-focus-visible/row:translate-x-0 group-focus-visible/row:opacity-100"
      >
        →
      </span>
    </a>
  </li>
);

/** The index: a full-screen ink sheet that grows out of the index button. Holds focus; Escape closes it. */
const IndexSheet = ({ nav, active, onClose }: { nav: Nav; active: string | null; onClose: () => void }) => {
  const sheet = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMotionTheme();
  const preview = usePreviewMode();
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    // The sheet takes focus (not its first row, which would light up as if hovered); Tab reaches the rows.
    if (!preview) {
      sheet.current?.focus({ preventScroll: true });
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      // Keep focus inside the navbar while the sheet is open: its rows, then the logo and the Close button above it.
      const scope = sheet.current?.parentElement;
      if (event.key === "Tab" && scope) {
        const focusable = [...scope.querySelectorAll<HTMLElement>("a, button")];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const { style } = document.documentElement;
    const overflow = style.overflow;
    style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, preview]);

  const closed = reducedMotion ? { opacity: 0 } : { clipPath: `circle(0% at ${ORIGIN})` };
  const opened = reducedMotion ? { opacity: 1 } : { clipPath: `circle(150% at ${ORIGIN})` };

  return (
    <motion.div
      ref={sheet}
      role="dialog"
      aria-modal="true"
      aria-label={nav.menu}
      tabIndex={-1}
      data-lenis-prevent
      initial={closed}
      animate={opened}
      exit={closed}
      transition={{ duration: 0.75, ease: EASE_PRINT }}
      className="pointer-events-auto fixed inset-0 flex flex-col overflow-y-auto bg-ink px-page pt-24 pb-6 text-paper outline-none lg:pt-28"
    >
      <RegistrationMark className="absolute bottom-4 left-4 size-4 text-paper/40" />
      <RegistrationMark className="absolute right-4 bottom-4 size-4 text-paper/40" />
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-10">
        <ol className="my-auto flex flex-col border-t border-paper/12">
          {nav.links.map((link, index) => (
            <IndexRow
              key={`${link.href}-${index}`}
              link={link}
              index={index}
              current={link.href === active}
              dimmed={hovered !== null && hovered !== index}
              onHover={setHovered}
              onPick={onClose}
            />
          ))}
        </ol>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + nav.links.length * 0.06, duration: 0.6, ease: EASE_PRINT }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <span className="flex items-center gap-2 font-technical text-micro text-paper/80 uppercase">
            <StatusDot />
            {nav.status}
          </span>
          <a
            href={nav.cta.href}
            onClick={onClose}
            className="group flex min-h-12 items-center gap-3 rounded-full bg-paper py-1.5 pr-1.5 pl-5 text-label font-bold whitespace-nowrap text-ink uppercase transition-colors duration-300 hover:bg-paper/90 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal"
          >
            {nav.cta.label}
            <span
              aria-hidden
              className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-signal"
            >
              <span className="absolute inset-0 grid place-items-center transition-transform duration-500 ease-print group-hover:translate-x-full group-hover:-translate-y-full">
                ↗
              </span>
              <span className="absolute inset-0 grid -translate-x-full translate-y-full place-items-center transition-transform duration-500 ease-print group-hover:translate-x-0 group-hover:translate-y-0">
                ↗
              </span>
            </span>
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const SiteNav = ({ nav }: { nav: Nav }) => {
  const { scrollY } = useScroll();
  const preview = usePreviewMode();
  const active = useActiveSection(nav.links);
  const [pill, setPill] = useState(false);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const logo = useDropIn(0);

  useMotionValueEvent(scrollY, "change", (y) => setPill(y > PILL_AFTER));

  // In Content Forge's preview the index opens while the Navbar section is being edited, so its fields show.
  useEffect(() => {
    if (!preview) return;
    const onSection = (event: Event) => setOpen((event as CustomEvent<string | null>).detail === "nav");
    window.addEventListener(PREVIEW_SECTION_EVENT, onSection);
    return () => window.removeEventListener(PREVIEW_SECTION_EVENT, onSection);
  }, [preview]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  return (
    <>
      {/* The sheet sits inside the header (one `data-cf-section`), under the corner row. */}
      <header data-cf-section="nav" className="pointer-events-none fixed inset-x-0 top-0 z-40 px-page">
        <AnimatePresence>{open ? <IndexSheet nav={nav} active={active} onClose={close} /> : null}</AnimatePresence>
        <div className="relative mx-auto flex max-w-[1440px] items-center justify-between gap-4 py-4 lg:py-5">
          <motion.div {...logo}>
            <Link
              href="/"
              aria-label="Home"
              className={cn(
                "pointer-events-auto flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-3 backdrop-blur-xl transition-[background-color,border-color,color,box-shadow] duration-500 ease-print focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal",
                open
                  ? "border-transparent bg-transparent text-paper"
                  : pill
                    ? "border-ink/12 bg-paper/85 text-ink shadow-[0_18px_50px_-28px_rgb(0_0_0/0.45)]"
                    : "border-transparent bg-transparent text-ink",
              )}
            >
              <AnimatedMonogram className={cn("h-6 w-auto sm:h-7", open && "text-paper")} />
              <NavName name={nav.name} muted={!open} />
            </Link>
          </motion.div>
          <div className="flex items-center gap-3">
            <CornerCta cta={nav.cta} hidden={open} />
            <IndexButton
              nav={nav}
              active={active}
              open={open}
              onToggle={() => (open ? close() : setOpen(true))}
              buttonRef={button}
            />
          </div>
        </div>
      </header>
    </>
  );
};
