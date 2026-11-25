import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/shared/cn";
import type { SplashContent } from "@/lib/shared/content/splash-schema";
import { MONOGRAM_LETTERS, MONOGRAM_VIEWBOX } from "@/lib/shared/brand/monogram";
import type { Bind } from "./splash-kit";

/*
 * Static markup of every splash scene. Nothing here moves on its own: each
 * element registers under a key and splash-paint.ts writes its styles from
 * time. Moving text starts below its mask (BELOW) and anything that grows
 * starts hidden (HIDDEN), so the server HTML never flashes a finished frame.
 */

export const BELOW: CSSProperties = { transform: "translate3d(0, 110%, 0)" };
export const HIDDEN: CSSProperties = { visibility: "hidden" };
const FADED: CSSProperties = { opacity: 0 };

export const FLOOD_COLORS = ["bg-signal", "bg-ink", "bg-paper", "bg-ink", "bg-paper"] as const;
export const DESIGN_BLOCKS = 10;

type SceneProps = { content: SplashContent; bind: Bind };
type EndProps = SceneProps & { onEnter: () => void };

/* ---------- Small parts ---------- */

/** A line in its own mask; `-end` marks where its last letter ends, on the baseline. */
const Masked = ({
  id,
  bind,
  className,
  children,
}: {
  id: string;
  bind: Bind;
  className?: string;
  children: ReactNode;
}) => (
  <span className={cn("relative block overflow-hidden py-[0.08em] pr-[0.3em] pl-[0.05em]", className)}>
    <span ref={bind(id)} style={BELOW} className="block whitespace-pre">
      {children}
      <span ref={bind(`${id}-end`)} className="inline-block size-0" />
    </span>
  </span>
);

/** A giant word whose letters roll in and out one by one. */
const Rolling = ({ id, word, bind, className }: { id: string; word: string; bind: Bind; className?: string }) => (
  <span className={cn("relative block overflow-hidden py-[0.06em] pr-[0.3em] pl-[0.05em]", className)}>
    <span ref={bind(id)} className="block whitespace-pre">
      {Array.from(word).map((letter, index) => (
        <span key={`${letter}-${index}`} ref={bind(`${id}-${index}`)} style={BELOW} className="inline-block">
          {letter}
        </span>
      ))}
      <span ref={bind(`${id}-end`)} className="inline-block size-0" />
    </span>
  </span>
);

/** "[ lead key ]" in the technical face, brackets and key in the accent. */
const Bracketed = ({ lead, accent }: { lead: string; accent?: string }) => (
  <>
    <span className="text-signal">[ </span>
    {lead}
    {accent ? <span className="text-signal"> {accent}</span> : null}
    <span className="text-signal"> ]</span>
  </>
);

/** A one-line caption rising through its mask (`-end` marks where it ends, on the baseline). */
const Caption = ({
  id,
  bind,
  children,
  className,
}: {
  id: string;
  bind: Bind;
  children: ReactNode;
  className?: string;
}) => (
  <span className={cn("relative block overflow-hidden font-technical", className)}>
    <span ref={bind(id)} style={BELOW} className="block whitespace-pre">
      {children}
      <span ref={bind(`${id}-end`)} className="inline-block size-0" />
    </span>
  </span>
);

const Lights = ({ bind, id, tone }: { bind: Bind; id: string; tone: "paper" | "ink" }) => (
  <span className="flex items-center gap-[0.45em]">
    {/* The first light is where the dot lands; the dot itself is drawn over it. */}
    <span ref={bind(id)} className="size-[0.7em] rounded-full" />
    <span className={cn("size-[0.7em] rounded-full", tone === "ink" ? "bg-paper/20" : "bg-ink/15")} />
    <span className={cn("size-[0.7em] rounded-full", tone === "ink" ? "bg-paper/20" : "bg-ink/15")} />
  </span>
);

const Bar = ({ className }: { className: string }) => <span className={cn("block rounded-full", className)} />;

