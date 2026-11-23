import { AnimatedMonogram } from "@/components/brand/AnimatedMonogram";
import { InkReveal } from "@/components/motion/InkReveal";
import { withSignalStop } from "@/components/public/signal-stop";
import { ActionButton } from "@/components/ui/ActionButton";
import type { NotFoundContent } from "@/lib/shared/content/not-found-schema";
import type { SharedContent } from "@/lib/shared/content/shared-schema";
import { ROUTES } from "@/lib/shared/routes";
import { ErrorCode } from "./ErrorCode";
import { RedirectCountdown } from "./RedirectCountdown";
import { RedirectLine } from "./RedirectLine";
import { RedirectProvider } from "./RedirectProvider";

/**
 * 404 (docs/screens/NOT_FOUND_BUSINESS.md): one viewport, no scrolling.
 *
 *   header   animated monogram (links home) · error status
 *   middle   heading, body, return button + countdown ring | large "Error 404"
 *   footer   orange progress line · note
 *
 * Every string and the countdown length come from `content` (MongoDB).
 */
export const NotFoundScreen = ({ content, shared }: { content: NotFoundContent; shared: SharedContent }) => (
  <RedirectProvider seconds={content.redirect.seconds}>
    <main className="relative isolate grid h-svh grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden px-6 sm:px-10 lg:px-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-ink)_1px,transparent_1px)] bg-size-[calc(100%/12)_100%] opacity-[0.045]" />
        <div className="absolute -top-[25vmax] -right-[20vmax] size-[60vmax] rounded-full bg-signal opacity-[0.08] blur-3xl" />
      </div>

      <header className="flex items-center justify-between py-6 lg:py-10 [@media(max-height:820px)]:lg:py-6">
        <a
          href={ROUTES.home}
          aria-label={content.action.label}
          className="flex items-center outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
        >
          <AnimatedMonogram className="h-8 w-auto sm:h-10" />
        </a>
        <span className="flex items-center gap-3 font-technical text-micro whitespace-nowrap uppercase">
          <span aria-hidden className="size-2 rounded-full bg-signal" />
          {content.display.label} {content.display.code}
        </span>
      </header>

      <div className="grid min-h-0 content-center gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:order-2 lg:col-span-5 lg:col-start-8">
          <ErrorCode label={content.display.label} code={content.display.code} />
        </div>
        <div className="flex flex-col gap-6 lg:order-1 lg:col-span-6 lg:gap-8 [@media(max-height:820px)]:lg:gap-5">
          <InkReveal
            as="h1"
            lines={[withSignalStop(content.heading)]}
            delay={0.2}
            className="text-h2 font-extrabold uppercase sm:text-h1 [@media(max-height:820px)]:lg:text-h2"
            lineClassName="pb-[0.04em]"
          />
          <InkReveal
            as="p"
            className="max-w-[44ch] text-lead text-graphite max-sm:[@media(max-height:700px)]:hidden"
            delay={0.35}
          >
            {content.body}
          </InkReveal>
          <InkReveal delay={0.5}>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
              <ActionButton method="navigate" href={ROUTES.home} variant="editorial-ink" tone="solid">
                {content.action.label}
              </ActionButton>
              <RedirectCountdown labels={content.redirect} />
            </div>
          </InkReveal>
        </div>
      </div>

      <footer className="flex flex-col gap-5 pt-8 pb-6 lg:pb-8 [@media(max-height:820px)]:lg:pt-5">
        <RedirectLine />
        <p className="font-technical text-micro text-graphite uppercase">{shared.footer.note}</p>
      </footer>
    </main>
  </RedirectProvider>
);
