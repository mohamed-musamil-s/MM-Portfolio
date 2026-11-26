"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useId, useRef, useState, type PointerEvent } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { MaskRise, Reveal, ScrollInk, Section, SectionHeader } from "./section-kit";

/*
 * Recognition (docs/screens/HOME_BUSINESS.md §6.5), an editorial index.
 * Awards: numbered rows with the titles huge. On the way in each row's
 * hairline draws across and its title rises through a mask. Hovering (fine
 * pointers), focusing or tapping a row floods it ink from the bottom, slides
 * the title over and opens what the award was for; on desktop a round badge
 * sticker with a turning ring of text follows the cursor over the list.
 * Education: the same rows, led by the years. Kind words: each quote full
 * width and huge, inking in word by word with the scroll.
 */

type Recognition = HomeContent["recognition"];

type Row = {
  key: string;
  lead: string;
  title: string;
  meta: string;
  tail: string;
  badge: string;
  detail: string;
};

const FOLLOW_SPRING = { stiffness: 260, damping: 26, mass: 0.6 } as const;
/** Where the sticker sits relative to the pointer (px). */
const STICKER_OFFSET = 28;
/** The sticker's diameter (px), matching size-24. */
const STICKER_SIZE = 96;

const pad = (value: number) => String(value).padStart(2, "0");

const Label = ({ children }: { children: string }) => (
  <Reveal y={0} className="mb-4 flex items-center gap-3 font-technical text-micro text-graphite uppercase">
    <span aria-hidden className="h-px w-8 bg-signal" />
    {children}
  </Reveal>
);

/** The round sticker that follows the pointer: the badge, and a ring of text turning around it. */
const Sticker = ({ row }: { row: Row }) => {
  const ring = useId();
  return (
    <span className="relative grid size-24 place-items-center rounded-full bg-signal text-paper shadow-[0_20px_40px_-20px_rgb(0_0_0/0.5)]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-[spin_12s_linear_infinite]">
        <defs>
          <path id={ring} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current font-technical text-[7px] uppercase" letterSpacing="1.4">
          <textPath href={`#${ring}`} textLength="236">
            {`${row.meta} • ${row.tail || row.title} • `}
          </textPath>
        </text>
      </svg>
      <span className="font-wide text-xl font-semibold">{row.badge}</span>
    </span>
  );
};

const IndexRow = ({
  row,
  index,
  open,
  onOpen,
  onToggle,
}: {
  row: Row;
  index: number;
  open: boolean;
  onOpen: (index: number) => void;
  onToggle: (index: number) => void;
}) => {
  const detailId = `${row.key}-detail`;
  // A mouse opens rows by hovering, so its click only keeps the row open; a tap or a key toggles it.
  const lastPointer = useRef("");
  const hasDetail = row.detail.length > 0;
  return (
    <li className="relative">
      {/* The hairline draws across on the way in. */}
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={{ delay: index * 0.07, duration: 1, ease: EASE_PRINT }}
        className="absolute inset-x-0 top-0 h-px origin-left bg-ink/20"
      />
      {/* The flood: ink rising from the bottom of the open row. */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scaleY: open ? 1 : 0 }}
        transition={{ duration: 0.55, ease: EASE_PRINT }}
        className="absolute inset-0 origin-bottom bg-ink"
      />
      <button
        type="button"
        aria-expanded={hasDetail ? open : undefined}
        aria-controls={hasDetail ? detailId : undefined}
        onPointerEnter={(event) => event.pointerType === "mouse" && onOpen(index)}
        onPointerDown={(event) => {
          lastPointer.current = event.pointerType;
        }}
        onFocus={(event) => event.currentTarget.matches(":focus-visible") && onOpen(index)}
        onClick={() => {
          if (lastPointer.current === "mouse") {
            onOpen(index);
          } else {
            onToggle(index);
          }
          lastPointer.current = "";
        }}
        className={cn(
          "relative grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-2 py-6 text-left transition-colors duration-500 ease-print focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal sm:px-4 lg:grid-cols-[4rem_minmax(0,1fr)_16rem_7rem]",
          open ? "text-paper" : "text-ink",
        )}
      >
        <span className="font-technical text-micro text-signal">{row.lead}</span>
        <motion.span
          animate={{ x: open ? 16 : 0 }}
          transition={{ duration: 0.5, ease: EASE_PRINT }}
          className="font-wide text-[clamp(1.25rem,3.2vw,3rem)] leading-[1] font-semibold tracking-[-0.01em] uppercase"
        >
          <MaskRise delay={index * 0.07 + 0.1}>{row.title}</MaskRise>
        </motion.span>
        <span
          className={cn(
            "hidden font-technical text-micro uppercase lg:block",
            open ? "text-paper/60" : "text-graphite",
          )}
        >
          {row.meta}
        </span>
        <span className="flex items-center justify-end gap-3">
          <span className={cn("font-technical text-micro", open ? "text-paper/60" : "text-graphite")}>{row.tail}</span>
          {hasDetail ? (
            <motion.span
              aria-hidden
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ duration: 0.4, ease: EASE_PRINT }}
              className="text-xl leading-none"
            >
              +
            </motion.span>
          ) : null}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && hasDetail ? (
          <motion.div
            id={detailId}
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_PRINT }}
            className="relative overflow-hidden"
          >
            <p className="grid gap-4 px-2 pb-7 text-paper/70 sm:px-4 lg:grid-cols-[4rem_minmax(0,1fr)_16rem_7rem]">
              <span aria-hidden className="hidden lg:block" />
              <span className="max-w-[60ch] pl-4 font-glyph text-[1.05rem] leading-relaxed">
                <span className="mr-3 font-technical text-micro text-signal uppercase lg:hidden">{row.meta}</span>
                {row.detail}
              </span>
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
};