export const Monogram = ({ className }: { className?: string }) => (
  <svg
    viewBox={`0 0 ${MONOGRAM_VIEWBOX.width} ${MONOGRAM_VIEWBOX.height}`}
    className={cn("block size-full", className)}
  >
    <path d={MONOGRAM_LETTERS} className="fill-ink" />
  </svg>
);

const Cursor = ({ bind }: { bind: Bind }) => (
  <svg
    ref={bind("cursor")}
    viewBox="0 0 24 24"
    style={HIDDEN}
    className="pointer-events-none absolute top-0 left-0 size-[clamp(18px,2vw,28px)] origin-top-left"
  >
    <path
      d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.2 L17.5 13 Z"
      className="fill-ink stroke-paper"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

/* ---------- Scenes ---------- */

const HookScene = ({ content, bind }: SceneProps) => (
  <>
    <div className="absolute inset-0 flex items-center justify-center">
      <Caption id="intro" bind={bind}>
        {content.intro.lead} <span className="text-signal">{content.intro.key}</span>
      </Caption>
    </div>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <Caption id="bracket" bind={bind}>
        <Bracketed lead={content.bracket} />
      </Caption>
      {/* Both words share one grid cell, so the stack is as wide as the wider one. */}
      <div ref={bind("stack")} className="relative grid leading-none font-extrabold tracking-tighter">
        <Rolling id="hello" word={content.hello} bind={bind} className="col-start-1 row-start-1 justify-self-center" />
        <Rolling
          id="name"
          word={content.name.first}
          bind={bind}
          className="col-start-1 row-start-1 justify-self-center"
        />
      </div>
    </div>
  </>
);

const LoadingScene = ({ content, bind }: SceneProps) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.2em]">
    <Caption id="load-caption" bind={bind}>
      <Bracketed lead={content.loading} />
    </Caption>
    <span className="relative block overflow-hidden">
      <span
        ref={bind("counter")}
        style={BELOW}
        className="block leading-none font-extrabold tracking-tighter tabular-nums"
      >
        100%
      </span>
    </span>
    <span
      ref={bind("bar")}
      style={FADED}
      className="relative block h-[max(6px,0.7vh)] w-[min(64vw,620px)] rounded-full bg-ink/10"
    >
      <span
        ref={bind("bar-fill")}
        style={{ transform: "scaleX(0)" }}
        className="absolute inset-0 origin-left rounded-full bg-ink"
      />
    </span>
  </div>
);

const MomentsScene = ({ content, bind }: SceneProps) => {
  const words = [content.moments.first, content.moments.second, content.moments.third];
  return (
    <>
      {words.map((word, index) => (
        <div
          key={`moment-${index}`}
          ref={bind(`moment-${index}-slot`)}
          className={cn(
            "absolute inset-0 flex items-center justify-center leading-none font-extrabold tracking-tighter uppercase",
            index === 1 ? "text-paper" : "text-ink",
          )}
        >
          <Masked id={`moment-${index}`} bind={bind}>
            {content.moments.lead} {word}
          </Masked>
        </div>
      ))}
    </>
  );
};

