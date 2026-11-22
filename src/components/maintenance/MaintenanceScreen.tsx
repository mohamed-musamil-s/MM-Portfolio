import { InkReveal } from "@/components/motion/InkReveal";
import { InkRule } from "@/components/motion/InkRule";
import { Marquee } from "@/components/motion/Marquee";
import { ParallaxLayer } from "@/components/motion/ParallaxLayer";
import { RegistrationMark } from "@/components/motion/RegistrationMark";
import { VelocitySkew } from "@/components/motion/VelocitySkew";
import { XMark } from "@/components/motion/XMark";
import { PosterFrame } from "@/components/public/PosterFrame";
import { SlashLabel } from "@/components/public/SlashLabel";
import { MagicIcon } from "@/components/ui/MagicIcon";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";
import { Countdown } from "./Countdown";
import { PillarRow } from "./PillarRow";

type MaintenanceScreenProps = {
  content: MaintenanceContent;
  /** Window dates, pre-formatted on the server in UTC. */
  windowStartText: string;
  targetText: string;
};

const HEADLINE_DELAY = 0.2;
const LINE_STAGGER = 0.14;

/**
 * /maintenance (docs/screens/MAINTENANCE_BUSINESS.md): a single full-width
 * typographic column. Every string comes from `content` (MongoDB); this file
 * only decides layout and choreography order.
 *
 *   1. Hero: oversized indented headline, rule, body, ink ticker band
 *   2. Instrument: giant countdown + calibration ruler for the window
 *   3. Index: upgrade pillars as full-width rows
 *   4. Footer: mottos, small print, bleeding brush wordmark
 */
export const MaintenanceScreen = ({ content, windowStartText, targetText }: MaintenanceScreenProps) => {
  const { brand, status, headline, timeline } = content;
  const afterHeadline = HEADLINE_DELAY + headline.lines.length * LINE_STAGGER;

  return (
    <main className="relative overflow-x-clip">
      {/* 1 ── Hero */}
      <section className="relative flex min-h-svh flex-col">
        <PosterFrame />

        <header className="absolute inset-x-page top-frame z-20 flex items-center justify-between pt-8">
          <span className="text-label font-bold uppercase">{brand.label}</span>
          <span className="flex items-center gap-2 font-technical text-micro text-graphite uppercase">
            <MagicIcon name="sync" state="loading" size={14} />
            {status.label}
          </span>
        </header>

        <div className="relative flex flex-1 flex-col justify-end gap-10 px-page pt-36 pb-16 lg:gap-12 lg:pb-20">
          <InkReveal className="font-technical text-micro text-graphite uppercase" delay={0.1}>
            {brand.established}
          </InkReveal>

          <VelocitySkew>
            <InkReveal
              as="h1"
              lines={headline.lines}
              delay={HEADLINE_DELAY}
              stagger={LINE_STAGGER}
              className="text-display font-extrabold uppercase"
              lineClassName="pb-[0.04em]"
              lineClassNames={["", "md:pl-24 lg:pl-48"]}
            />
          </VelocitySkew>

          <div className="flex flex-col gap-8 md:pl-24 lg:pl-48">
            <InkRule delay={afterHeadline} className="w-1/2" />
            <InkReveal as="p" className="max-w-[52ch] text-lead" delay={afterHeadline + 0.15}>
              {content.body}
            </InkReveal>
          </div>

          <div className="absolute right-page bottom-24 hidden flex-col items-end gap-3 lg:flex">
            <XMark delay={afterHeadline + 0.5} />
            <XMark delay={afterHeadline + 0.7} className="size-5" />
          </div>
        </div>

        <Marquee label={status.kicker} className="bg-ink py-4 text-paper">
          <span className="flex items-center gap-8 pr-8 text-label font-bold uppercase">
            {status.kicker}
            <RegistrationMark breathe={false} className="text-paper" />
          </span>
        </Marquee>
      </section>

      {/* 2 ── Countdown instrument */}
      <section className="px-page py-24 lg:py-40">
        <Countdown timeline={timeline} startLabel={windowStartText} endLabel={targetText} />
      </section>

      {/* 3 ── Upgrade pillars as an index */}
      <section className="px-page pb-24 lg:pb-40">
        <ul className="border-t border-ink">
          {content.pillars.map((pillar, order) => (
            <PillarRow key={pillar.index} pillar={pillar} order={order} />
          ))}
        </ul>
      </section>

      {/* 4 ── Footer + bleeding wordmark */}
      <footer className="relative">
        <div className="flex flex-col gap-6 px-page pb-8 md:flex-row md:items-end md:justify-between">
          <SlashLabel words={content.mottos.primary} />
          <p className="font-technical text-micro text-graphite uppercase">{content.footer.note}</p>
          <SlashLabel words={content.mottos.secondary} className="md:text-right" />
        </div>
        <ParallaxLayer speed={-0.15} className="pointer-events-none select-none">
          <div className="h-[0.7em] overflow-hidden px-page text-wordmark">
            <InkReveal trigger="inView">
              <p className="-rotate-2 font-brush leading-none whitespace-nowrap">{brand.wordmark}</p>
            </InkReveal>
          </div>
        </ParallaxLayer>
      </footer>
    </main>
  );
};
