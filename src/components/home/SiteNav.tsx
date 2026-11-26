"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatedMonogram } from "@/components/brand/AnimatedMonogram";
import { RegistrationMark } from "@/components/motion/RegistrationMark";
import { StatusDot } from "@/components/motion/StatusDot";
import { useIntroReady } from "@/components/splash/splash-state";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";

/*
 * The portfolio navbar (docs/screens/HOME_BUSINESS.md §4). At the top of the
 * page an open row: the monogram and name (the splash lands its logo on the
 * monogram), numbered links whose letters roll up on hover, the live status
 * and "Let's talk". The section being read is marked by an ink pill that
 * slides between the links. Scrolling down hides the bar; scrolling back up
 * brings it back as a floating blurred island with the reading progress
 * along its lower edge.
 */

type Nav = HomeContent["nav"];

const HIDE_AFTER = 160;
const BAR_AFTER = 24;
const LETTER_STAGGER = 0.018;
const PILL_SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

/** Items drop in one by one once the splash has started leaving. */
const useDropIn = (index: number) => {
  const ready = useIntroReady();
  return {
    initial: { y: -24, opacity: 0 },
    animate: ready ? { y: 0, opacity: 1 } : { y: -24, opacity: 0 },
    transition: { delay: 0.2 + index * 0.07, duration: 0.7, ease: EASE_PRINT },
  };
};

/** A label whose letters roll up one after another on hover (the second copy rolls in from below). */
const RollingLabel = ({ text, active }: { text: string; active: boolean }) => (
  <span aria-hidden className="relative block overflow-hidden">
    <span className="flex">
      {Array.from(text).map((letter, index) => (
        <span key={`${letter}-${index}`} className="relative block whitespace-pre">
          <motion.span
            className="block"
            animate={{ y: active ? "-110%" : "0%" }}
            transition={{ delay: index * LETTER_STAGGER, duration: 0.45, ease: EASE_PRINT }}
          >
            {letter}
          </motion.span>
          <motion.span
            className="absolute inset-0 block"
            initial={{ y: "110%" }}
            animate={{ y: active ? "0%" : "110%" }}
            transition={{ delay: index * LETTER_STAGGER, duration: 0.45, ease: EASE_PRINT }}
          >
            {letter}
          </motion.span>
        </span>
      ))}
    </span>
  </span>
);

/**
 * The section under the middle of the viewport, from the links' `#anchors` (null above the first).
 * Worked out from the scroll position on each frame that scrolls, so jumps and long pinned sections
 * never leave a stale link marked.
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

const DesktopLinks = ({ links }: { links: Nav["links"] }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const current = useActiveSection(links);
  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul onPointerLeave={() => setHovered(null)} className="flex items-center gap-0.5">
        {links.map((link, index) => (
          <NavLink
            key={`${link.href}-${index}`}
            link={link}
            index={index}
            hovered={hovered === index}
            current={current === link.href}
            onHover={setHovered}
          />
        ))}
      </ul>
    </nav>
  );
};

const NavLink = ({
  link,
  index,
  hovered,
  current,
  onHover,
}: {
  link: Nav["links"][number];
  index: number;
  hovered: boolean;
  current: boolean;
  onHover: (index: number | null) => void;
}) => {
  const drop = useDropIn(index + 1);
  return (
    <motion.li {...drop} className="relative">
      {/* The section being read: an ink pill that slides from link to link. */}
      {current ? (
        <motion.span layoutId="nav-current" transition={PILL_SPRING} className="absolute inset-0 rounded-full bg-ink" />
      ) : null}
      <a
        href={link.href}
        aria-label={link.label}
        aria-current={current ? "location" : undefined}
        onPointerEnter={() => onHover(index)}
        onFocus={() => onHover(index)}
        onBlur={() => onHover(null)}
        className={cn(
          "relative flex items-start gap-1 rounded-full px-3.5 py-2 text-label font-bold uppercase transition-colors duration-300 ease-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
          current ? "text-paper" : "text-ink",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "font-technical text-[0.6rem] leading-none tabular-nums",
            current ? "text-signal" : "text-graphite",
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <RollingLabel text={link.label} active={hovered} />
      </a>
    </motion.li>
  );
};

/** The owner's name beside the monogram, on two lines when it has a space. */
const NavName = ({ name }: { name: string }) => {
  const drop = useDropIn(0);
  const [first, ...rest] = name.split(" ");
  return (
    <motion.span {...drop} className="hidden flex-col font-glyph text-[0.75rem] leading-[1.05] font-bold sm:flex">
      <span>{first}</span>
      {rest.length > 0 ? <span className="text-graphite">{rest.join(" ")}</span> : null}
    </motion.span>
  );
};