/** A list of index rows; one opens at a time. On fine pointers a sticker follows the cursor over it. */
const IndexList = ({ rows }: { rows: Row[] }) => {
  const [open, setOpen] = useState<number | null>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, FOLLOW_SPRING);
  const y = useSpring(pointerY, FOLLOW_SPRING);
  const current = open === null ? null : rows[open];

  const onPointerMove = (event: PointerEvent<HTMLUListElement>) => {
    // Above and to the right of the cursor, so it never sits on the title being read.
    pointerX.set(event.clientX + STICKER_OFFSET);
    pointerY.set(event.clientY - STICKER_OFFSET - STICKER_SIZE);
  };

  return (
    <>
      <ul
        onPointerMove={fine ? onPointerMove : undefined}
        onPointerLeave={(event) => event.pointerType === "mouse" && setOpen(null)}
        className="relative border-b border-ink/20"
      >
        {rows.map((row, index) => (
          <IndexRow
            key={row.key}
            row={row}
            index={index}
            open={open === index}
            onOpen={setOpen}
            onToggle={(value) => setOpen((currentOpen) => (currentOpen === value ? null : value))}
          />
        ))}
      </ul>
      {fine ? (
        <motion.div aria-hidden style={{ x, y }} className="pointer-events-none fixed top-0 left-0 z-30">
          <AnimatePresence>
            {current ? (
              <motion.div
                key={current.key}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 30 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
              >
                <Sticker row={current} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </>
  );
};

export const Recognition = ({ recognition }: { recognition: Recognition }) => {
  const awards: Row[] = recognition.awards.map((award, index) => ({
    key: `award-${index}`,
    lead: pad(index + 1),
    title: award.title,
    meta: award.org,
    tail: award.year ?? "",
    badge: award.badge,
    detail: award.text ?? "",
  }));
  const schools: Row[] = recognition.education.map((school, index) => ({
    key: `school-${index}`,
    lead: school.badge,
    title: school.title,
    meta: school.org,
    tail: school.year,
    badge: school.badge,
    detail: "",
  }));

  return (
    <Section id="recognition" className="bg-newsprint/40">
      <SectionHeader header={recognition.header} />

      {awards.length > 0 ? (
        <div className="flex flex-col">
          <Label>{recognition.awardsLabel}</Label>
          <IndexList rows={awards} />
        </div>
      ) : null}

      {schools.length > 0 ? (
        <div className="mt-[clamp(3.5rem,9svh,6rem)] flex flex-col">
          <Label>{recognition.educationLabel}</Label>
          <IndexList rows={schools} />
        </div>
      ) : null}

      {recognition.quotes.length > 0 ? (
        <div className="mt-[clamp(4rem,11svh,7rem)] flex flex-col gap-[clamp(3rem,8svh,5rem)]">
          <Label>{recognition.quotesLabel}</Label>
          {recognition.quotes.map((quote, index) => (
            <figure
              key={index}
              className={cn("flex max-w-[64rem] flex-col gap-5", index % 2 === 1 && "self-end text-right")}
            >
              <span aria-hidden className="font-wide text-[5rem] leading-[0.5] text-signal">
                “
              </span>
              <ScrollInk
                text={quote.quote}
                className="font-wide text-[clamp(1.6rem,3.6vw,3.4rem)] leading-[1.05] font-semibold tracking-[-0.015em] text-balance uppercase"
              />
              <figcaption className="font-technical text-micro text-graphite uppercase">— {quote.source}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </Section>
  );
};
