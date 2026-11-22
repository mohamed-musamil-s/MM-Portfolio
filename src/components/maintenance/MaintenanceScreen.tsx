import { CalibrationRig } from "@/components/motion/CalibrationRig";
import { InkReveal } from "@/components/motion/InkReveal";
import { InkRule } from "@/components/motion/InkRule";
import { Marquee } from "@/components/motion/Marquee";
import { RegistrationMark } from "@/components/motion/RegistrationMark";
import { PosterFrame } from "@/components/public/PosterFrame";
import { SlashLabel } from "@/components/public/SlashLabel";
import { MagicIcon } from "@/components/ui/MagicIcon";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";
import { BuildScene } from "./BuildScene";
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
 * /maintenance (docs/screens/MAINTENANCE_BUSINESS.md): exactly one viewport,
 * no scrolling. Left: all copy, countdown and pillars. Right: an ink panel
 * with the animated "portfolio under reconstruction" scene. On small screens
 * the panel becomes a top band. Every string comes from `content` (MongoDB).
 */
export const MaintenanceScreen = ({ content, windowStartText, targetText }: MaintenanceScreenProps) => {
  const { brand, status, headline, timeline } = content;
  const afterHeadline = HEADLINE_DELAY + headline.lines.length * LINE_STAGGER;

  return (
    <main className="grid h-svh grid-rows-[24svh_1fr] overflow-hidden lg:grid-cols-12 lg:grid-rows-1">
      {/* ── Left: content ─────────────────────────────────────────── */}
      <section
        // [@media(max-height:820px)] steps spacing down so short laptop screens still fit without scrolling.
        className="relative order-2 flex min-h-0 flex-col gap-3 px-6 pt-4 pb-4 sm:px-10 lg:gap-4 lg:order-1 lg:col-span-7 lg:px-16 lg:py-14 [@media(max-height:820px)]:lg:gap-3 [@media(max-height:820px)]:lg:py-9"
      >
        <div className="hidden lg:block">
          <PosterFrame edges={false} />
        </div>

        <header className="flex items-center justify-between gap-4">
          <span className="text-label font-bold uppercase">{brand.label}</span>
          <InkReveal className="font-technical text-micro text-graphite uppercase" delay={0.1}>
            {brand.established}
          </InkReveal>
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 lg:gap-6 [@media(max-height:820px)]:lg:gap-3.5">
          <div className="flex flex-col gap-3 lg:gap-4 [@media(max-height:820px)]:lg:gap-2.5">
            <InkReveal
              as="h1"
              lines={headline.lines}
              delay={HEADLINE_DELAY}
              stagger={LINE_STAGGER}
              className="text-h2 font-extrabold uppercase lg:text-h1 [@media(max-height:820px)]:lg:text-h2"
              lineClassName="pb-[0.04em]"
              lineClassNames={["", "pl-6 lg:pl-16"]}
            />
            <InkRule delay={afterHeadline} className="w-1/2" />
          </div>

          {/* On very short phones the countdown and pillars take priority over the paragraph. */}
          <InkReveal
            as="p"
            className="max-w-[48ch] text-body text-graphite max-lg:[@media(max-height:720px)]:hidden"
            delay={afterHeadline + 0.1}
          >
            {content.body}
          </InkReveal>

          <InkReveal delay={afterHeadline + 0.25}>
            <Countdown timeline={timeline} startLabel={windowStartText} endLabel={targetText} />
          </InkReveal>

          <ul className="border-t border-ink">
            {content.pillars.map((pillar, order) => (
              <PillarRow key={pillar.index} pillar={pillar} delay={afterHeadline + 0.45 + order * 0.1} />
            ))}
          </ul>
        </div>

        <footer className="flex items-end justify-between gap-4">
          <SlashLabel words={content.mottos.primary} />
          <p className="hidden font-technical text-micro text-graphite uppercase sm:block">{content.footer.note}</p>
        </footer>
      </section>

      {/* ── Right: ink panel with the animated scene ──────────────── */}
      <section className="@container relative order-1 overflow-hidden bg-ink text-paper lg:order-2 lg:col-span-5">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(var(--bg-primary)_1px,transparent_1.5px)] bg-size-[9px_9px] opacity-10 mask-[radial-gradient(ellipse_at_70%_35%,black,transparent_75%)]"
        />

        <div className="absolute inset-x-6 top-5 z-10 flex items-center justify-end gap-2 font-technical text-micro uppercase lg:top-10 lg:right-10">
          <MagicIcon name="sync" state="loading" size={14} />
          {status.label}
        </div>

        <CalibrationRig className="absolute -top-6 -left-6 w-24 text-paper opacity-80 lg:-top-10 lg:-left-10 lg:w-44" />

        <BuildScene className="absolute inset-x-6 top-12 bottom-16 lg:inset-x-12 lg:top-24 lg:bottom-40" />

        <SlashLabel
          words={content.mottos.secondary}
          className="absolute top-1/2 right-3 hidden -translate-y-1/2 rotate-180 font-technical text-micro font-normal [writing-mode:vertical-rl] lg:block"
        />

        <div className="absolute bottom-12 left-6 z-10 lg:bottom-16 lg:left-12">
          <InkReveal delay={afterHeadline + 0.6}>
            {/* Sized to the panel width (container query units) because the wordmark is variable-length DB text. */}
            <p className="-rotate-6 font-brush text-[min(13cqi,9rem)] leading-none whitespace-nowrap select-none">
              {brand.wordmark}
            </p>
          </InkReveal>
        </div>

        <Marquee label={status.kicker} className="absolute inset-x-0 bottom-0 bg-paper py-2 text-ink lg:py-3">
          <span className="flex items-center gap-6 pr-6 text-label font-bold uppercase">
            {status.kicker}
            <RegistrationMark breathe={false} className="size-4 text-ink sm:size-4" />
          </span>
        </Marquee>
      </section>
    </main>
  );
};