/** Ink pill that leans toward the cursor; its arrow flies out and back in on hover. */
const MagneticCta = ({ cta, index }: { cta: Nav["cta"]; index: number }) => {
  const { anchorRef, x, y } = useMagnetic<HTMLSpanElement>();
  const drop = useDropIn(index);
  return (
    <motion.span {...drop} className="hidden sm:block">
      <span ref={anchorRef} className="block">
        <motion.a
          href={cta.href}
          style={{ x, y }}
          className="group flex min-h-10 items-center gap-3 rounded-full bg-ink py-1 pr-1 pl-4 text-label font-bold text-paper uppercase transition-colors duration-200 hover:bg-ink/88 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
        >
          {cta.label}
          <span aria-hidden className="relative grid size-7 place-items-center overflow-hidden rounded-full bg-signal">
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

/** Phone menu: a full-screen paper sheet, links stacked massive, rising one by one. */
const MobileMenu = ({ nav, onClose }: { nav: Nav; onClose: () => void }) => {
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sheet.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      // Keep focus inside the sheet.
      if (event.key === "Tab" && sheet.current) {
        const focusable = [...sheet.current.querySelectorAll<HTMLElement>("a, button")];
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
  }, [onClose]);

  return (
    <motion.div
      ref={sheet}
      role="dialog"
      aria-modal="true"
      aria-label={nav.menu}
      initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
      animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
      exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
      transition={{ duration: 0.6, ease: EASE_PRINT }}
      className="fixed inset-0 z-50 flex flex-col bg-paper px-page py-6"
    >
      <RegistrationMark className="absolute top-4 left-4 size-4" />
      <RegistrationMark className="absolute top-4 right-4 size-4" />
      <RegistrationMark className="absolute bottom-4 left-4 size-4" />
      <RegistrationMark className="absolute right-4 bottom-4 size-4" />
      <div className="flex items-center justify-between">
        <AnimatedMonogram className="h-7 w-auto" />
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 px-2 font-technical text-micro uppercase underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ink"
        >
          {nav.close}
        </button>
      </div>
      <ul className="mt-auto mb-auto flex flex-col gap-2">
        {nav.links.map((link, index) => (
          <li key={`${link.href}-${index}`} className="overflow-hidden">
            <motion.a
              href={link.href}
              onClick={onClose}
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ delay: 0.25 + index * 0.08, duration: 0.7, ease: EASE_PRINT }}
              className="flex items-baseline gap-3 text-h1 font-extrabold uppercase focus-visible:underline focus-visible:outline-none"
            >
              <span className="font-technical text-micro text-graphite">0{index + 1}</span>
              {link.label}
            </motion.a>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 font-technical text-micro uppercase">
          <StatusDot />
          {nav.status}
        </span>
        <a
          href={nav.cta.href}
          onClick={onClose}
          className="rounded-full bg-ink px-5 py-3 text-label font-bold whitespace-nowrap text-paper uppercase"
        >
          {nav.cta.label}
        </a>
      </div>
    </motion.div>
  );
};

export const SiteNav = ({ nav }: { nav: Nav }) => {
  const { reducedMotion } = useMotionTheme();
  const { scrollY, scrollYProgress } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [bar, setBar] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useDropIn(1);
  const status = useDropIn(nav.links.length + 1);

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(y > previous && y > HIDE_AFTER);
    setBar(y > BAR_AFTER);
  });

  const close = () => {
    setOpen(false);
    menuButton.current?.focus();
  };

  return (
    <>
      <motion.header
        animate={{ y: hidden && !open && !reducedMotion ? "-130%" : "0%" }}
        transition={{ duration: 0.55, ease: EASE_PRINT }}
        className="fixed inset-x-0 top-0 z-40 px-page"
      >
        {/* Top of the page: an open full-width row. Once the page moves: a floating island. */}
        <div
          className={cn(
            "relative mx-auto transition-[max-width,margin,padding] duration-700 ease-print",
            bar ? "mt-3 max-w-[1120px] py-2 pr-2 pl-5" : "mt-0 max-w-[1440px] py-5 lg:py-6",
          )}
        >
          <motion.div
            aria-hidden
            initial={false}
            animate={{ opacity: bar ? 1 : 0 }}
            transition={{ duration: 0.45, ease: EASE_PRINT }}
            className="absolute inset-0 overflow-hidden rounded-full border border-ink/10 bg-paper/88 shadow-[0_18px_50px_-28px_rgb(0_0_0/0.45)] backdrop-blur-xl backdrop-saturate-150"
          >
            {/* Reading progress along the island's lower edge. */}
            <motion.span
              style={{ scaleX: scrollYProgress }}
              className="absolute inset-x-8 bottom-0 h-0.5 origin-left rounded-full bg-signal"
            />
          </motion.div>
          <div className="relative flex items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="Home"
              className="relative shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              <span className="flex items-center gap-2.5">
                <AnimatedMonogram className="h-6 w-auto sm:h-7" />
                <NavName name={nav.name} />
              </span>
            </Link>
            <DesktopLinks links={nav.links} />
            <div className="flex items-center gap-4">
              <motion.span
                {...status}
                className={cn(
                  "hidden items-center gap-2 font-technical text-micro text-graphite uppercase transition-opacity duration-300 xl:flex",
                  bar && "xl:hidden",
                )}
              >
                <StatusDot />
                {nav.status}
              </motion.span>
              <MagneticCta cta={nav.cta} index={nav.links.length + 2} />
              <motion.button
                {...menu}
                ref={menuButton}
                type="button"
                aria-expanded={open}
                onClick={() => setOpen(true)}
                className="flex min-h-11 items-center gap-2.5 rounded-full border border-ink/15 bg-paper/70 px-4 font-technical text-micro uppercase backdrop-blur-xl focus-visible:outline-2 focus-visible:outline-ink md:hidden"
              >
                <span aria-hidden className="flex w-4 flex-col gap-1">
                  <span className="h-px w-full bg-ink" />
                  <span className="h-px w-2/3 bg-ink" />
                </span>
                {nav.menu}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>{open ? <MobileMenu nav={nav} onClose={close} /> : null}</AnimatePresence>
    </>
  );
};
