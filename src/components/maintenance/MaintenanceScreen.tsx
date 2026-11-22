import type { ReactNode } from "react";
import { InkReveal } from "@/components/motion/InkReveal";
import { StatusDot } from "@/components/motion/StatusDot";
import { SlashLabel } from "@/components/public/SlashLabel";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";
import { BuildScene } from "./BuildScene";
import { Countdown } from "./Countdown";
import { PillarColumn } from "./PillarColumn";
import { WindowRuler } from "./WindowRuler";

type MaintenanceScreenProps = {
  content: MaintenanceContent;
  /** Window dates, pre-formatted on the server in UTC. */
  windowStartText: string;
  targetText: string;
};

const HEADLINE_DELAY = 0.2;
const LINE_STAGGER = 0.14;

/** A trailing full stop on the last headline line becomes the signal-orange square (presentation only). */
const withSignalStop = (lines: readonly string[]): ReactNode[] =>
  lines.map((line, index) =>
    index === lines.length - 1 && line.endsWith(".") ? (
      <>
        {line.slice(0, -1)}
        <span className="text-signal">.</span>
      </>
    ) : (
      line
    ),
  );

/**
 * /maintenance (docs/screens/MAINTENANCE_BUSINESS.md): one viewport, no
 * scrolling, clean ivory canvas with a single signal-orange accent.
 *
 *   header   brand tile + label · live status (orange beacon)
 *   middle   left: kicker, headline, body, countdown | right: animated scene
 *   ruler    full-width window timeline (orange elapsed line + now dot)
 *   pillars  three columns (orange hover rule)
 *   footer   mottos · established · note
 *
 * Every string comes from `content` (MongoDB).
 */
export const MaintenanceScreen = ({ content, windowStartText, targetText }: MaintenanceScreenProps) => {
  const { brand, status, headline, timeline } = content;
  const afterHeadline = HEADLINE_DELAY + headline.lines.length * LINE_STAGGER;
  const initial = brand.wordmark.charAt(0);

  return (
    <main className="relative isolate grid h-svh grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] overflow-hidden px-6 sm:px-10 lg:px-16">
      {/* Background: faint 12-column rules + one soft signal glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-ink)_1px,transparent_1px)] bg-size-[calc(100%/12)_100%] opacity-[0.045]" />
        <div className="absolute -right-[20vmax] -bottom-[25vmax] size-[60vmax] rounded-full bg-signal opacity-[0.09] blur-3xl" />
      </div>

      <header className="flex items-center justify-between py-5 lg:py-8 [@media(max-height:820px)]:lg:py-5">
        <div className="flex items-center gap-3">
          <span aria-hidden className="relative grid size-9 place-items-center bg-ink text-label font-extrabold text-paper uppercase">
            {initial}
            <span className="absolute right-1.5 bottom-1.5 size-1.5 bg-signal" />
          </span>
          <span className="hidden text-label font-bold whitespace-nowrap uppercase sm:inline">{brand.label}</span>
        </div>
        <span className="flex items-center gap-3 font-technical text-micro whitespace-nowrap uppercase">
          <StatusDot />
          {status.label}
        </span>
      </header>

      <div className="grid min-h-0 items-center gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-7 lg:gap-7 [@media(max-height:820px)]:lg:gap-4">
          <InkReveal className="max-w-[56ch] font-technical text-micro text-graphite uppercase" delay={0.1}>
            {status.kicker}
          </InkReveal>
          <InkReveal
            as="h1"
            lines={withSignalStop(headline.lines)}
            delay={HEADLINE_DELAY}
            stagger={LINE_STAGGER}
            className="text-h2 font-extrabold uppercase sm:text-h1 [@media(max-height:820px)]:lg:text-h2"
            lineClassName="pb-[0.04em]"
          />
          <InkReveal
            as="p"
            className="max-w-[52ch] text-lead text-graphite max-lg:[@media(max-height:720px)]:hidden"
            delay={afterHeadline}
          >
            {content.body}
          </InkReveal>
          <InkReveal delay={afterHeadline + 0.15}>
            <Countdown timeline={timeline} />
          </InkReveal>
        </div>

        <figure className="relative hidden h-full min-h-0 flex-col gap-4 py-4 lg:col-span-5 lg:flex">
          <BuildScene className="min-h-0 flex-1 text-ink" />
          <SlashLabel
            words={content.mottos.secondary}
            className="self-end font-technical text-micro font-normal text-graphite"
          />
        </figure>
      </div>

      <div className="pt-6 lg:pt-8 [@media(max-height:820px)]:lg:pt-5">
        <WindowRuler
          windowStart={timeline.windowStart}
          targetAt={timeline.targetAt}
          startLabel={windowStartText}
          endLabel={targetText}
        />
      </div>

      <ul className="grid gap-x-10 gap-y-3 pt-5 sm:grid-cols-3 lg:pt-8 [@media(max-height:820px)]:lg:pt-5">
        {content.pillars.map((pillar, order) => (
          <PillarColumn key={pillar.index} pillar={pillar} delay={afterHeadline + 0.35 + order * 0.1} />
        ))}
      </ul>

      <footer className="flex items-center justify-between gap-4 py-5 font-technical text-micro text-graphite uppercase lg:py-6 [@media(max-height:820px)]:lg:py-4">
        <SlashLabel words={content.mottos.primary} className="font-technical text-micro font-normal" />
        <span className="hidden sm:inline">{brand.established}</span>
        <span className="hidden md:inline">{content.footer.note}</span>
      </footer>
    </main>
  );
};
