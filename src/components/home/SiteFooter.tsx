"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StatusDot } from "@/components/motion/StatusDot";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { Pill, isExternal } from "./section-kit";

/*
 * Footer "Curtain" (docs/screens/HOME_BUSINESS.md §6.8). The footer sits fixed
 * underneath the page and is uncovered as the page lifts off it (the page has
 * rounded bottom corners and a shadow). As it is uncovered its content rises
 * a little and brightens, and the entrances play: the quote's lines rise, the
 * name's letters rise one by one and the signal dot lands. Contents: a live
 * clock, the quote massive with the closing line in brush and the call to
 * action, the manifesto words, links and socials in rows, the name fitted to
 * the full width, copyright and back to top. When the footer is taller than
 * the screen, or with reduced motion, it is an ordinary footer at the end.
 */

type Footer = HomeContent["footer"];

/** hh:mm:ss in the given time zone, ticking each second (falls back to UTC for an unknown zone). */
const useClock = (timeZone: string) => {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const format = (() => {
      try {
        return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      } catch {
        return new Intl.DateTimeFormat("en-GB", {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }
    })();
    const tick = () => setNow(format.format(new Date()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [timeZone]);
  return now;
};

/** A link whose label rolls up on hover, with an arrow that flies in. */
const FooterLink = ({ href, label, arrow }: { href: string; label: string; arrow: string }) => (
  <a
    href={href}
    target={isExternal(href) ? "_blank" : undefined}
    rel={isExternal(href) ? "noreferrer" : undefined}
    className="group flex items-center gap-2 py-1.5 text-label font-bold uppercase focus-visible:outline-none"
  >
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-500 ease-print group-hover:-translate-y-full group-focus-visible:-translate-y-full">
        {label}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 block translate-y-full text-signal transition-transform duration-500 ease-print group-hover:translate-y-0 group-focus-visible:translate-y-0"
      >
        {label}
      </span>
    </span>
    <span
      aria-hidden
      className="-translate-x-2 opacity-0 transition-all duration-500 ease-print group-hover:translate-x-0 group-hover:opacity-100"
    >
      {arrow}
    </span>
  </a>
);

/** The name fitted to the full width, letters rising one by one, the orange dot landing last. */
const Wordmark = ({ text, play }: { text: string; play: boolean }) => {
  const frame = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    const box = frame.current;
    const line = word.current;
    if (!box || !line) {
      return;
    }
    // Width scales linearly with the font size, so one measurement at the current size gives the fitted size.
    const fit = () => {
      const current = Number.parseFloat(getComputedStyle(line).fontSize) || 100;
      setSize((current * box.clientWidth) / Math.max(1, line.scrollWidth));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    void document.fonts.ready.then(fit);
    return () => observer.disconnect();
  }, [text]);

  const letters = Array.from(text);
  return (
    <div ref={frame} aria-label={text} className="w-full overflow-hidden">
      <motion.span
        ref={word}
        aria-hidden
        initial="hidden"
        animate={play ? "shown" : "hidden"}
        style={size ? { fontSize: `${size}px` } : undefined}
        className="flex w-max font-wide leading-[0.82] font-semibold tracking-[-0.03em] whitespace-pre uppercase"
      >
        {letters.map((letter, index) => (
          <span key={`${letter}-${index}`} className="block overflow-hidden pb-[0.04em]">
            <motion.span
              className="block"
              variants={{
                hidden: { y: "105%" },
                shown: { y: "0%", transition: { delay: index * 0.035, duration: 0.9, ease: EASE_PRINT } },
              }}
            >
              {letter}
            </motion.span>
          </span>
        ))}
        <span className="flex items-end pb-[0.09em] pl-[0.04em]">
          <motion.span
            className="block size-[0.17em] rounded-full bg-signal"
            variants={{
              hidden: { scale: 0 },
              shown: {
                scale: 1,
                transition: { delay: letters.length * 0.035 + 0.25, type: "spring", stiffness: 420, damping: 22 },
              },
            }}
          />
        </span>
      </motion.span>
    </div>
  );
};

export const SiteFooter = ({ footer }: { footer: Footer }) => {
  const clock = useClock(footer.clock.timeZone);
  const { reducedMotion } = useMotionTheme();
  const panel = useRef<HTMLElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [fits, setFits] = useState(false);
  const [play, setPlay] = useState(false);
  const curtain = fits && !reducedMotion;

  // The curtain only works when the whole footer fits on the screen.
  useLayoutEffect(() => {
    const element = panel.current;
    if (!element) {
      return;
    }
    const measure = () => {
      setHeight(element.offsetHeight);
      setFits(element.offsetHeight <= window.innerHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // How much of the footer is uncovered (0–1); in the ordinary layout, how far it has scrolled into view.
  const { scrollYProgress } = useScroll({
    target: curtain ? spacer : panel,
    offset: ["start end", "end end"],
  });
  const lift = useTransform(scrollYProgress, [0, 1], curtain ? ["16%", "0%"] : ["0%", "0%"]);
  const shade = useTransform(scrollYProgress, [0, 1], curtain ? [0.7, 0] : [0, 0]);
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (value > 0.35) {
      setPlay(true);
    }
  });

  const lines = footer.quote.split(". ");

  return (
    <>
      {/* The room the page leaves at its end, through which the fixed footer is seen. */}
      {curtain ? <div ref={spacer} aria-hidden style={{ height }} /> : null}
      <footer
        ref={panel}
        className={cn(
          "overflow-hidden bg-ink px-page pt-[clamp(1.75rem,5svh,3.5rem)] pb-5 text-paper",
          curtain ? "fixed inset-x-0 bottom-0 z-0" : "relative",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-[30vw] left-1/2 size-[70vw] -translate-x-1/2 rounded-full bg-signal/[0.12] blur-[140px]"
        />
        <motion.div
          style={{ y: lift }}
          className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[clamp(1.25rem,4svh,2.75rem)]"
        >
          <div className="flex items-center justify-between border-t border-paper/20 pt-3 font-technical text-micro text-paper/60 uppercase">
            <span>{footer.eyebrow}</span>
            <span className="flex items-center gap-2">
              <StatusDot />
              {footer.clock.label}
              <span className="text-paper tabular-nums">{clock ?? "--:--:--"}</span>
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
            <div className="flex flex-col gap-3">
              <h2 className="font-wide text-[clamp(2rem,min(5vw,8svh),4.8rem)] leading-[0.95] font-semibold tracking-[-0.02em] uppercase">
                {lines.map((part, index) => (
                  <span key={index} className="block overflow-hidden pb-[0.05em]">
                    <motion.span
                      className={cn(
                        "block",
                        index === 1 && "text-ink [-webkit-text-stroke:max(1.25px,0.012em)_var(--bg-primary)]",
                      )}
                      initial={{ y: "105%" }}
                      animate={{ y: play ? "0%" : "105%" }}
                      transition={{ delay: index * 0.12, duration: 1, ease: EASE_PRINT }}
                    >
                      {index < lines.length - 1 ? `${part}.` : part}
                    </motion.span>
                  </span>
                ))}
              </h2>
              <span className="font-technical text-micro text-paper/55 uppercase">{footer.quoteSource}</span>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <span className="-rotate-3 font-brush text-[clamp(1.8rem,2.6vw,2.6rem)] leading-none">
                {footer.closing}
              </span>
              <Pill href={footer.cta.href} tone="paper" icon="→">
                {footer.cta.label}
              </Pill>
            </div>
          </div>

          {/* Manifesto, links and socials as rows. */}
          <div className="grid gap-6 border-t border-paper/12 pt-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {footer.manifesto.map((item, index) => (
                <span key={`${item.word}-${index}`} className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "font-wide text-lg font-semibold uppercase",
                      item.outline && "text-ink [-webkit-text-stroke:1px_var(--bg-primary)]",
                    )}
                  >
                    {item.word}
                  </span>
                  <span className="font-technical text-[0.6rem] text-signal uppercase">{item.index}</span>
                </span>
              ))}
            </div>
            <nav aria-label="Footer" className="flex flex-col">
              <span className="mb-1 font-technical text-micro text-paper/50 uppercase">{footer.linksLabel}</span>
              <span className="flex flex-wrap gap-x-5">
                {footer.links.map((link) => (
                  <FooterLink key={link.href} href={link.href} label={link.label} arrow="→" />
                ))}
              </span>
            </nav>
            <div className="flex flex-col">
              <span className="mb-1 font-technical text-micro text-paper/50 uppercase">{footer.socialsLabel}</span>
              <span className="flex flex-wrap gap-x-5">
                {footer.socials.map((link) => (
                  <FooterLink key={link.href} href={link.href} label={link.label} arrow="↗" />
                ))}
              </span>
            </div>
          </div>

          <Wordmark text={footer.wordmark} play={play} />

          <div className="flex items-center justify-between gap-4 font-technical text-micro text-paper/55 uppercase">
            <span>{footer.copyright}</span>
            <a
              href="#top"
              className="group flex items-center gap-3 hover:text-paper focus-visible:text-paper focus-visible:outline-none"
            >
              {footer.backToTop}
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-full border border-paper/25 text-paper transition-colors duration-300 group-hover:border-signal group-hover:bg-signal"
              >
                ↑
              </span>
            </a>
          </div>
        </motion.div>
        {/* Still in shadow while the page is lifting off it. */}
        <motion.div aria-hidden style={{ opacity: shade }} className="pointer-events-none absolute inset-0 bg-ink" />
      </footer>
    </>
  );
};
