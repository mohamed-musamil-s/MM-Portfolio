"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { MONOGRAM_LETTERS, MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { MaskRise, Pill, Reveal, isExternal } from "./section-kit";

/*
 * Footer "Horizon" (docs/screens/HOME_BUSINESS.md §6.7): the dark finale. The
 * manifesto words ink in one by one (the middle one in outline), the quote,
 * the closing line and a call to action, then links, socials, the copyright,
 * a giant monogram and "back to top".
 */

type Footer = HomeContent["footer"];

export const SiteFooter = ({ footer }: { footer: Footer }) => (
  <footer className="relative overflow-hidden bg-ink px-page pt-[clamp(4.5rem,12svh,8rem)] pb-8 text-paper">
    <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[clamp(3rem,9svh,6rem)]">
      <Reveal y={0} className="border-t border-paper/20 pt-3 font-technical text-micro text-paper/60 uppercase">
        {footer.eyebrow}
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-3">
        {footer.manifesto.map((item, index) => (
          <div key={`${item.word}-${index}`} className="flex flex-col gap-3">
            <MaskRise
              delay={index * 0.14}
              className={cn(
                "block font-wide text-[clamp(2.4rem,3.6vw,4.4rem)] leading-none font-semibold tracking-[-0.02em] uppercase",
                item.outline && "text-ink [-webkit-text-stroke:max(1.25px,0.012em)_var(--bg-primary)]",
              )}
            >
              {item.word}
            </MaskRise>
            <Reveal delay={0.3 + index * 0.1} className="flex flex-col gap-1">
              <span className="font-technical text-micro text-signal uppercase">{item.index}</span>
              <span className="font-glyph text-paper/70">{item.text}</span>
            </Reveal>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <Reveal className="flex max-w-[40rem] flex-col gap-3">
          <p className="font-wide text-[clamp(1.4rem,2.6vw,2.4rem)] leading-tight font-semibold uppercase">
            {footer.quote}
          </p>
          <p className="font-technical text-micro text-paper/60 uppercase">{footer.quoteSource}</p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col items-start gap-4 lg:items-end">
          <span className="font-brush text-3xl text-paper">{footer.closing}</span>
          <Pill href={footer.cta.href} tone="paper" icon="→">
            {footer.cta.label}
          </Pill>
        </Reveal>
      </div>

      <div className="flex flex-col gap-6 border-t border-paper/20 pt-6 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {footer.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-label font-bold uppercase underline-offset-4 hover:underline"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {footer.socials.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={isExternal(link.href) ? "_blank" : undefined}
              rel="noreferrer"
              className="font-technical text-micro uppercase underline-offset-4 hover:underline"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>

      {/* Giant monogram, rising as the page ends. */}
      <motion.svg
        aria-hidden
        viewBox={`0 0 ${MONOGRAM_VIEWBOX.width} ${MONOGRAM_VIEWBOX.height}`}
        initial={{ y: "30%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE_PRINT }}
        className="w-full"
      >
        <path d={MONOGRAM_LETTERS} className="fill-paper/[0.07]" />
        <circle cx="398" cy="154" r="16" className="fill-signal" />
      </motion.svg>

      <div className="flex items-center justify-between font-technical text-micro text-paper/60 uppercase">
        <span>{footer.copyright}</span>
        <a href="#top" className="underline-offset-4 hover:text-paper hover:underline">
          {footer.backToTop}
        </a>
      </div>
    </div>
  </footer>
);