const DesignScene = ({ content, bind }: SceneProps) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6em]">
    <Caption id="design-caption" bind={bind}>
      <Bracketed lead={content.design.lead} accent={content.design.key} />
    </Caption>
    <div
      ref={bind("window")}
      style={HIDDEN}
      className="relative flex aspect-[4/5] w-[min(86vw,52vh)] flex-col overflow-hidden rounded-[1em] border border-ink/10 bg-paper text-[clamp(9px,1.1vw,15px)] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.35)] sm:aspect-[16/10] sm:w-[min(86vw,940px,104vh)]"
    >
      <div className="flex items-center gap-[1em] border-b border-ink/8 px-[1.1em] py-[0.8em]">
        <Lights bind={bind} id="window-light" tone="paper" />
        <Bar className="h-[1.3em] w-[40%] bg-ink/6" />
      </div>
      <div className="grid flex-1 grid-cols-1 gap-[1.4em] p-[1.6em] sm:grid-cols-[1fr_32%]">
        <div className="flex flex-col gap-[1.2em]">
          <div ref={bind("block-0")} className="flex origin-left items-center justify-between">
            <Bar className="h-[1.2em] w-[5em] bg-ink" />
            <span className="flex gap-[1em]">
              <Bar className="h-[0.6em] w-[3em] bg-ink/20" />
              <Bar className="h-[0.6em] w-[3em] bg-ink/20" />
              <Bar className="h-[0.6em] w-[3em] bg-ink/20" />
            </span>
          </div>
          <div className="relative flex items-start gap-[1.4em]">
            <div className="flex flex-1 flex-col gap-[0.7em]">
              <Bar className="h-[2.2em] w-[92%] origin-left bg-ink" />
              <span ref={bind("block-1")} className="block origin-left">
                <Bar className="h-[2.2em] w-[70%] bg-ink" />
              </span>
              <span ref={bind("block-2")} className="block origin-left">
                <Bar className="h-[0.7em] w-[80%] bg-ink/20" />
              </span>
              <span ref={bind("block-3")} className="mt-[0.4em] block origin-left">
                <Bar className="h-[2.4em] w-[9em] bg-ink" />
              </span>
            </div>
            <div
              ref={bind("slot")}
              className="hidden aspect-[4/3] w-[34%] rounded-[0.8em] border-2 border-dashed border-ink/25 sm:block"
            />
          </div>
          <div className="mt-auto grid grid-cols-3 gap-[1em]">
            {[4, 5, 6].map((block) => (
              <div
                key={block}
                ref={bind(`block-${block}`)}
                className="flex aspect-[4/3] origin-bottom flex-col justify-end gap-[0.4em] rounded-[0.8em] bg-ink/6 p-[0.8em]"
              >
                <Bar className="h-[0.6em] w-[70%] bg-ink/25" />
                <Bar className="h-[0.6em] w-[45%] bg-ink/15" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden flex-col justify-between rounded-[0.8em] border border-ink/8 p-[1.2em] sm:flex">
          <span
            ref={bind("block-7")}
            className="block origin-top-left text-[5.4em] leading-none font-extrabold tracking-tighter"
          >
            Aa
          </span>
          <div ref={bind("block-8")} className="grid origin-left grid-cols-4 gap-[0.5em]">
            <span className="aspect-square rounded-full bg-ink" />
            <span className="aspect-square rounded-full bg-graphite" />
            <span className="aspect-square rounded-full border border-ink/15 bg-newsprint" />
            <span className="aspect-square rounded-full bg-signal" />
          </div>
          <span ref={bind("block-9")} className="block origin-left">
            <Bar className="h-[0.6em] w-full bg-ink/15" />
          </span>
        </div>
      </div>
    </div>
  </div>
);

const CodeScene = ({ content, bind }: SceneProps) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6em]">
    <Caption id="code-caption" bind={bind}>
      <Bracketed lead={content.code.caption.lead} accent={content.code.caption.key} />
    </Caption>
    <div className="flex w-[min(90vw,1040px)] flex-col items-stretch gap-[14vw] text-[clamp(10px,1.15vw,15px)] sm:flex-row sm:items-center sm:gap-[8%]">
      <div
        ref={bind("terminal")}
        style={HIDDEN}
        className="flex flex-1 flex-col rounded-[1em] bg-ink font-technical text-paper shadow-[0_30px_80px_-30px_rgb(0_0_0/0.5)]"
      >
        <div className="flex items-center justify-between border-b border-paper/10 px-[1.1em] py-[0.8em]">
          <Lights bind={bind} id="terminal-light" tone="ink" />
          <span className="text-[0.85em] text-paper/40">zsh</span>
        </div>
        <div className="flex min-h-[9em] flex-col gap-[0.6em] p-[1.3em]">
          {content.code.lines.map((line, index) => (
            <div key={`${line}-${index}`} className="flex items-center whitespace-pre">
              <span className="text-signal">› </span>
              <span
                ref={bind(`code-${index}`)}
                style={{ width: "0ch" }}
                className="inline-block overflow-hidden align-bottom whitespace-pre"
              >
                {line}
              </span>
              <span
                ref={bind(`caret-${index}`)}
                style={HIDDEN}
                className="ml-[0.1em] inline-block h-[1.1em] w-[0.55em] bg-paper/80"
              />
            </div>
          ))}
        </div>
      </div>
      <div
        ref={bind("live")}
        style={HIDDEN}
        className="flex flex-1 flex-col overflow-hidden rounded-[1em] border border-ink/10 bg-paper shadow-[0_30px_80px_-30px_rgb(0_0_0/0.35)]"
      >
        <div className="flex items-center gap-[1em] border-b border-ink/8 px-[1.1em] py-[0.8em]">
          <span className="flex gap-[0.45em]">
            <span className="size-[0.7em] rounded-full bg-ink/15" />
            <span className="size-[0.7em] rounded-full bg-ink/15" />
            <span className="size-[0.7em] rounded-full bg-ink/15" />
          </span>
          <Bar className="h-[1.3em] flex-1 bg-ink/6" />
        </div>
        <div className="flex flex-col gap-[0.6em] p-[1.3em]">
          <Bar className="h-[1.6em] w-[70%] bg-ink" />
          <Bar className="h-[0.6em] w-[85%] bg-ink/15" />
          <Bar className="h-[0.6em] w-[60%] bg-ink/15" />
          <div className="mt-[0.6em] flex items-center gap-[0.6em] font-technical text-[0.9em]">
            <span ref={bind("live-light")} className="size-[0.8em] rounded-full" />
            <span className="relative block overflow-hidden">
              <span ref={bind("live-status")} style={BELOW} className="block">
                {content.code.status} ✓
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
    <svg className="pointer-events-none absolute inset-0 size-full overflow-visible">
      <path
        ref={bind("connect")}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="invisible stroke-ink/35"
      />
    </svg>
  </div>
);

