"use client";

import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StatusDot } from "@/components/motion/StatusDot";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { Pill, Reveal, isExternal } from "./section-kit";

/*
 * Footer "Horizon" (docs/screens/HOME_BUSINESS.md §6.7): the dark finale.
 * Top: the quote massive, with the closing line in brush, the call to action
 * and a live local clock. Middle: navigation, elsewhere and the manifesto in
 * three tidy columns. Bottom: the name as a wordmark fitted to the full width,
 * its letters rising one by one and ending in the orange dot; copyright and a
 * round "back to top".
 */

type Footer = HomeContent["footer"];

const VIEW = { once: true, margin: "0px 0px -8% 0px" } as const;

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
    className="group flex items-center justify-between gap-4 border-b border-paper/12 py-3 text-label font-bold uppercase focus-visible:outline-none"
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
const Wordmark = ({ text }: { text: string }) => {
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
        whileInView="shown"
        viewport={VIEW}
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
  return (
    <footer className="relative overflow-hidden bg-ink px-page pt-[clamp(4.5rem,12svh,8rem)] pb-6 text-paper">
      {/* A soft signal aura low on the horizon. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[30vw] left-1/2 size-[70vw] -translate-x-1/2 rounded-full bg-signal/[0.12] blur-[140px]"
      />
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[clamp(3rem,9svh,6rem)]">
        <Reveal
          y={0}
          className="flex items-center justify-between border-t border-paper/20 pt-3 font-technical text-micro uppercase"
        >
          <span className="text-paper/60">{footer.eyebrow}</span>
          <span className="flex items-center gap-2 text-paper/60">
            <StatusDot />
            {footer.clock.label}
            <span className="text-paper tabular-nums">{clock ?? "--:--:--"}</span>
          </span>
        </Reveal>

        {/* Quote and the way in. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end">
          <div className="flex flex-col gap-4">
            <h2 className="font-wide text-[clamp(2.2rem,5.6vw,5.4rem)] leading-[0.95] font-semibold tracking-[-0.02em] uppercase">
              {footer.quote.split(". ").map((part, index, parts) => (
                <span key={index} className="block overflow-hidden pb-[0.05em]">
                  <motion.span
                    className={cn(
                      "block",
                      index === 1 && "text-ink [-webkit-text-stroke:max(1.25px,0.012em)_var(--bg-primary)]",
                    )}
                    initial={{ y: "105%" }}
                    whileInView={{ y: "0%" }}
                    viewport={VIEW}
                    transition={{ delay: index * 0.12, duration: 1, ease: EASE_PRINT }}
                  >
                    {index < parts.length - 1 ? `${part}.` : part}
                  </motion.span>
                </span>
              ))}
            </h2>
            <Reveal delay={0.2} y={10} className="font-technical text-micro text-paper/55 uppercase">
              {footer.quoteSource}
            </Reveal>
          </div>
          <Reveal delay={0.15} className="flex flex-col items-start gap-5 lg:items-end">
            <span className="-rotate-3 font-brush text-[clamp(2rem,3vw,2.8rem)] leading-none">{footer.closing}</span>
            <Pill href={footer.cta.href} tone="paper" icon="→">
              {footer.cta.label}
            </Pill>
          </Reveal>
        </div>

        {/* Three tidy columns. */}
        <div className="grid gap-10 md:grid-cols-3">
          <Reveal className="flex flex-col">
            <span className="mb-3 font-technical text-micro text-paper/50 uppercase">{footer.linksLabel}</span>
            <nav aria-label="Footer" className="flex flex-col">
              {footer.links.map((link) => (
                <FooterLink key={link.href} href={link.href} label={link.label} arrow="→" />
              ))}
            </nav>
          </Reveal>
          <Reveal delay={0.08} className="flex flex-col">
            <span className="mb-3 font-technical text-micro text-paper/50 uppercase">{footer.socialsLabel}</span>
            {footer.socials.map((link) => (
              <FooterLink key={link.href} href={link.href} label={link.label} arrow="↗" />
            ))}
          </Reveal>
          <Reveal delay={0.16} className="flex flex-col gap-4">
            {footer.manifesto.map((item, index) => (
              <div key={`${item.word}-${index}`} className="flex flex-col gap-1 border-b border-paper/12 pb-3">
                <span className="flex items-baseline justify-between gap-3">
                  <span
                    className={cn(
                      "font-wide text-xl font-semibold uppercase",
                      item.outline && "text-ink [-webkit-text-stroke:1px_var(--bg-primary)]",
                    )}
                  >
                    {item.word}
                  </span>
                  <span className="font-technical text-micro text-signal uppercase">{item.index}</span>
                </span>
                <span className="font-glyph text-[0.9rem] text-paper/60">{item.text}</span>
              </div>
            ))}
          </Reveal>
        </div>

        {/* The name, edge to edge. */}
        <Wordmark text={footer.wordmark} />

        <div className="flex items-center justify-between gap-4 font-technical text-micro text-paper/55 uppercase">
          <span>{footer.copyright}</span>
          <a
            href="#top"
            className="group flex items-center gap-3 hover:text-paper focus-visible:text-paper focus-visible:outline-none"
          >
            {footer.backToTop}
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-full border border-paper/25 text-paper transition-colors duration-300 group-hover:border-signal group-hover:bg-signal"
            >
              ↑
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};
