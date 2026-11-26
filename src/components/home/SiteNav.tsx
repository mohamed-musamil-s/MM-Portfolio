"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
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
 * page it is a transparent row; scrolling down hides it, scrolling back up
 * brings it back as a blurred paper bar. Links are poster-style labels
 * separated by slashes: on hover the letters roll up and an orange dot marks
 * the link. The monogram on the left is where the splash lands its logo.
 */

type Nav = HomeContent["nav"];

const HIDE_AFTER = 160;
const BAR_AFTER = 24;
const LETTER_STAGGER = 0.018;
const DOT_SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

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

const DesktopLinks = ({ links }: { links: Nav["links"] }) => {
  const [active, setActive] = useState<number | null>(null);
  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul onPointerLeave={() => setActive(null)} className="flex items-center gap-1">
        {links.map((link, index) => (
          <Fragment key={`${link.href}-${index}`}>
            {index > 0 ? (
              <li aria-hidden className="px-1 text-label font-bold text-ink/25">
                /
              </li>
            ) : null}
            <NavLink link={link} index={index} active={active === index} onActive={setActive} />
          </Fragment>
        ))}
      </ul>
    </nav>
  );
};

const NavLink = ({
  link,
  index,
  active,
  onActive,
}: {
  link: Nav["links"][number];
  index: number;
  active: boolean;
  onActive: (index: number | null) => void;
}) => {
  const drop = useDropIn(index + 1);
  return (
    <motion.li {...drop}>
      <a
        href={link.href}
        aria-label={link.label}
        onPointerEnter={() => onActive(index)}
        onFocus={() => onActive(index)}
        onBlur={() => onActive(null)}
        className="relative flex flex-col items-center px-2 py-2 text-label font-bold uppercase focus-visible:outline-none"
      >
        <RollingLabel text={link.label} active={active} />
        <span className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2">
          {active ? (
            <motion.span
              layoutId="nav-dot"
              transition={DOT_SPRING}
              className="block size-full rounded-full bg-signal"
            />
          ) : null}
        </span>
      </a>
    </motion.li>
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
          className="group flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-label font-bold text-paper uppercase transition-colors duration-200 hover:bg-ink/88 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
        >
          {cta.label}
          <span aria-hidden className="relative inline-block size-[1em] overflow-hidden">
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
        <AnimatedMonogram className="h-8 w-auto" />
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
          className="rounded-full bg-ink px-5 py-3 text-label font-bold text-paper uppercase"
        >
          {nav.cta.label}
        </a>
      </div>
    </motion.div>
  );
};

export const SiteNav = ({ nav }: { nav: Nav }) => {
  const { reducedMotion } = useMotionTheme();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [bar, setBar] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const status = useDropIn(nav.links.length + 1);
  const menu = useDropIn(1);

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
        animate={{ y: hidden && !open && !reducedMotion ? "-110%" : "0%" }}
        transition={{ duration: 0.55, ease: EASE_PRINT }}
        className="fixed inset-x-0 top-0 z-40"
      >
        {/* The blurred bar fades in behind the row once the page has moved. */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{ opacity: bar ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE_PRINT }}
          className="absolute inset-0 border-b border-ink/10 bg-paper/70 shadow-[0_10px_40px_-24px_rgb(0_0_0/0.35)] backdrop-blur-xl backdrop-saturate-150"
        />
        <div
          className={cn(
            "relative flex items-center justify-between gap-4 px-page transition-[padding] duration-500 ease-print",
            bar ? "py-3" : "py-5 lg:py-7",
          )}
        >
          <Link
            href="/"
            aria-label="Home"
            className="relative shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <AnimatedMonogram className="h-8 w-auto sm:h-10" />
          </Link>
          <DesktopLinks links={nav.links} />
          <div className="flex items-center gap-5">
            <motion.span {...status} className="hidden items-center gap-2 font-technical text-micro uppercase lg:flex">
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
              className="min-h-11 rounded-full border border-ink/15 bg-paper/70 px-4 font-technical text-micro uppercase backdrop-blur-xl focus-visible:outline-2 focus-visible:outline-ink md:hidden"
            >
              {nav.menu}
            </motion.button>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>{open ? <MobileMenu nav={nav} onClose={close} /> : null}</AnimatePresence>
    </>
  );
};