const MatrixScene = ({ content, bind }: SceneProps) => (
  <>
    {/* The stack scene's hub circle sits under the mark the matrix condenses into. */}
    <div
      ref={bind("hub-ring")}
      style={HIDDEN}
      className="absolute top-0 left-0 rounded-full border border-ink/10 bg-paper"
    />
    <div ref={bind("logo")} style={HIDDEN} className="absolute top-0 left-0">
      <Monogram />
    </div>
    <div ref={bind("detail")} className="absolute inset-x-0 flex justify-center">
      <Caption id="detail-text" bind={bind}>
        <Bracketed lead={content.detail.lead} accent={content.detail.key} />
      </Caption>
    </div>
  </>
);

const StackScene = ({ content, bind }: SceneProps) => (
  <>
    <svg className="pointer-events-none absolute inset-0 size-full overflow-visible">
      {content.stack.skills.map((skill, index) => (
        <path
          key={`${skill}-${index}`}
          ref={bind(`link-${index}`)}
          fill="none"
          strokeWidth="1.5"
          className="invisible stroke-ink/25"
        />
      ))}
    </svg>
    {content.stack.skills.map((skill, index) => (
      <span
        key={`${skill}-${index}`}
        ref={bind(`chip-${index}`)}
        style={HIDDEN}
        className="absolute top-0 left-0 flex items-center gap-[0.55em] rounded-full border border-ink/10 bg-paper px-[1em] py-[0.55em] text-[1.05em] font-semibold whitespace-nowrap shadow-[0_10px_30px_-12px_rgb(0_0_0/0.25)]"
      >
        <span className="size-[0.55em] rounded-full bg-ink/25" />
        {skill}
      </span>
    ))}
    <div className="absolute inset-x-0 top-[12%] flex justify-center">
      <span className="relative block overflow-hidden">
        <span
          ref={bind("stack-title")}
          style={BELOW}
          className="block text-[2em] font-bold tracking-tight whitespace-pre"
        >
          {content.stack.title.lead} <span className="text-signal">{content.stack.title.key}</span>
        </span>
      </span>
    </div>
    <div className="absolute inset-x-0 bottom-[12%] flex justify-center">
      <span
        ref={bind("stack-pill")}
        style={HIDDEN}
        className="rounded-full bg-ink px-[1.2em] py-[0.5em] font-technical text-[0.95em] text-paper"
      >
        {content.stack.note}
      </span>
    </div>
  </>
);

