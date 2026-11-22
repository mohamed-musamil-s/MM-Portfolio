import { CalibrationRig } from "@/components/motion/CalibrationRig";
import { InkReveal } from "@/components/motion/InkReveal";
import { InkRule } from "@/components/motion/InkRule";
import { ParallaxLayer } from "@/components/motion/ParallaxLayer";
import { XMark } from "@/components/motion/XMark";
import { PosterFrame } from "@/components/public/PosterFrame";
import { SlashLabel } from "@/components/public/SlashLabel";
import { MagicIcon } from "@/components/ui/MagicIcon";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";
import { Countdown } from "./Countdown";
import { GridPlate } from "./GridPlate";
import { PillarCard } from "./PillarCard";
import { PortraitPlate } from "./PortraitPlate";
import { StampMark } from "./StampMark";

export type MaintenanceAssets = { portrait: boolean; gridPlate: boolean; stamp: boolean };

type MaintenanceScreenProps = {
  content: MaintenanceContent;
  assets: MaintenanceAssets;
  windowText: string;
};

/**
 * /maintenance composition (docs/screens/MAINTENANCE_BUSINESS.md). Every
 * string comes from `content` (MongoDB); this file only decides layout and
 * choreography order.
 */
export const MaintenanceScreen = ({ content, assets, windowText }: MaintenanceScreenProps) => {
  const { brand, status, headline, timeline, images } = content;
  const headlineDelay = 0.25;
  const afterHeadline = headlineDelay + headline.lines.length * 0.12;

  return (
    <main className="relative overflow-x-clip">
      {/* ── Hero: one viewport, the poster ─────────────────────────── */}
      <section className="relative grid min-h-svh grid-cols-4 content-end gap-x-6 gap-y-12 px-page pt-28 pb-20 md:grid-cols-8 lg:grid-cols-12 lg:pt-32">
        <PosterFrame />

        <header className="absolute inset-x-page top-frame z-20 flex items-center justify-between pt-8">
          <span className="text-label font-bold uppercase">{brand.label}</span>
          <span className="flex items-center gap-2 font-technical text-micro text-graphite uppercase">
            <MagicIcon name="sync" state="loading" size={14} />
            {status.label}
          </span>
        </header>

        {/* Depth stack: grid plate, portrait, stamp, calibration rig */}
        <div className="relative col-span-4 mb-10 md:col-span-6 md:col-start-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mb-0">
          <ParallaxLayer speed={0.3} depth={-16} className="absolute -top-10 -right-6 -z-10 h-[110%] w-[95%]">
            <GridPlate image={images.gridPlate} available={assets.gridPlate} />
          </ParallaxLayer>
          <ParallaxLayer speed={0.12} depth={8} className="ml-auto lg:w-[88%]">
            <PortraitPlate image={images.portrait} available={assets.portrait} />
          </ParallaxLayer>
          <ParallaxLayer speed={0.22} depth={14} className="absolute -top-8 -left-6 w-24 lg:-left-12 lg:w-32">
            <StampMark image={images.stamp} available={assets.stamp} lines={content.stamp.lines} />
          </ParallaxLayer>
          <ParallaxLayer speed={-0.1} depth={-12} className="absolute -top-14 -right-8 w-32 sm:w-40 lg:-top-16 lg:-right-16 lg:w-52">
            <CalibrationRig />
          </ParallaxLayer>
          {/* Brush wordmark crosses the bottom of the art, as on the poster; never over other text. */}
          <ParallaxLayer speed={-0.12} className="pointer-events-none absolute -bottom-10 -left-4 z-10 lg:-bottom-14 lg:-left-16">
            <InkReveal delay={0.9}>
              <p className="-rotate-6 font-brush text-display leading-none select-none">{brand.wordmark}</p>
            </InkReveal>
          </ParallaxLayer>
          <div className="absolute top-1/3 -right-2 hidden flex-col gap-3 lg:-right-14 lg:flex">
            <XMark delay={1.2} />
            <XMark delay={1.45} className="size-5 self-end" />
          </div>
        </div>

        {/* Type column */}
        <div className="relative z-10 col-span-4 flex flex-col gap-8 md:col-span-8 lg:col-span-7 lg:row-start-1 lg:self-end">
          <InkReveal className="max-w-[48ch] font-technical text-micro text-graphite uppercase" delay={0.1}>
            {status.kicker}
          </InkReveal>
          <div className="flex flex-col gap-4">
            <InkReveal
              as="h1"
              lines={headline.lines}
              delay={headlineDelay}
              stagger={0.12}
              className="text-h1 font-extrabold uppercase"
              lineClassName="pb-[0.04em]"
            />
            <InkRule delay={afterHeadline} />
            <InkReveal className="text-label font-bold uppercase" delay={afterHeadline + 0.1}>
              {brand.established}
            </InkReveal>
          </div>
          <InkReveal delay={afterHeadline + 0.25}>
            <Countdown timeline={timeline} windowText={windowText} />
          </InkReveal>
        </div>

      </section>

      {/* ── Narrative + upgrade pillars ────────────────────────────── */}
      <section className="relative px-page py-24 lg:py-48">
        <div className="grid grid-cols-4 gap-6 md:grid-cols-8 lg:grid-cols-12">
          <InkReveal as="p" trigger="inView" className="col-span-4 max-w-[68ch] text-lead md:col-span-6 lg:col-span-7 lg:col-start-2">
            {content.body}
          </InkReveal>
        </div>
        <ul className="mt-16 grid border-t border-rule md:grid-cols-3 lg:mt-24">
          {content.pillars.map((pillar, order) => (
            <PillarCard key={pillar.index} pillar={pillar} order={order} />
          ))}
        </ul>
      </section>

      {/* ── Footer: poster mottos ──────────────────────────────────── */}
      <footer className="relative flex flex-col gap-6 border-t border-rule px-page py-12 md:flex-row md:items-end md:justify-between">
        <SlashLabel words={content.mottos.primary} />
        <p className="font-technical text-micro text-graphite uppercase">{content.footer.note}</p>
        <SlashLabel words={content.mottos.secondary} className="md:text-right" />
      </footer>
    </main>
  );
};
