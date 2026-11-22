import type { ReactNode } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { InkReveal } from "@/components/motion/InkReveal";
import { StatusDot } from "@/components/motion/StatusDot";
import { withSignalStop } from "@/components/public/signal-stop";
import type { MaintenanceContent } from "@/lib/shared/content/maintenance-schema";
import { CheckAgain } from "./CheckAgain";
import { Countdown } from "./Countdown";
import { LiveCheckFooter } from "./LiveCheckFooter";
import { LiveCheckProvider } from "./LiveCheckProvider";
import { MaintenanceIllustration } from "./MaintenanceIllustration";
import { WindowRuler } from "./WindowRuler";

type MaintenanceScreenProps = {
  content: MaintenanceContent;
  /** Window dates, pre-formatted on the server in UTC. */
  windowStartText: string;
  targetText: string;
};

const HEADLINE_DELAY = 0.2;
const LINE_STAGGER = 0.14;

/** The last headline line's trailing full stop becomes the signal-orange accent. */
const headlineLines = (lines: readonly string[]): ReactNode[] =>
  lines.map((line, index) => (index === lines.length - 1 ? withSignalStop(line) : line));

/**
 * /maintenance (docs/screens/MAINTENANCE_BUSINESS.md): one viewport, no
 * scrolling, clean ivory canvas, signal orange as the single accent.
 *
 *   header   MM. monogram + brand label · live status (orange beacon)
 *   middle   kicker, headline, short text, check-again, countdown | maintenance storyboard
 *   ruler    window timeline (orange elapsed line + now dot)
 *   footer   last checked · next check (polls every minute) · note
 *
 * Every string comes from `content` (MongoDB).
 */
export const MaintenanceScreen = ({ content, windowStartText, targetText }: MaintenanceScreenProps) => {
  const { brand, status, headline, timeline } = content;
  const afterHeadline = HEADLINE_DELAY + headline.lines.length * LINE_STAGGER;

  return (
    <LiveCheckProvider>
      <main className="relative isolate grid h-svh grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden px-6 sm:px-10 lg:px-16">
        {/* Background: faint 12-column rules + one soft signal glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-ink)_1px,transparent_1px)] bg-size-[calc(100%/12)_100%] opacity-[0.045]" />
          <div className="absolute -right-[20vmax] -bottom-[25vmax] size-[60vmax] rounded-full bg-signal opacity-[0.09] blur-3xl" />
        </div>

        <header className="flex items-center justify-between py-6 lg:py-10 [@media(max-height:820px)]:lg:py-6">
          <div className="flex items-center gap-4">
            <Monogram className="h-6 w-auto" />
            <span className="hidden text-label font-bold whitespace-nowrap uppercase sm:inline">{brand.label}</span>
          </div>
          <span className="flex items-center gap-3 font-technical text-micro whitespace-nowrap uppercase">
            <StatusDot />
            {status.label}
          </span>
        </header>

        <div className="grid min-h-0 items-center gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-6 lg:gap-8 [@media(max-height:820px)]:lg:gap-4">
            <InkReveal className="font-technical text-micro text-graphite uppercase" delay={0.1}>
              {status.kicker}
            </InkReveal>
            <InkReveal
              as="h1"
              lines={headlineLines(headline.lines)}
              delay={HEADLINE_DELAY}
              stagger={LINE_STAGGER}
              className="text-h2 font-extrabold uppercase sm:text-h1 [@media(max-height:820px)]:lg:text-h2"
              lineClassName="pb-[0.04em]"
            />
            {/* Short phones keep the essentials: headline, button and countdown. */}
            <InkReveal
              as="p"
              className="max-w-[44ch] text-lead text-graphite max-lg:[@media(max-height:720px)]:hidden"
              delay={afterHeadline}
            >
              {content.body}
            </InkReveal>
            {/* Not inside an InkReveal mask: its halo, brackets and shockwaves draw outside the pill. */}
            <CheckAgain labels={content.liveCheck} revealDelay={afterHeadline + 0.1} />
            <InkReveal className="pt-2 [@media(max-height:820px)]:pt-0" delay={afterHeadline + 0.2}>
              <Countdown timeline={timeline} />
            </InkReveal>
          </div>

          <div className="relative hidden h-full max-h-[34rem] min-h-0 flex-col justify-center lg:col-span-5 lg:col-start-8 lg:flex">
            <MaintenanceIllustration illustration={content.illustration} className="min-h-0 flex-1" />
          </div>
        </div>

        <div className="pt-8 pb-6 lg:pt-10 lg:pb-8 [@media(max-height:820px)]:lg:pt-6 [@media(max-height:820px)]:lg:pb-5">
          <WindowRuler
            windowStart={timeline.windowStart}
            targetAt={timeline.targetAt}
            startLabel={windowStartText}
            endLabel={targetText}
          />
        </div>

        <LiveCheckFooter labels={content.liveCheck} note={content.footer.note} />
      </main>
    </LiveCheckProvider>
  );
};