const StatementsScene = ({ content, bind }: SceneProps) => (
  <>
    {content.tags.map((tag, index) => (
      <span
        key={`${tag}-${index}`}
        ref={bind(`tag-${index}`)}
        style={FADED}
        className="absolute top-0 left-0 flex items-center gap-[0.5em] rounded-full border border-paper/15 bg-paper/5 px-[0.9em] py-[0.4em] font-technical text-paper/60"
      >
        <span className="text-signal">✓</span>
        {tag}
      </span>
    ))}
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        ref={bind("statements")}
        className="relative flex flex-col pl-[0.5em] leading-none font-extrabold tracking-tighter text-paper uppercase"
      >
        <span
          ref={bind("rule")}
          style={{ transform: "scaleY(0)" }}
          className="absolute top-0 bottom-0 left-[-0.75em] w-[0.06em] origin-top rounded-full bg-signal"
        />
        {content.statements.map((line, index) => (
          <Masked key={`${line}-${index}`} id={`statement-${index}`} bind={bind}>
            {line}
          </Masked>
        ))}
      </div>
    </div>
  </>
);

const EndScene = ({ content, bind, onEnter }: EndProps) => (
  <>
    <div ref={bind("mark")} style={HIDDEN} className="absolute top-0 left-0">
      <Monogram />
    </div>
    <div ref={bind("end")} className="absolute inset-0 flex flex-col items-center justify-center">
      <div
        ref={bind("end-row")}
        className="flex items-center gap-[0.35em] leading-none font-extrabold tracking-tighter"
      >
        <span ref={bind("end-mark")} className="block h-[0.78em] w-[1.9em] shrink-0" />
        <Masked id="end-name" bind={bind}>
          {content.name.first} {content.name.last}
        </Masked>
      </div>
      <p
        ref={bind("tagline")}
        style={FADED}
        className="mt-[0.5em] max-w-[90vw] text-center text-[length:max(14px,0.3em)] font-semibold tracking-tight text-pretty"
      >
        {content.tagline.lead} <span className="text-signal">{content.tagline.key}</span>
      </p>
      <div className="mt-[0.8em] flex flex-col items-center gap-[0.6em] sm:flex-row sm:gap-[1.2em]">
        <button
          ref={bind("pill")}
          type="button"
          tabIndex={-1}
          onClick={onEnter}
          style={HIDDEN}
          className="rounded-full px-[1.3em] py-[0.65em] text-[length:max(14px,0.22em)] font-semibold tracking-tight text-paper"
        >
          {content.cta} →
        </button>
        <span
          ref={bind("label")}
          style={FADED}
          className="font-technical text-[length:max(11px,0.17em)] tracking-[0.14em] text-graphite uppercase"
        >
          {content.label}
        </span>
      </div>
    </div>
  </>
);

/** Every scene, in paint order. `onEnter`: the call to action was clicked. */
export const Scenes = ({ content, bind, onEnter }: EndProps) => (
  <>
    <HookScene content={content} bind={bind} />
    <LoadingScene content={content} bind={bind} />
    <MomentsScene content={content} bind={bind} />
    <DesignScene content={content} bind={bind} />
    <CodeScene content={content} bind={bind} />
    <MatrixScene content={content} bind={bind} />
    <StackScene content={content} bind={bind} />
    <StatementsScene content={content} bind={bind} />
    <EndScene content={content} bind={bind} onEnter={onEnter} />
    <Cursor bind={bind} />
  </>
);
